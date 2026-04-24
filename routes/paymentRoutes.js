import express from 'express';
import paymentController from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/razorpay/key', paymentController.getRazorpayKey);
router.post('/razorpay/order', protect, paymentController.createRazorpayOrder);
router.post('/razorpay/verify', protect, paymentController.verifyRazorpayPayment);

export default router;
