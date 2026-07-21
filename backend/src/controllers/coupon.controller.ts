import { Response } from 'express';
import prisma from '../services/prisma.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const RANK_LEVELS: Record<string, number> = {
  'ALL': 0,
  'SILVER': 1,
  'GOLD': 2,
  'PLATINUM': 3
};

export function isRankEligible(userRank: string = 'SILVER', requiredRank: string = 'ALL'): boolean {
  const userLevel = RANK_LEVELS[userRank.toUpperCase()] || 1;
  const requiredLevel = RANK_LEVELS[requiredRank.toUpperCase()] || 0;
  return userLevel >= requiredLevel;
}

export class CouponController {
  /**
   * Kiểm tra mã giảm giá
   */
  public static async validateCoupon(req: AuthenticatedRequest, res: Response) {
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

      // Check targetRank if user is authenticated
      if (req.user?.id && coupon.targetRank && coupon.targetRank !== 'ALL') {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (user && !isRankEligible(user.rank, coupon.targetRank)) {
          const rankText = coupon.targetRank === 'GOLD' ? 'Vàng' : coupon.targetRank === 'PLATINUM' ? 'Bạch Kim' : 'Bạc';
          return res.status(400).json({ 
            message: `Mã giảm giá này chỉ dành riêng cho thành viên hạng ${rankText} trở lên. Hạng của bạn là ${user.rank}.` 
          });
        }
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
          minOrderAmount: coupon.minOrderAmount,
          targetRank: coupon.targetRank
        }
      });

    } catch (error) {
      console.error('Validate coupon error:', error);
      return res.status(500).json({ message: 'Lỗi hệ thống khi kiểm tra mã giảm giá.' });
    }
  }

  /**
   * Lấy danh sách Voucher dành riêng cho người dùng
   */
  public static async getMyVouchers(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    try {
      const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
      const userRank = user?.rank || 'SILVER';

      const allActiveCoupons = await prisma.coupon.findMany({
        where: {
          isActive: true,
          expiryDate: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' }
      });

      const eligibleCoupons = allActiveCoupons.filter(c => {
        if (c.usedCount >= c.maxUsage) return false;
        return isRankEligible(userRank, c.targetRank);
      });

      return res.status(200).json({
        userRank,
        vouchers: eligibleCoupons
      });
    } catch (error) {
      console.error('Get my vouchers error:', error);
      return res.status(500).json({ message: 'Không thể lấy danh sách voucher.' });
    }
  }
}
