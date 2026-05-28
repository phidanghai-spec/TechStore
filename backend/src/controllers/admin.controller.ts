import { Request, Response } from 'express';
import prisma from '../services/prisma.service';

export class AdminController {
  // ==========================================
  // 2.1 QUẢN LÝ HÀNG HÓA
  // ==========================================

  /**
   * Tạo sản phẩm mới
   */
  public static async createProduct(req: Request, res: Response) {
    const { categoryId, name, originalPrice, salePrice, stock, status, imageUrl, description, brand, tags, isVisible } = req.body;

    if (!categoryId || !name || !originalPrice || !salePrice || !brand || !imageUrl) {
      return res.status(400).json({ message: 'Vui lòng cung cấp các trường bắt buộc: Tên, danh mục, giá gốc, giá bán, hãng, ảnh.' });
    }

    try {
      // Auto generate slug
      const slug = name.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/-+/g, '-'); // Remove duplicate -

      const product = await prisma.product.create({
        data: {
          categoryId,
          name,
          slug,
          originalPrice: parseFloat(originalPrice),
          salePrice: parseFloat(salePrice),
          stock: parseInt(stock || 0),
          status: status || 'NORMAL',
          imageUrl,
          description: description || '{}',
          brand,
          tags: tags || '',
          isVisible: isVisible !== undefined ? isVisible : true
        }
      });

      return res.status(201).json({ message: 'Thêm sản phẩm mới thành công.', product });
    } catch (error: any) {
      console.error('Create product error:', error);
      if (error.code === 'P2002') {
        return res.status(400).json({ message: 'Tên sản phẩm này đã tồn tại (trùng slug).' });
      }
      return res.status(500).json({ message: 'Lỗi hệ thống khi thêm sản phẩm.' });
    }
  }

  /**
   * Cập nhật thông tin sản phẩm
   */
  public static async updateProduct(req: Request, res: Response) {
    const { id } = req.params;
    const updateData = req.body;

    try {
      // Calculate slug if name is updated
      if (updateData.name) {
        updateData.slug = updateData.name.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-');
      }

      if (updateData.originalPrice) updateData.originalPrice = parseFloat(updateData.originalPrice);
      if (updateData.salePrice) updateData.salePrice = parseFloat(updateData.salePrice);
      if (updateData.stock !== undefined) updateData.stock = parseInt(updateData.stock);

      const product = await prisma.product.update({
        where: { id },
        data: updateData
      });

      return res.status(200).json({ message: 'Cập nhật sản phẩm thành công.', product });
    } catch (error) {
      console.error('Update product error:', error);
      return res.status(500).json({ message: 'Không thể cập nhật sản phẩm.' });
    }
  }

  /**
   * Xóa sản phẩm
   */
  public static async deleteProduct(req: Request, res: Response) {
    const { id } = req.params;

    try {
      await prisma.product.delete({ where: { id } });
      return res.status(200).json({ message: 'Xóa sản phẩm thành công.' });
    } catch (error) {
      console.error('Delete product error:', error);
      return res.status(500).json({ message: 'Không thể xóa sản phẩm do có ràng buộc dữ liệu hoặc lỗi server.' });
    }
  }

  /**
   * Lấy danh sách tất cả sản phẩm cho admin (bao gồm sản phẩm stock = 0, ẩn/hiện)
   */
  public static async getAllProducts(req: Request, res: Response) {
    try {
      const products = await prisma.product.findMany({
        include: { category: true },
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json(products);
    } catch (error) {
      console.error('Get all products for admin error:', error);
      return res.status(500).json({ message: 'Không thể tải danh sách sản phẩm.' });
    }
  }

  // ==========================================
  // 2.2 QUẢN LÝ NGƯỜI DÙNG
  // ==========================================

  /**
   * Lấy danh sách tất cả người dùng
   */
  public static async getAllUsers(req: Request, res: Response) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          address: true,
          dob: true,
          role: true,
          loyaltyPoints: true,
          rank: true,
          isLocked: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json(users);
    } catch (error) {
      console.error('Get users error:', error);
      return res.status(500).json({ message: 'Không thể lấy danh sách người dùng.' });
    }
  }

  /**
   * Khóa / Mở khóa tài khoản người dùng
   */
  public static async toggleLockUser(req: Request, res: Response) {
    const { id } = req.params;
    const { isLocked } = req.body;

    if (isLocked === undefined) {
      return res.status(400).json({ message: 'Vui lòng cung cấp trạng thái khóa (isLocked).' });
    }

    try {
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return res.status(404).json({ message: 'Người dùng không tồn tại.' });
      }

      if (user.role === 'ADMIN') {
        return res.status(400).json({ message: 'Không thể khóa tài khoản của Quản trị viên.' });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { isLocked },
        select: { id: true, email: true, fullName: true, isLocked: true }
      });

      return res.status(200).json({
        message: isLocked ? 'Đã khóa tài khoản thành công.' : 'Đã mở khóa tài khoản.',
        user: updatedUser
      });

    } catch (error) {
      console.error('Toggle lock user error:', error);
      return res.status(500).json({ message: 'Lỗi hệ thống khi cập nhật trạng thái tài khoản.' });
    }
  }

  // ==========================================
  // 2.3 MÃ KHUYẾN MÃI
  // ==========================================

  /**
   * Tạo mã giảm giá mới
   */
  public static async createCoupon(req: Request, res: Response) {
    const { code, discountType, discountValue, maxUsage, expiryDate } = req.body;

    if (!code || !discountType || discountValue === undefined || !expiryDate) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin mã giảm giá.' });
    }

    try {
      const coupon = await prisma.coupon.create({
        data: {
          code: code.toUpperCase(),
          discountType,
          discountValue: parseFloat(discountValue),
          maxUsage: parseInt(maxUsage || 1),
          expiryDate: new Date(expiryDate)
        }
      });
      return res.status(201).json({ message: 'Tạo mã giảm giá thành công.', coupon });
    } catch (error: any) {
      console.error('Create coupon error:', error);
      if (error.code === 'P2002') {
        return res.status(400).json({ message: 'Mã giảm giá này đã tồn tại.' });
      }
      return res.status(500).json({ message: 'Lỗi hệ thống khi tạo mã giảm giá.' });
    }
  }

  /**
   * Lấy tất cả mã giảm giá
   */
  public static async getAllCoupons(req: Request, res: Response) {
    try {
      const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
      return res.status(200).json(coupons);
    } catch (error) {
      return res.status(500).json({ message: 'Không thể lấy danh sách mã giảm giá.' });
    }
  }

  /**
   * Xóa mã giảm giá
   */
  public static async deleteCoupon(req: Request, res: Response) {
    const { id } = req.params;
    try {
      await prisma.coupon.delete({ where: { id } });
      return res.status(200).json({ message: 'Xóa mã giảm giá thành công.' });
    } catch (error) {
      return res.status(500).json({ message: 'Không thể xóa mã giảm giá.' });
    }
  }

  // ==========================================
  // 2.4 CHĂM SÓC KHÁCH HÀNG
  // ==========================================

  /**
   * Lấy danh sách hỏi đáp của toàn bộ sản phẩm
   */
  public static async getQnas(req: Request, res: Response) {
    try {
      const qnas = await prisma.productQna.findMany({
        include: {
          user: { select: { fullName: true, email: true } },
          product: { select: { name: true, imageUrl: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json(qnas);
    } catch (error) {
      return res.status(500).json({ message: 'Không thể lấy danh sách hỏi đáp.' });
    }
  }

  /**
   * Trả lời và duyệt câu hỏi hỏi đáp
   */
  public static async answerQna(req: Request, res: Response) {
    const { id } = req.params;
    const { answer } = req.body;

    if (!answer) {
      return res.status(400).json({ message: 'Nội dung trả lời không được để trống.' });
    }

    try {
      const qna = await prisma.productQna.update({
        where: { id },
        data: { answer, isApproved: true }
      });
      return res.status(200).json({ message: 'Trả lời câu hỏi thành công.', qna });
    } catch (error) {
      return res.status(500).json({ message: 'Không thể cập nhật câu trả lời.' });
    }
  }

  /**
   * Xóa/Ẩn hỏi đáp
   */
  public static async deleteQna(req: Request, res: Response) {
    const { id } = req.params;
    try {
      await prisma.productQna.delete({ where: { id } });
      return res.status(200).json({ message: 'Xóa câu hỏi thành công.' });
    } catch (error) {
      return res.status(500).json({ message: 'Không thể xóa câu hỏi.' });
    }
  }

  /**
   * Lấy danh sách đánh giá của sản phẩm
   */
  public static async getReviews(req: Request, res: Response) {
    try {
      const reviews = await prisma.productReview.findMany({
        include: {
          user: { select: { fullName: true, email: true } },
          product: { select: { name: true, imageUrl: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json(reviews);
    } catch (error) {
      return res.status(500).json({ message: 'Không thể tải danh sách đánh giá.' });
    }
  }

  /**
   * Toggle ẩn/hiện đánh giá
   */
  public static async toggleReviewApproval(req: Request, res: Response) {
    const { id } = req.params;
    const { isApproved } = req.body;

    try {
      const review = await prisma.productReview.update({
        where: { id },
        data: { isApproved }
      });
      return res.status(200).json({ message: 'Đã cập nhật trạng thái hiển thị đánh giá.', review });
    } catch (error) {
      return res.status(500).json({ message: 'Không thể cập nhật đánh giá.' });
    }
  }

  // ==========================================
  // 2.5 XỬ LÝ ĐƠN HÀNG
  // ==========================================

  /**
   * Xem danh sách đơn hàng
   */
  public static async getAllOrders(req: Request, res: Response) {
    const { status, startDate, endDate } = req.query;

    try {
      const where: any = {};

      if (status) {
        where.orderStatus = status as any;
      }

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
              product: { select: { name: true, imageUrl: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.status(200).json(orders);
    } catch (error) {
      console.error('Get all orders admin error:', error);
      return res.status(500).json({ message: 'Không thể tải danh sách đơn hàng.' });
    }
  }

  /**
   * Cập nhật trạng thái và xử lý đơn hàng
   */
  public static async updateOrderStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { orderStatus, deliveryStaff, paymentStatus } = req.body;

    try {
      const order = await prisma.order.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!order) {
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
      }

      const updateData: any = {};
      if (orderStatus) updateData.orderStatus = orderStatus;
      if (deliveryStaff !== undefined) updateData.deliveryStaff = deliveryStaff;
      if (paymentStatus) updateData.paymentStatus = paymentStatus;

      // Xử lý công nợ tự động: Nếu COD giao thành công mà chưa thu tiền -> isDebt = true
      if (orderStatus === 'DELIVERED') {
        if (order.paymentMethod === 'COD' && order.paymentStatus === 'PENDING') {
          updateData.isDebt = true; // Ghi nhận công nợ nhân viên/bên vận chuyển chưa nộp tiền
        } else {
          updateData.paymentStatus = 'PAID';
        }
      }

      // Xử lý hoàn kho tự động nếu bị hủy bởi Admin
      if (orderStatus === 'CANCELLED' && order.orderStatus !== 'CANCELLED') {
        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id },
            data: updateData
          });

          // Revert stock
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
        });

        return res.status(200).json({ message: 'Đã hủy đơn hàng và hoàn trả lại số lượng tồn kho sản phẩm.' });
      }

      // Cập nhật thông thường
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: updateData
      });

      return res.status(200).json({ message: 'Cập nhật trạng thái đơn hàng thành công.', order: updatedOrder });

    } catch (error) {
      console.error('Update order status error:', error);
      return res.status(500).json({ message: 'Không thể cập nhật trạng thái đơn hàng.' });
    }
  }

  /**
   * Thu tiền công nợ đơn giao thành công chưa thu tiền
   */
  public static async collectDebt(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const order = await prisma.order.update({
        where: { id },
        data: {
          isDebt: false,
          paymentStatus: 'PAID'
        }
      });
      return res.status(200).json({ message: 'Thu tiền công nợ thành công, đơn hàng đã được cập nhật Đã thanh toán.', order });
    } catch (error) {
      return res.status(500).json({ message: 'Không thể thu công nợ.' });
    }
  }

  // ==========================================
  // 2.6 THỐNG KÊ DOANH THU
  // ==========================================

  /**
   * Doanh thu và phân tích thống kê
   */
  public static async getStatistics(req: Request, res: Response) {
    const { startDate, endDate } = req.query;

    try {
      const dateFilter: any = {
        orderStatus: 'DELIVERED' // Chỉ tính doanh thu trên đơn hàng giao thành công
      };

      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.gte = new Date(startDate as string);
        if (endDate) dateFilter.createdAt.lte = new Date(endDate as string);
      }

      // 1. Total Revenue
      const deliveredOrders = await prisma.order.findMany({
        where: dateFilter
      });

      const totalRevenue = deliveredOrders.reduce((sum, order) => sum + order.totalAmount, 0);

      // 2. Payment Method Split
      const codRevenue = deliveredOrders
        .filter(o => o.paymentMethod === 'COD')
        .reduce((sum, order) => sum + order.totalAmount, 0);
      
      const onlineRevenue = totalRevenue - codRevenue;

      // 3. Order status count
      const allOrdersFilter: any = {};
      if (startDate || endDate) {
        allOrdersFilter.createdAt = {};
        if (startDate) allOrdersFilter.createdAt.gte = new Date(startDate as string);
        if (endDate) allOrdersFilter.createdAt.lte = new Date(endDate as string);
      }

      const statusCounts = await prisma.order.groupBy({
        by: ['orderStatus'],
        where: allOrdersFilter,
        _count: {
          id: true
        }
      });

      // 4. Daily Revenue for chart (Last 7 days or date range)
      const dailyRevenue = await prisma.order.findMany({
        where: dateFilter,
        select: {
          createdAt: true,
          totalAmount: true
        }
      });

      const dailyRevenueMap: Record<string, number> = {};
      for (const order of dailyRevenue) {
        const dateStr = order.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
        dailyRevenueMap[dateStr] = (dailyRevenueMap[dateStr] || 0) + order.totalAmount;
      }

      const chartData = Object.keys(dailyRevenueMap).map(date => ({
        date,
        revenue: dailyRevenueMap[date]
      })).sort((a, b) => a.date.localeCompare(b.date));

      return res.status(200).json({
        totalRevenue,
        paymentSplit: {
          cod: codRevenue,
          online: onlineRevenue
        },
        statusCounts: statusCounts.reduce((acc: any, curr) => {
          acc[curr.orderStatus] = curr._count.id;
          return acc;
        }, {}),
        chartData
      });

    } catch (error) {
      console.error('Get statistics error:', error);
      return res.status(500).json({ message: 'Lỗi hệ thống khi tải báo cáo thống kê.' });
    }
  }
}
