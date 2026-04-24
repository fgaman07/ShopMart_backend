import express from 'express';
import reviewController from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, reviewController.createReview);
router.route('/restaurant/:id').get(reviewController.getRestaurantReviews);
router.route('/product/:id').get(reviewController.getProductReviews);

export default router;
