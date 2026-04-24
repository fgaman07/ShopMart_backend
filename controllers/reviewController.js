import Review from '../models/reviewModel.js';
import Restaurant from '../models/restaurantModel.js';
import Product from '../models/productModel.js';

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
  try {
    const { restaurantId, productId, rating, comment } = req.body;

    if (!restaurantId && !productId) {
      return res.status(400).json({ message: 'A restaurant or product ID is required.' });
    }
    if (!rating || !comment) {
      return res.status(400).json({ message: 'Rating and comment are required.' });
    }

    // Prevent duplicate reviews
    const alreadyReviewed = await Review.findOne({
      user: req.user._id,
      ...(restaurantId ? { restaurant: restaurantId } : {}),
      ...(productId ? { product: productId } : {}),
    });
    if (alreadyReviewed) {
      return res.status(400).json({ message: 'You have already reviewed this item.' });
    }

    const review = await Review.create({
      user: req.user._id,
      userName: req.user.name,
      restaurant: restaurantId || null,
      product: productId || null,
      rating: Number(rating),
      comment,
    });

    // Update restaurant rating + numReviews
    if (restaurantId) {
      const reviews = await Review.find({ restaurant: restaurantId });
      const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
      await Restaurant.findByIdAndUpdate(restaurantId, {
        rating: avgRating,
        numReviews: reviews.length,
      });
    }

    // Update product rating + numReviews
    if (productId) {
      const reviews = await Review.find({ product: productId });
      const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
      await Product.findByIdAndUpdate(productId, {
        rating: avgRating,
        numReviews: reviews.length,
      });
    }

    res.status(201).json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get reviews for a restaurant
// @route   GET /api/reviews/restaurant/:id
// @access  Public
const getRestaurantReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ restaurant: req.params.id }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:id
// @access  Public
const getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.id }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export default { createReview, getRestaurantReviews, getProductReviews };
