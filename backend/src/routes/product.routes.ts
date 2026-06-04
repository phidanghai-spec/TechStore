import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';

const router = Router();

router.get('/categories', ProductController.getCategories);
router.get('/suggestions', ProductController.getSuggestions);
router.get('/', ProductController.getProducts);
router.get('/:slug', ProductController.getProductBySlug);

export default router;
