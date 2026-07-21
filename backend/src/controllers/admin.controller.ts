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
      const existing = await prisma.product.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });

      let newName = updateData.name || existing.name;
      const newStock = updateData.stock !== undefined ? parseInt(updateData.stock) : existing.stock;

      if (newStock > 0) {
        newName = newName.replace(/\s*\(Hết hàng\)/gi, '').trim();
        if (!updateData.status || updateData.status === 'OUT_OF_STOCK') {
          updateData.status = 'NORMAL';
        }
      }

      updateData.name = newName;
      updateData.stock = newStock;
      updateData.slug = newName.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      if (updateData.originalPrice) updateData.originalPrice = parseFloat(updateData.originalPrice);
      if (updateData.salePrice) updateData.salePrice = parseFloat(updateData.salePrice);

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

  /**
   * Admin tạo người dùng mới
   */
  public static async createUser(req: Request, res: Response) {
    const { email, password, fullName, phone, address, address2, bankAccount, dob, role, loyaltyPoints, rank, deposit } = req.body;

    if (!email || !password || !fullName || !phone || !address || !dob) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ các trường bắt buộc: Email, mật khẩu, họ tên, số điện thoại, địa chỉ 1, ngày sinh.' });
    }

    try {
      // Check duplicate email
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email này đã được sử dụng.' });
      }

      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          fullName,
          phone,
          address,
          address2: address2 || null,
          bankAccount: bankAccount || null,
          dob: new Date(dob),
          role: role || 'CUSTOMER',
          loyaltyPoints: parseInt(loyaltyPoints || 0),
          rank: rank || 'SILVER',
          deposit: parseFloat(deposit || 0)
        }
      });

      const { password: _, ...userWithoutPassword } = user;
      return res.status(201).json({ message: 'Tạo tài khoản người dùng mới thành công.', user: userWithoutPassword });
    } catch (error) {
      console.error('Admin create user error:', error);
      return res.status(500).json({ message: 'Lỗi hệ thống khi tạo người dùng.' });
    }
  }

  /**
   * Admin chỉnh sửa thông tin người dùng
   */
  public static async updateUser(req: Request, res: Response) {
    const { id } = req.params;
    const { fullName, phone, address, address2, bankAccount, dob, role, loyaltyPoints, rank, deposit } = req.body;

    try {
      const dataToUpdate: any = {};
      if (fullName !== undefined) dataToUpdate.fullName = fullName;
      if (phone !== undefined) dataToUpdate.phone = phone;
      if (address !== undefined) dataToUpdate.address = address;
      if (address2 !== undefined) dataToUpdate.address2 = address2 || null;
      if (bankAccount !== undefined) dataToUpdate.bankAccount = bankAccount || null;
      if (dob !== undefined) dataToUpdate.dob = new Date(dob);
      if (role !== undefined) dataToUpdate.role = role;
      if (loyaltyPoints !== undefined) dataToUpdate.loyaltyPoints = parseInt(loyaltyPoints);
      if (rank !== undefined) dataToUpdate.rank = rank;
      if (deposit !== undefined) dataToUpdate.deposit = parseFloat(deposit);

      const user = await prisma.user.update({
        where: { id },
        data: dataToUpdate
      });

      const { password: _, ...userWithoutPassword } = user;
      return res.status(200).json({ message: 'Cập nhật thông tin người dùng thành công.', user: userWithoutPassword });
    } catch (error) {
      console.error('Admin update user error:', error);
      return res.status(500).json({ message: 'Lỗi hệ thống khi cập nhật người dùng.' });
    }
  }

  /**
   * Admin đặt lại mật khẩu cho người dùng
   */
  public static async resetUserPassword(req: Request, res: Response) {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: 'Vui lòng cung cấp mật khẩu mới.' });
    }

    try {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id },
        data: { password: hashedPassword }
      });

      return res.status(200).json({ message: 'Đặt lại mật khẩu người dùng thành công.' });
    } catch (error) {
      console.error('Admin reset user password error:', error);
      return res.status(500).json({ message: 'Lỗi hệ thống khi đặt lại mật khẩu.' });
    }
  }

  // ==========================================
  // 2.3 MÃ KHUYẾN MÃI
  // ==========================================

  /**
   * Tạo mã giảm giá mới
   */
  public static async createCoupon(req: Request, res: Response) {
    const { code, discountType, discountValue, minOrderAmount, targetRank, maxUsage, expiryDate, isActive } = req.body;

    if (!code || !discountType || discountValue === undefined || !expiryDate) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin mã giảm giá.' });
    }

    try {
      const coupon = await prisma.coupon.create({
        data: {
          code: code.toUpperCase(),
          discountType,
          discountValue: parseFloat(discountValue),
          minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : 0,
          targetRank: targetRank || 'ALL',
          maxUsage: parseInt(maxUsage || 1),
          expiryDate: new Date(expiryDate),
          isActive: isActive !== undefined ? Boolean(isActive) : true
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

  /**
   * Cập nhật mã giảm giá
   */
  public static async updateCoupon(req: Request, res: Response) {
    const { id } = req.params;
    const { code, discountType, discountValue, minOrderAmount, targetRank, maxUsage, expiryDate, isActive } = req.body;

    if (!code || !discountType || discountValue === undefined || !expiryDate) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin mã giảm giá.' });
    }

    try {
      const coupon = await prisma.coupon.update({
        where: { id },
        data: {
          code: code.toUpperCase(),
          discountType,
          discountValue: parseFloat(discountValue),
          minOrderAmount: minOrderAmount !== undefined ? parseFloat(minOrderAmount) : 0,
          targetRank: targetRank || 'ALL',
          maxUsage: parseInt(maxUsage || 1),
          expiryDate: new Date(expiryDate),
          isActive: isActive !== undefined ? Boolean(isActive) : true
        }
      });
      return res.status(200).json({ message: 'Cập nhật mã giảm giá thành công.', coupon });
    } catch (error: any) {
      console.error('Update coupon error:', error);
      if (error.code === 'P2002') {
        return res.status(400).json({ message: 'Mã giảm giá này đã tồn tại.' });
      }
      return res.status(500).json({ message: 'Lỗi hệ thống khi cập nhật mã giảm giá.' });
    }
  }

  /**
   * Bật / Tắt kích hoạt mã giảm giá
   */
  public static async toggleCoupon(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const existing = await prisma.coupon.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ message: 'Không tìm thấy mã giảm giá.' });

      const coupon = await prisma.coupon.update({
        where: { id },
        data: { isActive: !existing.isActive }
      });
      return res.status(200).json({ message: `Đã ${coupon.isActive ? 'kích hoạt' : 'tạm dừng'} mã giảm giá ${coupon.code}.`, coupon });
    } catch (error) {
      return res.status(500).json({ message: 'Không thể thay đổi trạng thái mã giảm giá.' });
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

      if (status && typeof status === 'string' && status.trim() !== '') {
        where.orderStatus = status as any;
      }

      if (startDate && typeof startDate === 'string' && startDate.trim() !== '') {
        const d = new Date(startDate);
        if (!isNaN(d.getTime())) {
          where.createdAt = where.createdAt || {};
          where.createdAt.gte = d;
        }
      }

      if (endDate && typeof endDate === 'string' && endDate.trim() !== '') {
        const d = new Date(endDate);
        if (!isNaN(d.getTime())) {
          where.createdAt = where.createdAt || {};
          where.createdAt.lte = d;
        }
      }

      const orders = await prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              fullName: true,
              email: true
            }
          },
          items: {
            include: {
              product: { select: { name: true, imageUrl: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.status(200).json(orders);
    } catch (error: any) {
      console.error('Get all orders admin error:', error);
      return res.status(500).json({ message: error?.message || 'Không thể tải danh sách đơn hàng.' });
    }
  }

  /**
   * Cập nhật trạng thái và xử lý đơn hàng
   */
  public static async updateOrderStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { orderStatus, deliveryStaff, paymentStatus, cancelReason } = req.body;

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

      // Khi giao hàng thành công (DELIVERED): luôn set PAID
      // Bỏ khái niệm ghi nợ/ký quỹ — COD giao xong = thu tiền = PAID
      if (orderStatus === 'DELIVERED') {
        updateData.paymentStatus = 'PAID';
      }

      // Xử lý hoàn kho tự động nếu bị hủy bởi Admin
      if (orderStatus === 'CANCELLED' && order.orderStatus !== 'CANCELLED') {
        const adminUser = (req as any).user;
        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id },
            data: {
              ...updateData,
              cancelReason: cancelReason || null,
              cancelledBy: adminUser?.id || 'ADMIN',
              cancelledAt: new Date()
            }
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

      // Cập nhật thông thường và tự động kích hoạt bảo hành
      const updatedOrder = await prisma.$transaction(async (tx) => {
        const ord = await tx.order.update({
          where: { id },
          data: updateData
        });

        // Tạo bảo hành nếu giao hàng thành công
        if (orderStatus === 'DELIVERED' && order.orderStatus !== 'DELIVERED') {
          for (const item of order.items) {
            const warrantyCode = `BH-${order.id.substring(0, 8).toUpperCase()}-${item.productId.substring(0, 4).toUpperCase()}`;
            
            const existingWarranty = await tx.warranty.findUnique({
              where: { warrantyCode }
            });

            if (!existingWarranty) {
              const startDate = new Date();
              const endDate = new Date();
              endDate.setMonth(startDate.getMonth() + 12); // Mặc định bảo hành 12 tháng

              await tx.warranty.create({
                data: {
                  orderId: order.id,
                  productId: item.productId,
                  userId: order.userId,
                  customerName: order.customerName,
                  customerPhone: order.customerPhone,
                  warrantyCode,
                  durationMonths: 12,
                  startDate,
                  endDate,
                  status: 'ACTIVE',
                  notes: 'Kích hoạt bảo hành tự động sau khi giao hàng thành công.'
                }
              });
            }
          }
        }

        return ord;
      });

      return res.status(200).json({ message: 'Cập nhật trạng thái đơn hàng thành công.', order: updatedOrder });

    } catch (error) {
      console.error('Update order status error:', error);
      return res.status(500).json({ message: 'Không thể cập nhật trạng thái đơn hàng.' });
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

      if (startDate && typeof startDate === 'string' && startDate.trim() !== '') {
        const d = new Date(startDate);
        if (!isNaN(d.getTime())) {
          dateFilter.createdAt = dateFilter.createdAt || {};
          dateFilter.createdAt.gte = d;
        }
      }

      if (endDate && typeof endDate === 'string' && endDate.trim() !== '') {
        const d = new Date(endDate);
        if (!isNaN(d.getTime())) {
          dateFilter.createdAt = dateFilter.createdAt || {};
          dateFilter.createdAt.lte = d;
        }
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
      if (startDate && typeof startDate === 'string' && startDate.trim() !== '') {
        const d = new Date(startDate);
        if (!isNaN(d.getTime())) {
          allOrdersFilter.createdAt = allOrdersFilter.createdAt || {};
          allOrdersFilter.createdAt.gte = d;
        }
      }
      if (endDate && typeof endDate === 'string' && endDate.trim() !== '') {
        const d = new Date(endDate);
        if (!isNaN(d.getTime())) {
          allOrdersFilter.createdAt = allOrdersFilter.createdAt || {};
          allOrdersFilter.createdAt.lte = d;
        }
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

    } catch (error: any) {
      console.error('Get statistics error:', error);
      return res.status(500).json({ message: error?.message || 'Lỗi hệ thống khi tải báo cáo thống kê.' });
    }
  }

  // ==========================================
  // 2.7 NHẬP KHO
  // ==========================================

  /**
   * Nhập kho sản phẩm — ghi StockMovement và tăng stock
   * POST /api/admin/products/:id/stock-in
   */
  public static async stockIn(req: Request, res: Response) {
    const { id } = req.params;
    const { quantity, note } = req.body;
    const adminUser = (req as any).user;

    if (!quantity || isNaN(parseInt(quantity)) || parseInt(quantity) <= 0) {
      return res.status(400).json({ message: 'Số lượng nhập kho phải là số nguyên dương.' });
    }

    try {
      const qty = parseInt(quantity);

      const result = await prisma.$transaction(async (tx) => {
        // Tăng tồn kho sản phẩm
        const updatedProduct = await tx.product.update({
          where: { id },
          data: { stock: { increment: qty } }
        });

        // Ghi lịch sử nhập kho
        const movement = await tx.stockMovement.create({
          data: {
            productId: id,
            type: 'IMPORT',
            quantity: qty,
            note: note || null,
            createdBy: adminUser?.id || null
          }
        });

        return { product: updatedProduct, movement };
      });

      return res.status(200).json({
        message: `Nhập kho thành công. Tồn kho hiện tại: ${result.product.stock} sản phẩm.`,
        stock: result.product.stock,
        movement: result.movement
      });
    } catch (error: any) {
      console.error('Stock-in error:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
      }
      return res.status(500).json({ message: 'Lỗi hệ thống khi nhập kho.' });
    }
  }
}
