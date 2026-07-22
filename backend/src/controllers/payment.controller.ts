import { Request, Response } from 'express';
import { MomoService } from '../services/momo.service';
import { VnpayService } from '../services/vnpay.service';
import prisma from '../services/prisma.service';
import { MailService } from '../services/mail.service';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

function getFrontendUrl(req: Request): string {
  let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  // Chống lỗi 404 khi FRONTEND_URL trên Render trỏ nhầm domain Vercel tạm thời đã bị xóa (techstore-temp.vercel.app)
  if (frontendUrl.includes('techstore-temp.vercel.app') || !frontendUrl) {
    const referer = req.headers.referer || req.headers.origin;
    if (referer && !referer.includes('techstore-temp.vercel.app')) {
      try {
        const parsed = new URL(referer as string);
        frontendUrl = `${parsed.protocol}//${parsed.host}`;
      } catch {
        frontendUrl = 'https://frontend-ruby-phi-14.vercel.app';
      }
    } else {
      frontendUrl = 'https://frontend-ruby-phi-14.vercel.app';
    }
  }

  return frontendUrl.replace(/\/$/, '');
}

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
    const { resultCode, extraData } = req.body;

    // Verify signature từ MoMo
    const isValid = MomoService.verifyIpnSignature(req.body);
    if (!isValid) {
      console.error('MoMo IPN signature invalid!');
      return res.status(400).json({ message: 'Chữ ký không hợp lệ.' });
    }

    let realOrderId = '';
    try {
      const decoded = JSON.parse(Buffer.from(extraData, 'base64').toString('utf-8'));
      realOrderId = decoded.orderId;
    } catch {
      console.error('Cannot parse extraData from MoMo IPN');
    }

    if (!realOrderId) {
      return res.status(400).json({ message: 'Không tìm thấy thông tin đơn hàng.' });
    }

    try {
      const order = await prisma.order.findUnique({
        where: { id: realOrderId },
        include: { items: { include: { product: true } } }
      });

      if (!order) {
        return res.status(404).json({ message: 'Đơn hàng không tồn tại.' });
      }

      if (resultCode === 0) {
        // Giao dịch thành công
        if (order.paymentStatus !== 'PAID') {
          await prisma.order.update({
            where: { id: realOrderId },
            data: { paymentStatus: 'PAID' }
          });

          // Gửi email xác nhận thanh toán
          if (order.customerEmail) {
            await MailService.sendOrderConfirmationEmail(order.customerEmail, {
              id: order.id,
              customerName: order.customerName,
              customerPhone: order.customerPhone,
              customerAddress: order.customerAddress,
              totalAmount: order.totalAmount,
              discountAmount: order.discountAmount,
              paymentMethod: order.paymentMethod,
              items: (order.items || []).map((item: any) => ({
                productName: item.product?.name || 'Sản phẩm',
                quantity: item.quantity,
                price: item.price
              }))
            });
          }
          console.log(`MoMo IPN: Order ${realOrderId} marked as PAID.`);
        }
      } else {
        // Giao dịch thất bại / người dùng hủy ➔ Đánh dấu FAILED và hoàn stock nếu cần
        if (order.paymentStatus === 'PENDING') {
          await prisma.$transaction(async (tx) => {
            const failedOrder = await tx.order.update({
              where: { id: realOrderId },
              data: { paymentStatus: 'FAILED', orderStatus: 'CANCELLED' }
            });

            // Hoàn lại tồn kho
            for (const item of order.items) {
              await tx.product.update({
                where: { id: item.productId },
                data: { stock: { increment: item.quantity } }
              });
            }
          });
          console.log(`MoMo IPN: Order ${realOrderId} marked as FAILED, stock restored.`);
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

  // =========================================================================
  // VNPAY INTEGRATION
  // =========================================================================

  /**
   * Tạo URL thanh toán VNPAY
   * POST /api/payments/vnpay/create
   * Body: { orderId, amount, orderInfo, bankCode }
   */
  public static async createVnpayPayment(req: Request, res: Response) {
    const { orderId, amount, orderInfo, bankCode } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({ message: 'Vui lòng cung cấp mã đơn hàng và số tiền.' });
    }

    try {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) {
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
      }

      const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const ipAddr = Array.isArray(rawIp) ? rawIp[0] : rawIp.split(',')[0].trim();

      const info = orderInfo || `TechStore - Thanh toan don hang #${orderId.substring(0, 8).toUpperCase()}`;

      const result = VnpayService.createPaymentUrl(
        ipAddr,
        orderId,
        amount,
        info,
        bankCode
      );

      if (result.success && result.payUrl) {
        return res.status(200).json({
          success: true,
          payUrl: result.payUrl,
          txnRef: result.txnRef,
        });
      } else {
        return res.status(400).json({
          success: false,
          message: result.message || 'Không thể tạo liên kết thanh toán VNPAY.',
        });
      }
    } catch (error: any) {
      console.error('Create VNPAY payment error:', error);
      return res.status(500).json({ message: 'Lỗi hệ thống khi tạo thanh toán VNPAY.' });
    }
  }

  /**
   * VNPAY Redirect Return — Trình duyệt khách hàng được redirect về sau khi thanh toán VNPAY
   * GET /api/payments/vnpay/vnpay_return
   */
  public static async vnpayReturn(req: Request, res: Response) {
    try {
      const verify = VnpayService.verifyIpn(req.query);

      const isSuccess = verify.isValid && verify.responseCode === '00';
      const baseUrl = getFrontendUrl(req);
      const redirectUrl = `${baseUrl}/checkout/result?orderId=${verify.orderId}&paymentMethod=VNPAY&vnp_ResponseCode=${verify.responseCode}&success=${isSuccess ? 'true' : 'false'}`;

      return res.redirect(redirectUrl);
    } catch (error) {
      console.error('VNPAY return error:', error);
      const baseUrl = getFrontendUrl(req);
      return res.redirect(`${baseUrl}/checkout/result?success=false`);
    }
  }

  /**
   * VNPAY IPN Callback — Server-to-server Webhook chính thức từ VNPAY
   * GET /api/payments/vnpay/vnpay_ipn
   */
  public static async vnpayIpn(req: Request, res: Response) {
    try {
      const verify = VnpayService.verifyIpn(req.query);

      // 1. Kiểm tra chữ ký checksum
      if (!verify.isValid) {
        console.error('VNPAY IPN: Chữ ký không hợp lệ (Invalid Checksum)');
        return res.status(200).json({ RspCode: '97', Message: 'Invalid Checksum' });
      }

      // 2. Tìm đơn hàng
      const order = await prisma.order.findUnique({
        where: { id: verify.orderId },
        include: { items: { include: { product: true } } }
      });

      if (!order) {
        console.error(`VNPAY IPN: Không tìm thấy đơn hàng #${verify.orderId}`);
        return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
      }

      // 3. Đối chiếu số tiền (cho phép sai số làm tròn cực nhỏ)
      if (Math.abs(order.totalAmount - verify.amount) > 1) {
        console.error(`VNPAY IPN: Sai lệch số tiền đơn #${order.id} (DB: ${order.totalAmount}, VNPAY: ${verify.amount})`);
        return res.status(200).json({ RspCode: '04', Message: 'Amount invalid' });
      }

      // 4. Kiểm tra xem đơn đã được xác nhận chưa (Chống cập nhật trùng lặp)
      if (order.paymentStatus === 'PAID') {
        return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
      }

      // 5. Xử lý trạng thái kết quả từ VNPAY
      if (verify.responseCode === '00') {
        // Thanh toán thành công ➔ Cập nhật PAID
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: 'PAID' }
        });

        // Gửi email xác nhận đơn hàng
        if (order.customerEmail) {
          await MailService.sendOrderConfirmationEmail(order.customerEmail, {
            id: order.id,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            customerAddress: order.customerAddress,
            totalAmount: order.totalAmount,
            discountAmount: order.discountAmount,
            paymentMethod: order.paymentMethod,
            items: (order.items || []).map((item: any) => ({
              productName: item.product?.name || 'Sản phẩm',
              quantity: item.quantity,
              price: item.price
            }))
          });
        }
        console.log(`VNPAY IPN: Đơn hàng #${order.id} cập nhật thành công (PAID).`);
      } else {
        // Giao dịch không thành công ➔ Cập nhật FAILED + Hoàn tồn kho nếu đơn còn PENDING
        if (order.paymentStatus === 'PENDING') {
          await prisma.$transaction(async (tx) => {
            const cancelledOrder = await tx.order.update({
              where: { id: order.id },
              data: { paymentStatus: 'FAILED', orderStatus: 'CANCELLED' }
            });

            for (const item of order.items) {
              await tx.product.update({
                where: { id: item.productId },
                data: { stock: { increment: item.quantity } }
              });
            }
          });
          console.log(`VNPAY IPN: Đơn hàng #${order.id} thanh toán thất bại (Mã: ${verify.responseCode}), đã hoàn lại kho.`);
        }
      }

      // 6. Trả về đúng định dạng VNPAY yêu cầu: {"RspCode":"00","Message":"Confirm Success"}
      return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
    } catch (error: any) {
      console.error('VNPAY IPN error:', error);
      return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
    }
  }
}
