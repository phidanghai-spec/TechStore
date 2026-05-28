import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { verifyToken, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.get('/history', verifyToken, ChatController.getChatHistory);
router.get('/admin/list', verifyToken, requireAdmin, ChatController.getAdminChatList);
router.get('/admin/history/:customerId', verifyToken, requireAdmin, ChatController.getChatHistoryForAdmin);

export default router;
