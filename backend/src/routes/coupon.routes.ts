import { Router } from 'express';
import { CouponController } from '../controllers/coupon.controller';
import { verifyToken, verifyTokenOptional } from '../middleware/auth.middleware';

const router = Router();

router.get('/validate/:code', verifyTokenOptional, CouponController.validateCoupon);
router.get('/my-vouchers', verifyToken, CouponController.getMyVouchers);

export default router;
