import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_APIKEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const upload = async (file, folderName) => {
  const options = {
    folder: folderName, // Specify the folder name (user identifier)
    public_id: `${folderName}/${Date.now()}`, // Use a unique public_id with timestamp
  };

  try {
    const image = await cloudinary.uploader.upload(file, options);
    return image;
  } catch (error) {
    throw error;
  }
};

export default upload;
