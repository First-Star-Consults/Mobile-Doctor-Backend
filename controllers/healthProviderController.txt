import { Doctor } from "../models/healthProviders.js";
import upload from "../config/cloudinary.js";

const healthProviderControllers = {

  //update provide credentials, receives there documents as image
  updateImages: async (req, res) => {

    try {
      const imageTitle = req.params.imageTitle; // Assuming you have the image type from the request parameters


      if (!req.files || !req.files.image) {
        return res.status(400).json({ success: false, error: 'Please upload an image' });
      }

      const { image } = req.files;
      const fileTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const imageSize = 1024; 

    if (!fileTypes.includes(image.mimetype)) return res.send('Image formats supported: JPG, PNG, JPEG');  

    if (image.size / 1024 > imageSize) return res.send(`Image size should be less than ${imageSize}kb`);

      // Upload image to Cloudinary
      const cloudFile = await upload(image.tempFilePath);

      // Update user model with the Cloudinary URL for the specific image type
      const updateQuery = { $set: { [`profilePicture`]: cloudFile.url } };
      const updatedDoctor = await Doctor.findByIdAndUpdate(req.params.doctorId, updateQuery, { new: true });

      res.status(201).json({
        success: true,
        message: `${imageTitle} updated successfully`,
        imageUrl: cloudFile.url,
        updatedDoctor,
      });
    } catch (error) {
      console.error(`Error updating ${imageType}:`, error);
      res.status(500).json({ success: false, error: `Error updating ${imageType}` });
    }
  },


  updateProfile: async (req, res) => {
    try {
      const {
        registrationNumber,
        registrationYear,
        registrationCouncil,
        country,
        address,
        gender,
        aboutYourself,
      } = req.body;
  
      const userId = req.params.userId;
  
      // Find the user by ID
      const foundUser = await Doctor.findById(userId);
  
      if (!foundUser) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
  
      // Update the user's profile
      foundUser.registrationNumber = registrationNumber;
      foundUser.registrationYear = registrationYear;
      foundUser.registrationCouncil = registrationCouncil;
      foundUser.country = country;
      foundUser.address = address;
      foundUser.gender = gender;
      foundUser.aboutYourself = aboutYourself;
  
      // Save the updated user
      const updatedProvider = await foundUser.save();
  
      res.json({ success: true, data: updatedProvider });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ success: false, error: 'Error updating profile' });
    }
  },
  
  

};


export default healthProviderControllers;
