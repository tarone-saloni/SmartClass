import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb+srv://wpragyaa_db_user:aTUvTkXC9pKrDL5H@cluster0.hs8kk5r.mongodb.net/wpragyaa_db?retryWrites=true&w=majority", {
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1); 
  }
}

export default connectDB;