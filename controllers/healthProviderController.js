//health Provider controller

import { Doctor, Pharmacy, Therapist, Laboratory } from "../models/healthProviders.js";
import { Reviews } from "../models/services.js";
import { upload } from "../config/cloudinary.js";

const healthProviderControllers = {

  setCredentials: async (req, res) => {
    try {
      const providerId = req.params.providerId;
      
      const {
        fullName,
        registrationNumber,
        registrationYear,
        registrationCouncil,
        country,
        address,
        gender,
        about,
        medicalSpecialty 
      } = req.body;
  
      // Find the user by ID
      const foundUser = await Doctor.findById(providerId);
  
      if (!foundUser) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
  
      // Convert medicalSpecialty to object if it's a string
    let medicalSpecialtyObj = medicalSpecialty;
    if (typeof medicalSpecialty === 'string') {
      medicalSpecialtyObj = {
        name: medicalSpecialty.toLowerCase(), // Convert name to lowercase
        fee: 1000 // Default fee, adjust as needed
      };
    } else if (medicalSpecialty && typeof medicalSpecialty === 'object' && medicalSpecialty.name) {
      medicalSpecialtyObj.name = medicalSpecialty.name.toLowerCase();
    }
  
      // Update the doctor's profile with the new information
      foundUser.fullName = fullName || foundUser.fullName;
      foundUser.registrationNumber = registrationNumber || foundUser.registrationNumber;
      foundUser.registrationYear = registrationYear || foundUser.registrationYear;
      foundUser.registrationCouncil = registrationCouncil || foundUser.registrationCouncil;
      foundUser.country = country || foundUser.country;
      foundUser.address = address || foundUser.address;
      foundUser.gender = gender || foundUser.gender;
      foundUser.about = about || foundUser.about;
      if (medicalSpecialtyObj) {
        foundUser.medicalSpecialty = medicalSpecialtyObj; // Assign the object
      }
  
      // Save the updated user profile
       await foundUser.save(); // Saving the updates and storing in variable

      // Handle file uploads to Cloudinary
      const updateQueries = {};
      const uploadedImages = [];
  
      // Iterate over each file and upload to Cloudinary
      for (const key in req.files) {
        const image = req.files[key];
        const fileTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        const imageSize = 1024; // assuming you want to use 1 MB = 1024 KB
  
        if (!fileTypes.includes(image.mimetype)) {
          return res.status(400).json({ success: false, error: 'Image formats supported: JPG, PNG, JPEG' });
        }
  
        if (image.size / 1024 > imageSize) { // assuming size is in bytes, you need to convert to KB
          return res.status(400).json({ success: false, error: `Image size should be less than ${imageSize}kb` });
        }
  
        // Upload to Cloudinary
        const cloudFile = await upload(image.tempFilePath, providerId);
        uploadedImages.push({ [key]: cloudFile.url });
        updateQueries[`images.${key}`] = cloudFile.url;
      }
  
      // Update user model with the Cloudinary URLs for all images
      const updatedDoctor = await Doctor.findByIdAndUpdate(providerId, { $set: updateQueries }, { new: true });

       // Set kycVerification to true after successful profile and image updates
       foundUser.kycVerification = true;
       await foundUser.save(); 
  
      res.status(201).json({
        success: true,
        message: 'Profile and image updated successfully',
        updatedDoctor: updatedDoctor, // Sending the updated doctor information
        imageUrls: uploadedImages,
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      // It's useful to log the actual error message to understand what went wrong
      res.status(500).json({ success: false, error: 'Error updating profile', errorMessage: error.message });
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

  // Add this function within the healthProviderControllers object

getDoctorReviews: async (req, res) => {
  try {
      const doctorId = req.params.doctorId;
      
      // Ensure the doctor exists
      const doctorExists = await Doctor.findById(doctorId);
      if (!doctorExists) {
          return res.status(404).json({ success: false, message: "Doctor not found" });
      }

      // Fetch reviews for the doctor and include patient's name
      const reviews = await Reviews.find({ doctor: doctorId })
                                   .populate({
                                      path: 'patient',
                                      select: 'firstName lastName -_id' // Adjust the fields as needed
                                   })
                                   .exec();

      if (reviews.length === 0) {
          return res.status(404).json({ success: false, message: "No reviews found for this doctor." });
      }

      res.status(200).json({ success: true, reviews });
  } catch (error) {
      console.error("Error fetching doctor reviews:", error);
      res.status(500).json({ success: false, message: "Error fetching reviews", error: error.message });
  }
},



  // Function to get top-rated doctors
  getTopRatedDoctors: async (req, res) => {
  try {
    const topRatedDoctors = await Doctor.aggregate([
      {
        $match: {
          kycVerification: true // Only include doctors whose kycVerification is true
        }
      },
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


  getAllLaboratories: async (req, res) => {
    try {
      const laboratories = await Laboratory.find({}); // Retrieves all laboratories
      res.status(200).json({ success: true, laboratories });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error fetching laboratories', error });
    }
  },

  getAllPharmacies: async (req, res) => {
    try {
      const pharmacies = await Pharmacy.find({}); // Retrieves all pharmacies
      res.status(200).json({ success: true, pharmacies });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error fetching pharmacies', error });
    }
  },

  getAllTherapists: async (req, res) => {
    try {
      const therapists = await Therapist.find({}); // Retrieves all therapists
      res.status(200).json({ success: true, therapists });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error fetching therapists', error });
    }
  },

  getAllDoctors: async (req, res) => {
    try {
      const doctors = await Doctor.aggregate([
        {
          $match: {
            kycVerification: true // Only include doctors whose kycVerification is true
          }
        }
      ]);
      
      // Send the response outside the aggregation pipeline
      res.status(200).json({ success: true, doctors });
    } catch (error) {
      console.error("Error fetching doctors:", error); // Added console.error for better error tracking
      res.status(500).json({ success: false, message: 'Error fetching doctors', error });
    }
  },


  // Controller function to check the online status of a health provider
  checkOnlineStatus: async (req, res) => {
    try {
      const providerId = req.params.providerId;

      // Find the health provider by ID
      const provider = await Doctor.findById(providerId);

      if (!provider) {
        return res.status(404).json({ success: false, message: 'Health provider not found' });
      }

      // Respond with the online status of the health provider
      res.status(200).json({ success: true, isOnline: provider.isOnline });
    } catch (error) {
      console.error('Error checking online status:', error);
      res.status(500).json({ success: false, error: 'Error checking online status' });
    }
  },

   // Controller function to get online and sponsored doctors
   getOnlineSponsoredDoctors: async (req, res) => {
    try {
      // Query the database for doctors with isOnline and sponsored set to true
      const doctors = await Doctor.find({ isOnline: true, sponsored: true });

      // Respond with the list of doctors
      res.status(200).json({ success: true, doctors });
    } catch (error) {
      console.error('Error fetching online and sponsored doctors:', error);
      res.status(500).json({ success: false, error: 'Error fetching online and sponsored doctors' });
    }
  },

  // Controller function to update the isOnline status of a doctor
  updateIsOnlineStatus: async (req, res) => {
    try {
      const { doctorId } = req.params;
      const { isOnline } = req.body;

      // Find the doctor by ID
      const doctor = await Doctor.findById(doctorId);

      if (!doctor) {
        return res.status(404).json({ success: false, message: 'Doctor not found' });
      }

      // Update the isOnline status
      doctor.isOnline = isOnline;
      await doctor.save();

      // Respond with the updated doctor
      res.status(200).json({ success: true, doctor });
    } catch (error) {
      console.error('Error updating isOnline status:', error);
      res.status(500).json({ success: false, error: 'Error updating isOnline status' });
    }
  },


  
  
  





};

export default healthProviderControllers;
