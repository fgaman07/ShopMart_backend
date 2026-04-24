import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';
import Restaurant from '../models/restaurantModel.js';
import Review from '../models/reviewModel.js';
import { createNotification } from './notificationController.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400).json({ message: 'No order items' });
    return;
  } else {
    // Check operating hours
    if (orderItems.length > 0) {
      const firstProduct = await Product.findById(orderItems[0].id).populate('restaurant');
      if (firstProduct && firstProduct.restaurant) {
        const restaurant = firstProduct.restaurant;
        if (restaurant.operatingHours) {
          const { openTime, closeTime } = restaurant.operatingHours;
          const now = new Date();
          const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: "2-digit", minute: "2-digit" });
          if (currentTime < openTime || currentTime > closeTime) {
            return res.status(400).json({ message: `Restaurant is currently closed. Operating hours: ${openTime} - ${closeTime}` });
          }
        }
      }
    }
    const order = new Order({
      orderItems: orderItems.map((x) => ({
        ...x,
        product: x.id, // Our frontend uses .id
        _id: undefined,
      })),
      user: req.user._id,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    });

    const createdOrder = await order.save();

    res.status(201).json(createdOrder);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    'user',
    'name email'
  );

  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.email_address,
    };

    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id });
  res.json(orders);
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
  const orders = await Order.find({}).populate('user', 'id name');
  res.json(orders);
};

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
    order.orderStatus = 'Delivered';

    const updatedOrder = await order.save();
    
    req.app.get('io').to(`order_${order._id}`).emit('statusUpdate', updatedOrder);
    await createNotification(order.user, `Your order #${order._id.toString().slice(-6).toUpperCase()} has been delivered! 🎉`, order._id);

    res.json(updatedOrder);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

// @desc    Get available orders for drivers
// @route   GET /api/orders/available
// @access  Private/Driver
const getAvailableOrders = async (req, res) => {
  // Find orders that don't have a driver assigned yet
  const orders = await Order.find({ driver: null, isPaid: true }).populate('user', 'id name');
  res.json(orders);
};

// @desc    Accept order as a driver
// @route   PUT /api/orders/:id/accept
// @access  Private/Driver
const acceptOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    if (order.driver) {
      return res.status(400).json({ message: 'Order already accepted by another driver' });
    }
    
    order.driver = req.user._id;
    order.orderStatus = 'Accepted';
    
    const updatedOrder = await order.save();
    
    req.app.get('io').to(`order_${order._id}`).emit('statusUpdate', updatedOrder);
    await createNotification(order.user, `Your order #${order._id.toString().slice(-6).toUpperCase()} has been accepted and is being prepared! 🍳`, order._id);

    res.json(updatedOrder);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
};

// @desc    Get dashboard statistics for admin
// @route   GET /api/orders/stats
// @access  Private/Admin
const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    
    // Total orders and revenue
    const orderStats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSales: { 
            $sum: { $cond: [{ $eq: ["$isPaid", true] }, "$totalPrice", 0] } 
          }
        }
      }
    ]);
    
    // Revenue per day over the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const salesData = await Order.aggregate([
      {
        $match: {
          isPaid: true,
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sales: { $sum: "$totalPrice" }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const recentOrders = await Order.find({})
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Advanced Features
    const lowStockProducts = await Product.find({ countInStock: { $lte: 10 } })
      .select('title countInStock image')
      .sort({ countInStock: 1 })
      .limit(5);

    const recentReviews = await Review.find({})
      .populate('user', 'name')
      .populate('restaurant', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const topProducts = await Order.aggregate([
      { $match: { isPaid: true } },
      { $unwind: "$orderItems" },
      {
        $group: {
          _id: "$orderItems.product",
          title: { $first: "$orderItems.title" },
          image: { $first: "$orderItems.image" },
          totalSold: { $sum: "$orderItems.qty" },
          revenue: { $sum: { $multiply: ["$orderItems.qty", "$orderItems.price"] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      totalUsers,
      totalProducts,
      totalOrders: orderStats[0]?.totalOrders || 0,
      totalSales: orderStats[0]?.totalSales || 0,
      salesData,
      recentOrders,
      lowStockProducts,
      recentReviews,
      topProducts
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
};

export default {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  getMyOrders,
  getOrders,
  updateOrderToDelivered,
  getAvailableOrders,
  acceptOrder,
  getAdminStats,
};
