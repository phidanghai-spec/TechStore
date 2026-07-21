import { Request, Response } from 'express';
import { isRankEligible } from './coupon.controller';
import prisma from '../services/prisma.service';
import { MailService } from '../services/mail.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class OrderController {
  /**
   * Đặt hàng mới
   */
  public static async createOrder(req: AuthenticatedRequest, res: Response) {
    const {
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      paymentMethod,
      items, // Array of { productId, quantity }
      couponCode
    } = req.body;

    const userId = req.user?.id;

    if (!customerName || !customerPhone || !customerEmail || !customerAddress || !paymentMethod || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin nhận hàng và sản phẩm.' });
    }

    try {
      // Fetch products to verify price & stock
      const productIds = items.map((i: any) => i.productId);
      const dbProducts = await prisma.product.findMany({
        where: { id: { in: productIds } }
      });

      // Calculate total amount & verify stock
      let totalAmount = 0;
      const orderItemsData: any[] = [];

      for (const item of items) {
        const p = dbProducts.find(prod => prod.id === item.productId);
        if (!p) {
          return res.status(400).json({ message: `Sản phẩm ID ${item.productId} không tồn tại.` });
        }
        if (p.stock < item.quantity) {
          return res.status(400).json({ message: `Sản phẩm "${p.name}" không đủ số lượng trong kho (chỉ còn ${p.stock}).` });
        }

        const itemPrice = p.salePrice || p.originalPrice;
        totalAmount += itemPrice * item.quantity;
        orderItemsData.push({
          productId: p.id,
          quantity: item.quantity,
          price: itemPrice,
          productName: p.name
        });
      }

      // Tier discount
      let discountAmount = 0;
      let currentUserRank = 'SILVER';

      if (userId) {
        const currentUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { rank: true }
        });
        if (currentUser) {
          currentUserRank = currentUser.rank || 'SILVER';
          if (currentUser.rank === 'GOLD') {
            discountAmount = totalAmount * 0.02;
          } else if (currentUser.rank === 'PLATINUM') {
            discountAmount = totalAmount * 0.05;
          }
        }
      }

      let couponIdToUpdate: string | null = null;

      if (couponCode) {
        const coupon = await prisma.coupon.findUnique({
          where: { code: couponCode }
        });

        if (!coupon) {
          return res.status(400).json({ message: 'Mã giảm giá không hợp lệ.' });
        }

        if (!coupon.isActive) {
          return res.status(400).json({ message: 'Mã giảm giá này hiện đang bị tạm dừng áp dụng.' });
        }

        if (new Date() > coupon.expiryDate) {
          return res.status(400).json({ message: 'Mã giảm giá đã hết hạn sử dụng.' });
        }

        if (coupon.usedCount >= coupon.maxUsage) {
          return res.status(400).json({ message: 'Mã giảm giá đã hết số lần sử dụng.' });
        }

        if (coupon.minOrderAmount > 0 && totalAmount < coupon.minOrderAmount) {
          const formattedMin = new Intl.NumberFormat('vi-VN').format(coupon.minOrderAmount);
          return res.status(400).json({ message: `Đơn hàng phải từ ${formattedMin}đ trở lên mới áp dụng được mã giảm giá này.` });
        }

        if (coupon.targetRank && coupon.targetRank !== 'ALL') {
          if (!isRankEligible(currentUserRank, coupon.targetRank)) {
            const rankText = coupon.targetRank === 'GOLD' ? 'Vàng' : coupon.targetRank === 'PLATINUM' ? 'Bạch Kim' : 'Bạc';
            return res.status(400).json({ message: `Mã giảm giá ${coupon.code} chỉ dành riêng cho thành viên hạng ${rankText} trở lên. Hạng của bạn là ${currentUserRank}.` });
          }
        }

        // Calculate coupon discount
        let couponDiscount = 0;
        if (coupon.discountType === 'PERCENTAGE') {
          couponDiscount = (totalAmount * coupon.discountValue) / 100;
        } else {
          couponDiscount = coupon.discountValue;
        }
        
        discountAmount += couponDiscount;
        couponIdToUpdate = coupon.id;
      }

      // Cap discount amount to total amount
      if (discountAmount > totalAmount) {
        discountAmount = totalAmount;
      }

      const finalAmount = totalAmount - discountAmount;

      // 3. Process Transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create Order
        const order = await tx.order.create({
          data: {
            userId,
            customerName,
            customerPhone,
            customerEmail,
            customerAddress,
            paymentMethod,
            paymentStatus: 'PENDING', // Luôn PENDING khi tạo đơn, kể cả MOMO — chỉ set PAID khi IPN xác nhận
            orderStatus: 'PENDING',
            totalAmount: finalAmount,
            discountAmount,
            items: {
              create: orderItemsData.map((item: any) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price
              }))
            }
          },
          include: {
            items: true
          }
        });

        // Deduct product stock
        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity
              }
            }
          });
        }

        // Update Coupon usage
        if (couponIdToUpdate) {
          await tx.coupon.update({
            where: { id: couponIdToUpdate },
            data: {
              usedCount: {
                increment: 1
              }
            }
          });
        }

        // Process loyalty points for registered users
        if (userId) {
          // Rule: 100,000 VND spent = 1 point
          const pointsEarned = Math.floor(finalAmount / 100000);
          
          if (pointsEarned > 0) {
            const user = await tx.user.findUnique({
              where: { id: userId },
              select: { loyaltyPoints: true }
            });

            if (user) {
              const newPoints = user.loyaltyPoints + pointsEarned;
              let newRank = 'SILVER';
              
              if (newPoints >= 1000) {
                newRank = 'PLATINUM';
              } else if (newPoints >= 500) {
                newRank = 'GOLD';
              }

              await tx.user.update({
                where: { id: userId },
                data: {
                  loyaltyPoints: newPoints,
                  rank: newRank as any
                }
              });
            }
          }
        }

        return order;
      });

      // 4. Send Confirmation Email (Async)
      MailService.sendOrderConfirmationEmail(customerEmail, {
        id: result.id,
        customerName,
        customerPhone,
        customerAddress,
        totalAmount: finalAmount,
        discountAmount,
        paymentMethod,
        items: orderItemsData
      });

      return res.status(201).json({
        message: 'Đặt hàng thành công.',
        orderId: result.id,
        order: result
      });

    } catch (error: any) {
      console.error('Create order error:', error);
      return res.status(500).json({ 
        message: error?.message || 'Đã xảy ra lỗi hệ thống khi xử lý đặt hàng.' 
      });
    }
  }

  /**
   * Theo dõi đơn hàng bằng mã đơn hoặc số điện thoại
   */
  public static async trackOrder(req: Request, res: Response) {
    const { query } = req.query; // orderId or phone

    if (!query) {
      return res.status(400).json({ message: 'Vui lòng cung cấp mã đơn hàng hoặc số điện thoại theo dõi.' });
    }

    try {
      const orders = await prisma.order.findMany({
        where: {
          OR: [
            { id: query as string },
            { customerPhone: query as string }
          ]
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  imageUrl: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.status(200).json(orders);
    } catch (error) {
      console.error('Track order error:', error);
      return res.status(500).json({ message: 'Lỗi máy chủ khi tra cứu đơn hàng.' });
    }
  }

  /**
   * Lấy lịch sử mua hàng của người dùng hiện tại
   */
  public static async getMyOrders(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    const { startDate, endDate } = req.query;

    try {
      const where: any = { userId };

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate as string);
        if (endDate) where.createdAt.lte = new Date(endDate as string);
      }

      const orders = await prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  imageUrl: true,
                  slug: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.status(200).json(orders);
    } catch (error) {
      console.error('Get my orders error:', error);
      return res.status(500).json({ message: 'Không thể tải lịch sử đơn hàng.' });
    }
  }

  /**
   * Hủy đơn hàng
   */
  public static async cancelOrder(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const userId = req.user?.id;
    const { reason } = req.body; // Lý do hủy đơn (tuỳ chọn)

    try {
      const order = await prisma.order.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!order) {
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
      }

      // Check owner permission
      if (order.userId !== userId && req.user?.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Bạn không có quyền hủy đơn hàng này.' });
      }

      // Only allow cancellation if order is PENDING
      if (order.orderStatus !== 'PENDING') {
        return res.status(400).json({ message: 'Chỉ có thể hủy đơn hàng khi trạng thái đang là Chờ duyệt.' });
      }

      // Process Cancellation in Transaction
      await prisma.$transaction(async (tx) => {
        // Update Order Status
        await tx.order.update({
          where: { id },
          data: {
            orderStatus: 'CANCELLED',
            paymentStatus: order.paymentStatus === 'PAID' && order.paymentMethod !== 'COD' ? 'PENDING' : order.paymentStatus,
            cancelReason: reason || null,
            cancelledBy: 'CUSTOMER',
            cancelledAt: new Date()
          }
        });

        // Revert product stock
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity
              }
            }
          });
        }

        // Revert loyalty points if registered
        if (order.userId) {
          const pointsEarned = Math.floor(order.totalAmount / 100000);
          if (pointsEarned > 0) {
            const user = await tx.user.findUnique({
              where: { id: order.userId },
              select: { loyaltyPoints: true }
            });

            if (user) {
              const newPoints = Math.max(0, user.loyaltyPoints - pointsEarned);
              let newRank = 'SILVER';
              
              if (newPoints >= 1000) {
                newRank = 'PLATINUM';
              } else if (newPoints >= 500) {
                newRank = 'GOLD';
              }

              await tx.user.update({
                where: { id: order.userId },
                data: {
                  loyaltyPoints: newPoints,
                  rank: newRank as any
                }
              });
            }
          }
        }
      });

      return res.status(200).json({ message: 'Hủy đơn hàng thành công và đã hoàn lại số lượng tồn kho.' });

    } catch (error) {
      console.error('Cancel order error:', error);
      return res.status(500).json({ message: 'Lỗi hệ thống khi hủy đơn hàng.' });
    }
  }
}
