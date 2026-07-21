import { Router } from 'express';
import { CouponController } from '../controllers/coupon.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/validate/:code', verifyToken, CouponController.validateCoupon);
router.get('/my-vouchers', verifyToken, CouponController.getMyVouchers);

export default router;
