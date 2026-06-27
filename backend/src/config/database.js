import mongoose from 'mongoose';
import logger from './logger.js';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://root:root@127.0.0.1:27017/expense_tracker?authSource=admin';
    await mongoose.connect(mongoURI);
    logger.info('MongoDB Connected Successfully — Expense Tracker DB');
  } catch (error) {
    logger.error(`Database Connection Failure: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
