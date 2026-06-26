import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const cloudinaryUrl = process.env.CLOUDINARY_URL || '';

// Detect if Cloudinary is fully configured
export const isCloudinaryConfigured = cloudinaryUrl.trim().length > 0 && !cloudinaryUrl.startsWith('cloudinary://mock');

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloudinary_url: cloudinaryUrl
  });
}

export default cloudinary;
