import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';

const router = Router();

// MoMo payment routes
router.post('/momo/create', PaymentController.createMomoPayment);
router.post('/momo/ipn', PaymentController.momoIpnCallback);
router.get('/momo/result', PaymentController.momoRedirectResult);

export default router;
