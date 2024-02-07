import { Doctor } from "../models/healthProviders.js";
import upload from "../config/cloudinary.js";

const healthProviderControllers = {

  addCredentials: async (req, res) => {
    try {
      // Extract profile information from request body
      const {
        registrationNumber,
        registrationYear,
        registrationCouncil,
        country,
        address,
        gender,
        about,
      } = req.body;

      const providerId = req.params.providerId;

      // Find the user by ID
      const foundUser = await Doctor.findById(providerId);

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
      foundUser.about = about;

      // Save the updated user profile
      const updatedProvider = await foundUser.save();

      // Handle file uploads to Cloudinary
      const updateQueries = {};
      const uploadedImages = [];

      // Iterate over each file and upload to Cloudinary
      for (const key in req.files) {
        const image = req.files[key];
        const fileTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        const imageSize = 1024;

        if (!fileTypes.includes(image.mimetype)) {
          return res.status(400).json({ success: false, error: 'Image formats supported: JPG, PNG, JPEG' });
        }

        if (image.size / 1024 > imageSize) {
          return res.status(400).json({ success: false, error: `Image size should be less than ${imageSize}kb` });
        }

        // Pass providerId as the folder name
        const cloudFile = await upload(image.tempFilePath, providerId);

        // Store the Cloudinary URL and construct update query for each image
        uploadedImages.push({ [key]: cloudFile.url });
        updateQueries[`images.${key}`] = cloudFile.url;
      }

      // Update user model with the Cloudinary URLs for all images
      const updateQuery = { $set: updateQueries };
      const updatedDoctor = await Doctor.findByIdAndUpdate(providerId, updateQuery, { new: true });

      res.status(201).json({
        success: true,
        message: 'Profile information and images updated successfully',
        updatedProvider,
        imageUrls: uploadedImages,
        updatedDoctor,
      });
    } catch (error) {
      console.error('Error updating profile and images:', error);
      res.status(500).json({ success: false, error: 'Error updating profile and images' });
    }
  },
};

export default healthProviderControllers;
