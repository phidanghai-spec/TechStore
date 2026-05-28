import { Router } from 'express';
import { ReviewQnaController } from '../controllers/review-qna.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/', verifyToken, ReviewQnaController.createQna);

export default router;
