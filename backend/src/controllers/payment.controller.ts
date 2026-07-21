import { Request, Response } from 'express';
import { MomoService } from '../services/momo.service';
import prisma from '../services/prisma.service';
import { MailService } from '../services/mail.service';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

export class PaymentController {
  /**
   * Tạo URL thanh toán MoMo và redirect
   * POST /api/payments/momo/create
   * Body: { orderId, amount, orderInfo }
   */
  public static async createMomoPayment(req: Request, res: Response) {
    const { orderId, amount, orderInfo } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({ message: 'Vui lòng cung cấp mã đơn hàng và số tiền.' });
    }

    try {
      // Kiểm tra đơn hàng tồn tại
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) {
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
      }

      const redirectUrl = `${FRONTEND_URL}/checkout/result`;
      const info = orderInfo || `TechStore - Thanh toán đơn hàng #${orderId.substring(0, 8).toUpperCase()}`;

      const result = await MomoService.createPaymentUrl(
        orderId,
        Math.round(amount), // MoMo yêu cầu số nguyên VNĐ
        info,
        redirectUrl
      );

      if (result.success) {
        return res.status(200).json({
          success: true,
          payUrl: result.payUrl,
          qrCodeUrl: result.qrCodeUrl,
          requestId: result.requestId,
        });
      } else {
        return res.status(400).json({
          success: false,
          message: result.message || 'Không thể kết nối đến cổng thanh toán MoMo.',
        });
      }
    } catch (error: any) {
      console.error('Create MoMo payment error:', error);
      return res.status(500).json({ message: 'Lỗi hệ thống khi tạo thanh toán MoMo.' });
    }
  }

  /**
   * MoMo IPN Callback — MoMo gọi về để xác nhận thanh toán
   * POST /api/payments/momo/ipn
   */
  public static async momoIpnCallback(req: Request, res: Response) {
    try {
      const { resultCode, orderId: momoOrderId, amount, extraData } = req.body;

      // Xác thực chữ ký IPN
      const isValid = MomoService.verifyIpnSignature(req.body);
      if (!isValid) {
        console.error('MoMo IPN: Invalid signature', req.body);
        return res.status(400).json({ message: 'Chữ ký không hợp lệ.' });
      }

      // Giải mã extraData để lấy orderId thực sự
      let realOrderId = momoOrderId;
      try {
        const decoded = JSON.parse(Buffer.from(extraData, 'base64').toString('utf-8'));
        if (decoded.orderId) realOrderId = decoded.orderId;
      } catch {
        // Fallback: parse từ momoOrderId format: "PARTNERCODE-ORDERID-TIMESTAMP"
        const parts = momoOrderId.split('-');
        if (parts.length >= 3) {
          realOrderId = parts.slice(1, -1).join('-');
        }
      }

      if (resultCode === 0) {
        // Thanh toán thành công — cập nhật đơn hàng
        const order = await prisma.order.findFirst({
          where: {
            OR: [
              { id: realOrderId },
              { id: { contains: realOrderId.substring(0, 8) } }
            ]
          },
          include: { items: { include: { product: true } } }
        });

        if (order) {
          await prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'PAID' }
          });

          // Gửi email xác nhận
          MailService.sendOrderConfirmationEmail(order.customerEmail, {
            id: order.id,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            customerAddress: order.customerAddress,
            totalAmount: order.totalAmount,
            discountAmount: order.discountAmount,
            paymentMethod: 'MOMO',
            items: order.items.map(item => ({
              productName: item.product?.name || 'Sản phẩm',
              quantity: item.quantity,
              price: item.price,
            }))
          });

          console.log(`MoMo IPN: Order ${order.id} marked as PAID`);
        }
      } else {
        // Thanh toán thất bại — cập nhật trạng thái FAILED và hoàn lại tồn kho
        console.warn(`MoMo IPN: Payment failed for order ${realOrderId}, resultCode=${resultCode}`);
        
        const failedOrder = await prisma.order.findFirst({
          where: {
            OR: [
              { id: realOrderId },
              { id: { contains: realOrderId.substring(0, 8) } }
            ]
          },
          include: { items: true }
        });

        if (failedOrder && failedOrder.paymentStatus !== 'FAILED') {
          await prisma.$transaction(async (tx) => {
            // Cập nhật trạng thái thanh toán thất bại
            await tx.order.update({
              where: { id: failedOrder.id },
              data: { paymentStatus: 'FAILED', orderStatus: 'CANCELLED' }
            });

            // Hoàn lại tồn kho
            for (const item of failedOrder.items) {
              await tx.product.update({
                where: { id: item.productId },
                data: { stock: { increment: item.quantity } }
              });
            }
          });
          console.log(`MoMo IPN: Order ${failedOrder.id} marked as FAILED, stock restored.`);
        }
      }

      // Luôn trả 200 cho MoMo để họ không retry
      return res.status(200).json({ message: 'IPN received' });
    } catch (error) {
      console.error('MoMo IPN callback error:', error);
      return res.status(500).json({ message: 'Lỗi xử lý IPN.' });
    }
  }

  /**
   * Trang kết quả sau khi thanh toán MoMo — redirect từ MoMo về
   * GET /api/payments/momo/result?resultCode=0&orderId=...
   */
  public static async momoRedirectResult(req: Request, res: Response) {
    const { resultCode, extraData } = req.query;

    // Xác thực chữ ký redirect
    const isValid = MomoService.verifyRedirectSignature(req.query);

    if (resultCode === '0' && isValid) {
      // Thành công
      let realOrderId = '';
      try {
        const decoded = JSON.parse(Buffer.from(extraData as string, 'base64').toString('utf-8'));
        realOrderId = decoded.orderId || '';
      } catch {}

      return res.status(200).json({
        success: true,
        orderId: realOrderId,
        message: 'Thanh toán MoMo thành công!'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Thanh toán MoMo thất bại hoặc bị hủy.'
      });
    }
  }
}
