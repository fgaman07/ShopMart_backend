import express from 'express';
import restaurantController from '../controllers/restaurantController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(restaurantController.getRestaurants).post(protect, restaurantController.createRestaurant);
router.route('/:id').get(restaurantController.getRestaurantById);

export default router;
