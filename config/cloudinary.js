//config-cloudinary.js
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: "dqc2vy030",
  api_key: "586729314615645",
  api_secret: "v4dWdfe8UuJ6uxMEeISkzgS9gVY",
});

export const upload = async (file, folderName) => {
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

// Function to upload a base64-encoded image to Cloudinary
export const uploadBase64 = async (base64Data, folderName) => {
  const options = {
    folder: folderName,
    public_id: `${folderName}/${Date.now()}`,
  };

  try {
    // Cloudinary's API expects the base64 data to be prefixed by a data URI schema
    const image = await cloudinary.uploader.upload(`data:image/png;base64,${base64Data}`, options);
    return image;
  } catch (error) {
    throw error;
  }
};


