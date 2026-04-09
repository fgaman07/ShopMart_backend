import express from 'express';
import productController from '../controllers/productController.js';

const router = express.Router();

router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);

export default router;
