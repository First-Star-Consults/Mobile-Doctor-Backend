import {v2 as cloudinary} from 'cloudinary';
          
cloudinary.config({ 
  cloud_name: 'ditdm55co', 
  api_key: '829837161941224', 
  api_secret: 'J0xrnYHHHoXj7wU14JVLaeaO3x8' 
});


const upload = async (file) => {
    const image = await cloudinary.uploader.upload(
      file,
      (result) => result
    );
    return image;
  };

 
 export default upload; 