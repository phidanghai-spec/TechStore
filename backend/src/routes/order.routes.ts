import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { verifyToken, verifyTokenOptional } from '../middleware/auth.middleware';

const router = Router();

router.post('/', verifyTokenOptional, OrderController.createOrder);
router.get('/track', OrderController.trackOrder);
router.get('/my-orders', verifyToken, OrderController.getMyOrders);
router.put('/cancel/:id', verifyToken, OrderController.cancelOrder);

export default router;
