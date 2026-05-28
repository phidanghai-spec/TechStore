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

      if (new Date() > coupon.expiryDate) {
        return res.status(400).json({ message: 'Mã giảm giá đã hết hạn sử dụng.' });
      }

      if (coupon.usedCount >= coupon.maxUsage) {
        return res.status(400).json({ message: 'Mã giảm giá đã hết lượt sử dụng.' });
      }

      return res.status(200).json({
        message: 'Mã giảm giá hợp lệ.',
        coupon: {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue
        }
      });

    } catch (error) {
      console.error('Validate coupon error:', error);
      return res.status(500).json({ message: 'Lỗi hệ thống khi kiểm tra mã giảm giá.' });
    }
  }
}
