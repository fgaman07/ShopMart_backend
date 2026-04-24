import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from '../models/orderModel.js';

// Lazy init — only creates instance when a payment route is actually called.
// This prevents a crash on server startup when keys are placeholder values.
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || key_id.includes('YourKey') || !key_secret || key_secret.includes('YourKey')) {
    throw new Error('Razorpay keys are not configured. Please update RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env');
  }
  return new Razorpay({ key_id, key_secret });
};

// @desc    Create a Razorpay order
// @route   POST /api/payment/razorpay/order
// @access  Private
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body; // amount in rupees
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount.' });
    }

    const options = {
      amount: Math.round(amount * 100), // convert to paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create(options);
    res.json({
      id: order.id,
      currency: order.currency,
      amount: order.amount,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Razorpay error:', err);
    res.status(500).json({ message: 'Failed to create payment order.' });
  }
};

// @desc    Verify Razorpay payment signature & mark order as paid
// @route   POST /api/payment/razorpay/verify
// @access  Private
const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
    }

    // Mark order as paid in DB
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: razorpay_payment_id,
      status: 'COMPLETED',
      update_time: new Date().toISOString(),
      email_address: req.user.email || '',
    };
    order.orderStatus = 'Accepted';

    const updatedOrder = await order.save();
    res.json({ success: true, order: updatedOrder });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ message: 'Payment verification server error.' });
  }
};

// @desc    Get Razorpay key for frontend
// @route   GET /api/payment/razorpay/key
// @access  Public
const getRazorpayKey = async (req, res) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID });
};

export default { createRazorpayOrder, verifyRazorpayPayment, getRazorpayKey };
