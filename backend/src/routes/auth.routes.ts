import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { FacebookAuthController } from '../controllers/auth.facebook.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/change-password', verifyToken, AuthController.changePassword);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.put('/profile', verifyToken, AuthController.updateProfile);

// Facebook OAuth
router.get('/facebook', FacebookAuthController.loginRedirect);
router.get('/facebook/callback', FacebookAuthController.callback);

export default router;
