import { Request, Response } from 'express';
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

    const userId = req.user?.id || null;

    if (!customerName || !customerPhone || !customerEmail || !customerAddress || !paymentMethod || !items || !items.length) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin giao hàng và giỏ hàng.' });
    }

    try {
      // 1. Validate products and calculate prices
      const productIds = items.map((item: any) => item.productId);
      const dbProducts = await prisma.product.findMany({
        where: { id: { in: productIds } }
      });

      if (dbProducts.length !== items.length) {
        return res.status(400).json({ message: 'Một số sản phẩm trong giỏ hàng không tồn tại.' });
      }

      // Check stock limit for all items
      for (const item of items) {
        const product = dbProducts.find(p => p.id === item.productId);
        if (!product) continue;
        if (product.stock < item.quantity) {
          return res.status(400).json({ 
            message: `Sản phẩm "${product.name}" không đủ hàng trong kho. Hiện tại còn ${product.stock} sản phẩm.` 
          });
        }
      }

      // Calculate total original amount
      let totalAmount = 0;
      const orderItemsData = items.map((item: any) => {
        const product = dbProducts.find(p => p.id === item.productId)!;
        const itemPrice = product.salePrice;
        totalAmount += itemPrice * item.quantity;
        return {
          productId: product.id,
          quantity: item.quantity,
          price: itemPrice,
          productName: product.name // needed for email
        };
      });

      // 2. Calculate Rank-based Discount and Validate Coupon if provided
      let discountAmount = 0;
      
      if (userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { rank: true }
        });
        if (user) {
          if (user.rank === 'GOLD') {
            discountAmount = totalAmount * 0.02;
          } else if (user.rank === 'PLATINUM') {
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

        if (new Date() > coupon.expiryDate) {
          return res.status(400).json({ message: 'Mã giảm giá đã hết hạn sử dụng.' });
        }

        if (coupon.usedCount >= coupon.maxUsage) {
          return res.status(400).json({ message: 'Mã giảm giá đã hết số lần sử dụng.' });
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
            paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PAID', // Online payments marked as PAID
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

    } catch (error) {
      console.error('Create order error:', error);
      return res.status(500).json({ message: 'Đã xảy ra lỗi hệ thống khi xử lý đặt hàng.' });
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
            paymentStatus: order.paymentStatus === 'PAID' && order.paymentMethod !== 'COD' ? 'PENDING' : order.paymentStatus // Refund pending if paid online
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
