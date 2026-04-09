import Product from '../models/productModel.js';

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    
    // Map _id to id to maintain frontend compatibility
    const formattedProducts = products.map(p => {
       const productObj = p.toObject();
       return { ...productObj, id: productObj._id.toString() };
    });
    
    res.json(formattedProducts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      const productObj = product.toObject();
      res.json({ ...productObj, id: productObj._id.toString() });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error(error);
    // If it's a CastError, it's a bad ObjectId format
    if (error.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Product not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

export default { getProducts, getProductById };
