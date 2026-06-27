import cloudinaryConfig from '../config/cloudinary.js';

export const uploadToCloudinary = async (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinaryConfig.uploader.upload_stream(
      {
        folder: options.folder || 'expense-tracker',
        resource_type: 'auto',
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return null;
  try {
    return await cloudinaryConfig.uploader.destroy(publicId);
  } catch (err) {
    // Non-critical — silently fail
    return null;
  }
};
