import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { WarrantyController } from '../controllers/warranty.controller';
import { verifyToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to all admin routes
router.use(verifyToken, requireAdmin);

// Product Management
router.get('/products', AdminController.getAllProducts);
router.post('/products', AdminController.createProduct);
router.put('/products/:id', AdminController.updateProduct);
router.delete('/products/:id', AdminController.deleteProduct);

// User Management
router.get('/users', AdminController.getAllUsers);
router.post('/users', AdminController.createUser);
router.put('/users/:id', AdminController.updateUser);
router.put('/users/:id/password', AdminController.resetUserPassword);
router.put('/users/:id/lock', AdminController.toggleLockUser);

// Warranty Management
router.get('/warranties', WarrantyController.getWarranties);
router.put('/warranties/:id', WarrantyController.updateWarrantyStatus);

// Coupon Management
router.get('/coupons', AdminController.getAllCoupons);
router.post('/coupons', AdminController.createCoupon);
router.delete('/coupons/:id', AdminController.deleteCoupon);

// Q&A and Review Moderation
router.get('/qnas', AdminController.getQnas);
router.put('/qnas/:id/answer', AdminController.answerQna);
router.delete('/qnas/:id', AdminController.deleteQna);
router.get('/reviews', AdminController.getReviews);
router.put('/reviews/:id/toggle', AdminController.toggleReviewApproval);

// Order Management & Debt Collecting
router.get('/orders', AdminController.getAllOrders);
router.put('/orders/:id/status', AdminController.updateOrderStatus);
router.put('/orders/:id/collect-debt', AdminController.collectDebt);

// Stats
router.get('/stats', AdminController.getStatistics);

export default router;
