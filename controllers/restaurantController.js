import Restaurant from '../models/restaurantModel.js';

// @desc    Fetch all restaurants
// @route   GET /api/restaurants
// @access  Public
const getRestaurants = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      
      const restaurants = await Restaurant.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [longitude, latitude] },
            distanceField: 'dist.calculated',
            maxDistance: 10000, // 10km in meters
            spherical: true
          }
        }
      ]);
      res.json(restaurants);
    } else {
      const restaurants = await Restaurant.find({});
      res.json(restaurants);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Fetch single restaurant
// @route   GET /api/restaurants/:id
// @access  Public
const getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (restaurant) {
      res.json(restaurant);
    } else {
      res.status(404).json({ message: 'Restaurant not found' });
    }
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a restaurant
// @route   POST /api/restaurants
// @access  Private/Vendor or Admin
const createRestaurant = async (req, res) => {
  try {
    const restaurant = new Restaurant({
      name: 'Sample Restaurant',
      user: req.user._id,
      image: 'https://via.placeholder.com/300',
      description: 'Sample description',
      address: 'Sample address',
    });

    const createdRestaurant = await restaurant.save();
    res.status(201).json(createdRestaurant);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export default { getRestaurants, getRestaurantById, createRestaurant };
