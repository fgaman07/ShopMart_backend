import mongoose from 'mongoose';

const notificationSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    orderId: { type: String, default: null },
    type: {
      type: String,
      enum: ['order_update', 'promo', 'general'],
      default: 'order_update',
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
