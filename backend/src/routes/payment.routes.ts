import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';

const router = Router();

// MoMo payment routes
router.post('/momo/create', PaymentController.createMomoPayment);
router.post('/momo/ipn', PaymentController.momoIpnCallback);
router.get('/momo/result', PaymentController.momoRedirectResult);

// VNPAY payment routes
router.post('/vnpay/create', PaymentController.createVnpayPayment);
router.get('/vnpay/vnpay_return', PaymentController.vnpayReturn);
router.get('/vnpay/vnpay_ipn', PaymentController.vnpayIpn);

export default router;
