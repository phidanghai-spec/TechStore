import { Router } from 'express';
import { WarrantyController } from '../controllers/warranty.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// Public route for anyone to track warranty
router.get('/track', WarrantyController.trackWarranty);

// Authenticated route for customer to view their warranties
router.get('/my-warranties', verifyToken, WarrantyController.getMyWarranties);

export default router;
