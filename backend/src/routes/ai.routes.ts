import { Router } from 'express';
import { AiController } from '../controllers/ai.controller';

const router = Router();

// RAG Chatbot endpoint - public (không cần đăng nhập để dùng AI chat)
router.post('/chat', AiController.chat);

// Debug endpoint - lấy context sản phẩm
router.get('/products-context', AiController.getProductsContext);

export default router;
