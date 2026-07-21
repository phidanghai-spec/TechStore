import { Request, Response } from 'express';
import prisma from '../services/prisma.service';

export class CouponController {
  /**
   * Kiểm tra mã giảm giá
   */
  public static async validateCoupon(req: Request, res: Response) {
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({ message: 'Vui lòng cung cấp mã giảm giá.' });
    }

    try {
      const coupon = await prisma.coupon.findUnique({
        where: { code: code.toUpperCase() }
      });

      if (!coupon) {
        return res.status(404).json({ message: 'Mã giảm giá không tồn tại.' });
      }

      if (!coupon.isActive) {
        return res.status(400).json({ message: 'Mã giảm giá này hiện đang tạm dừng áp dụng.' });
      }

      if (new Date() > coupon.expiryDate) {
        return res.status(400).json({ message: 'Mã giảm giá đã hết hạn sử dụng.' });
      }

      if (coupon.usedCount >= coupon.maxUsage) {
        return res.status(400).json({ message: 'Mã giảm giá đã hết lượt sử dụng.' });
      }

      const amount = req.query.amount ? parseFloat(req.query.amount as string) : 0;
      if (amount > 0 && coupon.minOrderAmount > 0 && amount < coupon.minOrderAmount) {
        const formattedMin = new Intl.NumberFormat('vi-VN').format(coupon.minOrderAmount);
        return res.status(400).json({ message: `Đơn hàng phải từ ${formattedMin}đ trở lên mới được áp dụng mã giảm giá này.` });
      }

      return res.status(200).json({
        message: 'Mã giảm giá hợp lệ.',
        coupon: {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minOrderAmount: coupon.minOrderAmount
        }
      });

    } catch (error) {
      console.error('Validate coupon error:', error);
      return res.status(500).json({ message: 'Lỗi hệ thống khi kiểm tra mã giảm giá.' });
    }
  }
}
