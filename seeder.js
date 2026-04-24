import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/userModel.js';
import Product from './models/productModel.js';
import products from './data/products.js';
import connectDB from './config/db.js';

dotenv.config();
connectDB();

const adminUser = {
  name: 'Admin User',
  email: 'admin@shopstore.com',
  password: 'admin123456',
  isAdmin: true,
  isVendor: false,
  isDriver: false,
};

const sampleUsers = [
  adminUser,
  {
    name: 'Vendor Demo',
    email: 'vendor@shopstore.com',
    password: 'vendor123456',
    isAdmin: false,
    isVendor: true,
    isDriver: false,
  },
  {
    name: 'John Customer',
    email: 'john@shopstore.com',
    password: 'john123456',
    isAdmin: false,
    isVendor: false,
    isDriver: false,
  },
];

const importData = async () => {
  try {
    // Clear existing users & products
    await User.deleteMany();
    await Product.deleteMany();

    // Hash passwords and insert users
    const hashedUsers = await Promise.all(
      sampleUsers.map(async (user) => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        return { ...user, password: hashedPassword };
      })
    );

    const createdUsers = await User.insertMany(hashedUsers);
    console.log('\n✅  Users seeded!');
    console.log('─────────────────────────────────────────');
    createdUsers.forEach((u) => {
      const role = u.isAdmin ? '👑 ADMIN' : u.isVendor ? '🏪 VENDOR' : '👤 CUSTOMER';
      const rawPw = sampleUsers.find((s) => s.email === u.email)?.password;
      console.log(`  ${role}  |  ${u.email}  |  Password: ${rawPw}`);
    });
    console.log('─────────────────────────────────────────\n');

    // Insert products (strip hardcoded 'id' if any)
    const sampleProducts = products.map(({ id, ...rest }) => rest);
    await Product.insertMany(sampleProducts);
    console.log('✅  Products seeded!\n');

    console.log('🎉  All data imported successfully!\n');
    process.exit();
  } catch (error) {
    console.error(`\n❌  Error: ${error.message}\n`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await User.deleteMany();
    await Product.deleteMany();
    console.log('\n🗑️   All data destroyed!\n');
    process.exit();
  } catch (error) {
    console.error(`\n❌  Error: ${error.message}\n`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
