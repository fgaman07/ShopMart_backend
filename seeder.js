import mongoose from 'mongoose';
import dotenv from 'dotenv';
import colors from 'colors';
import products from './data/products.js';
import Product from './models/productModel.js';
import connectDB from './config/db.js';

dotenv.config();

connectDB();

const importData = async () => {
  try {
    // Clear existing data
    await Product.deleteMany();

    // Map through the mock data to rename 'id' to something else or just remove it.
    // MongoDB will automatically create '_id'. 
    const sampleProducts = products.map((product) => {
      // Removing the hardcoded 'id' property so MongoDB auto-generates '_id'.
      // We will keep old IDs mapped to a field or just let MongoDB handle it.
      // For simplicity, we just insert the products.
      const { id, ...rest } = product; 
      // Actually, since our frontend currently expects `.id`, we should probably map MongoDB's `_id` to `.id` in the API response later.
      return { ...rest };
    });

    await Product.insertMany(sampleProducts);

    console.log('Data Imported!'.green.inverse);
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`.red.inverse);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Product.deleteMany();

    console.log('Data Destroyed!'.red.inverse);
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`.red.inverse);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
