//health Provider controller

import { Doctor } from "../models/healthProviders.js";
import { Reviews } from "../models/services.js";
import { uploadBase64 } from "../config/cloudinary.js";

const healthProviderControllers = {


  // setCredentials: async (req, res) => {
  //   try {
  //     // Extract profile information from request body
  //     const {
  //       fullName,
  //       registrationNumber,
  //       registrationYear,
  //       registrationCouncil,
  //       country,
  //       address,
  //       gender,
  //       about,
  //       medicalSpecialty, 
  //       medicalOfficer, 
  //     } = req.body;

  //     const providerId = req.params.providerId;

  //     // Find the user by ID
  //     const foundUser = await Doctor.findById(providerId);

  //     if (!foundUser) {
  //       return res.status(404).json({ success: false, error: 'User not found' });
  //     }

  //     // Update the user's profile
  //     foundUser.fullName = fullName;
  //     foundUser.registrationNumber = registrationNumber;
  //     foundUser.registrationYear = registrationYear;
  //     foundUser.registrationCouncil = registrationCouncil;
  //     foundUser.country = country;
  //     foundUser.address = address;
  //     foundUser.gender = gender;
  //     foundUser.about = about;
  //     foundUser.medicalSpecialty = medicalSpecialty; 
  //     foundUser.medicalOfficer = medicalOfficer; 

  //     // Save the updated user profile
  //     const updatedProvider = await foundUser.save();

  //     // Handle file uploads to Cloudinary
  //     const updateQueries = {};
  //     const uploadedImages = [];

  //     // Iterate over each file and upload to Cloudinary
  //     for (const key in req.files) {
  //       const image = req.files[key];
  //       const fileTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  //       const imageSize = 1024;

  //       if (!fileTypes.includes(image.mimetype)) {
  //         return res.status(400).json({ success: false, error: 'Image formats supported: JPG, PNG, JPEG' });
  //       }

  //       if (image.size / 1024 > imageSize) {
  //         return res.status(400).json({ success: false, error: `Image size should be less than ${imageSize}kb` });
  //       }

  //       // Pass providerId as the folder name
  //       const cloudFile = await upload(image.tempFilePath, providerId);

  //       // Store the Cloudinary URL and construct update query for each image
  //       uploadedImages.push({ [key]: cloudFile.url });
  //       updateQueries[`images.${key}`] = cloudFile.url;
  //     }

  //     // Update user model with the Cloudinary URLs for all images
  //     const updateQuery = { $set: updateQueries };
  //     const updatedDoctor = await Doctor.findByIdAndUpdate(providerId, updateQuery, { new: true });

  //     res.status(201).json({
  //       success: true,
  //       message: 'Profile information and images updated successfully',
  //       updatedProvider,
  //       imageUrls: uploadedImages,
  //       updatedDoctor,
  //     });
  //   } catch (error) {
  //     console.error('Error updating profile and images:', error);
  //     res.status(500).json({ success: false, error: 'Error updating profile and images' });
  //   }
  // },

  // Add a new review for a doctor

  setCredentials: async (req, res) => {
    try {
      const {
        fullName,
        registrationNumber,
        registrationYear,
        registrationCouncil,
        country,
        address,
        gender,
        about,
        medicalSpecialty,
        medicalOfficer,
        //base64 strings in the request body
        profilePhotoBase64,
        governmentIdfrontBase64,
        governmentIdbackBase64,
        workLicenseBase64,
        qualificationCertBase64
      } = req.body;

      const providerId = req.params.providerId;

      
      const foundUser = await Doctor.findById(providerId);
      if (!foundUser) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      // Update the user's profile
      foundUser.fullName = fullName;
      foundUser.registrationNumber = registrationNumber;
      foundUser.registrationYear = registrationYear;
      foundUser.registrationCouncil = registrationCouncil;
      foundUser.country = country;
      foundUser.address = address;
      foundUser.gender = gender;
      foundUser.about = about;
      foundUser.medicalSpecialty = medicalSpecialty;
      foundUser.medicalOfficer = medicalOfficer;

      // Save the updated user profile
      await foundUser.save();

      // Handle base64 encoded file uploads to Cloudinary
      const imageKeys = [
        { key: 'profilePhoto', data: profilePhotoBase64 },
        { key: 'governmentIdfront', data: governmentIdfrontBase64 },
        { key: 'governmentIdback', data: governmentIdbackBase64 },
        { key: 'workLicense', data: workLicenseBase64 },
        { key: 'qualificationCert', data: qualificationCertBase64 }
      ];

      const updateQueries = {};
      const uploadedImages = [];

      for (const { key, data } of imageKeys) {
        if (data) {
          try {
            const cloudFile = await uploadBase64(data, `provider/${providerId}`);
            uploadedImages.push({ [key]: cloudFile.url });
            updateQueries[`images.${key}`] = cloudFile.url;
          } catch (error) {
            return res.status(500).json({ success: false, error: `Failed to upload image for ${key}` });
          }
        }
      }

      // Update user model with the Cloudinary URLs for all images
      const updatedProvider = await Doctor.findByIdAndUpdate(providerId, { $set: updateQueries }, { new: true });

      res.status(201).json({
        success: true,
        message: 'Profile information and images updated successfully',
        updatedProvider,
        imageUrls: uploadedImages
      });
    } catch (error) {
      console.error('Error updating profile and images:', error);
      res.status(500).json({ success: false, error: 'Error updating profile and images' });
    }
  },



  addReview: async (req, res) => {
    try {
      const doctorId = req.params.doctorId;
      const { patientId, rating, comment } = req.body;

      // Ensure rating is within the 1-5 range
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: "Rating must be between 1 and 5." });
      }

      // Find the doctor by ID
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({ success: false, message: "Doctor not found" });
      }

      // Create a new review
      const review = await Reviews.create({
        doctor: doctorId,
        patient: patientId,
        rating,
        comment,
      });

      // Add review to doctor's reviews
      doctor.reviews.push(review._id);
      await doctor.save();

      return res.status(201).json({ success: true, message: "Review added successfully", review });
    } catch (error) {
      console.error("Error adding review:", error);
      return res.status(500).json({ success: false, message: "Error adding review" });
    }
  },


  // Function to get top-rated doctors
  getTopRatedDoctors: async (req, res) => {
    try {
      const topRatedDoctors = await Doctor.aggregate([
        {
          $lookup: {
            from: "reviews", // Assuming your reviews collection is named "reviews"
            localField: "_id",
            foreignField: "doctor",
            as: "reviews"
          }
        },
        {
          $addFields: {
            averageRating: { $avg: "$reviews.rating" }
          }
        },
        { $sort: { averageRating: -1 } }, // Sort by averageRating in descending order
        { $limit: 10 } // You can adjust the limit as per your requirement
      ]);

      res.status(200).json({
        success: true,
        data: topRatedDoctors
      });
    } catch (error) {
      console.error("Error fetching top rated doctors:", error);
      res.status(500).json({ success: false, message: "Error fetching top rated doctors" });
    }
  },





};

export default healthProviderControllers;
