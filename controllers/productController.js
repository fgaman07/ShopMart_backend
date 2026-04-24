import Product from '../models/productModel.js';

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const keyword = req.query.keyword
      ? {
          title: {
            $regex: req.query.keyword,
            $options: 'i',
          },
        }
      : {};

    const restaurant = req.query.restaurant ? { restaurant: req.query.restaurant } : {};
    
    const category = req.query.category && req.query.category !== 'All' 
      ? { category: req.query.category } 
      : {};

    const priceFilter = {};
    if (req.query.minPrice || req.query.maxPrice) {
      priceFilter.price = {};
      if (req.query.minPrice) priceFilter.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) priceFilter.price.$lte = Number(req.query.maxPrice);
    }

    let sortObj = {};
    if (req.query.sort) {
      if (req.query.sort === 'price_asc') sortObj = { price: 1 };
      else if (req.query.sort === 'price_desc') sortObj = { price: -1 };
      else if (req.query.sort === 'newest') sortObj = { createdAt: -1 };
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const queryFilter = { ...keyword, ...restaurant, ...category, ...priceFilter };
    const count = await Product.countDocuments(queryFilter);
    const products = await Product.find(queryFilter).sort(sortObj).limit(limit).skip(skip);
    
    // Map _id to id to maintain frontend compatibility
    const formattedProducts = products.map(p => {
       const productObj = p.toObject();
       return { ...productObj, id: productObj._id.toString() };
    });
    
    res.json({
      products: formattedProducts,
      page,
      pages: Math.ceil(count / limit),
      total: count
    });
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

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await Product.deleteOne({ _id: product._id });
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const product = new Product({
      name: 'Sample name',
      price: 0,
      user: req.user._id,
      image: 'https://via.placeholder.com/300',
      brand: 'Sample brand',
      category: 'Sample category',
      countInStock: 0,
      numReviews: 0,
      description: 'Sample description',
    });

    const createdProduct = await product.save();
    res.status(201).json({ ...createdProduct.toObject(), id: createdProduct._id.toString() });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const { name, price, description, image, brand, category, countInStock } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
      product.name = name;
      product.price = price;
      product.description = description;
      product.image = image;
      product.brand = brand;
      product.category = category;
      product.countInStock = countInStock;

      const updatedProduct = await product.save();
      res.json({ ...updatedProduct.toObject(), id: updatedProduct._id.toString() });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export default { getProducts, getProductById, deleteProduct, createProduct, updateProduct };
