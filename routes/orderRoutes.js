import express from 'express';
import orderController from '../controllers/orderController.js';
import { protect, admin, driver } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, orderController.addOrderItems).get(protect, admin, orderController.getOrders);
router.route('/stats').get(protect, admin, orderController.getAdminStats);
router.route('/mine').get(protect, orderController.getMyOrders);
router.route('/available').get(protect, driver, orderController.getAvailableOrders);
router.route('/:id').get(protect, orderController.getOrderById);
router.route('/:id/pay').put(protect, orderController.updateOrderToPaid);
router.route('/:id/accept').put(protect, driver, orderController.acceptOrder);
router.route('/:id/deliver').put(protect, admin, orderController.updateOrderToDelivered);

export default router;
