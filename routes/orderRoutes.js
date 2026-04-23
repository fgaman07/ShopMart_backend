import express from 'express';
import orderController from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, orderController.addOrderItems).get(protect, admin, orderController.getOrders);
router.route('/mine').get(protect, orderController.getMyOrders);
router.route('/:id').get(protect, orderController.getOrderById);
router.route('/:id/pay').put(protect, orderController.updateOrderToPaid);
router.route('/:id/deliver').put(protect, admin, orderController.updateOrderToDelivered);

export default router;
