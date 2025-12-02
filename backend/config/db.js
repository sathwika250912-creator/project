const mongoose = require('mongoose');

const connectDB = async () => {
  // Prefer MONGO_URI from env; fall back to a sensible local default for dev
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/projectdb';

  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected:', uri.includes('localhost') ? 'local' : 'remote');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.error('Ensure MongoDB is running and MONGO_URI is correct.');
  }
};

module.exports = connectDB;
