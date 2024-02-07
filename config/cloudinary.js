import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'ditdm55co',
  api_key: '829837161941224',
  api_secret: 'J0xrnYHHHoXj7wU14JVLaeaO3x8',
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
