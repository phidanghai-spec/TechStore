import { Router } from 'express';
import { ReviewQnaController } from '../controllers/review-qna.controller';
import { verifyToken, verifyTokenOptional } from '../middleware/auth.middleware';

const router = Router();

router.get('/check-purchase', verifyTokenOptional, ReviewQnaController.checkPurchase);
router.post('/', verifyToken, ReviewQnaController.createReview);

export default router;
