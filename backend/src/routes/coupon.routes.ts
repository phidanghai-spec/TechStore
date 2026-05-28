import { Router } from 'express';
import { CouponController } from '../controllers/coupon.controller';

const router = Router();

router.get('/validate/:code', CouponController.validateCoupon);

export default router;
