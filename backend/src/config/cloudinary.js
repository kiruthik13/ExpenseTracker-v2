import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dummy_cloud',
  api_key: process.env.CLOUDINARY_API_KEY || 'dummy_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'dummy_secret',
});

export default cloudinary;
