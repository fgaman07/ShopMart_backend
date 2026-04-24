import express from 'express';
import couponController from '../controllers/couponController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/apply', protect, couponController.applyCoupon);
router.route('/')
  .get(protect, admin, couponController.getCoupons)
  .post(protect, admin, couponController.createCoupon);
router.route('/:id')
  .put(protect, admin, couponController.updateCoupon)
  .delete(protect, admin, couponController.deleteCoupon);

export default router;
