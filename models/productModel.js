import mongoose from 'mongoose';

const productSchema = mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: 'Restaurant',
    },
    title: {
      type: String,
      required: true,
    },
    weight: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    originalPrice: {
      type: Number,
    },
    discount: {
      type: Number,
    },
    image: {
      type: String,
      required: true,
    },
    // Adding standard ecommerce fields for future compatibility
    description: {
      type: String,
      required: false,
      default: "Premium quality product."
    },
    category: {
      type: String,
      required: false,
      default: "Groceries"
    },
    countInStock: {
      type: Number,
      required: false,
      default: 10
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model('Product', productSchema);

export default Product;
