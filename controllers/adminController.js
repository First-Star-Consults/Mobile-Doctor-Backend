//admin controller

import { Doctor } from "../models/healthProviders.js";
import User from "../models/user.js";

const adminController = {
  

  updateKycVerificationStatus: async (req, res) => {
    try {
      const adminId = req.params.userId; // or req.user._id if you have the user ID stored in req.user

    // Fetch the user from the database to check if they're an admin
    const user = await User.findById(adminId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found.'
      });
    }

    const isAdmin = user.isAdmin;

      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Permission denied. Only admin can update kycVerification status.',
        });
      }

      // Extract necessary information from the request
      const { userId, kycVerificationStatus } = req.body;

      // Find the user by ID
      const foundUser = await Doctor.findById(userId);

      if (!foundUser) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      // Update the kycVerification status
      foundUser.kycVerification = kycVerificationStatus;

      // Save the updated user
      const updatedUser = await foundUser.save();

      res.status(200).json({
        success: true,
        message: 'KycVerification status updated successfully',
        updatedUser,
      });
    } catch (error) {
      console.error('Error updating kycVerification status:', error);
      res.status(500).json({ success: false, error: 'Error updating kycVerification status' });
    }
  },

  updateConsultationFees: async (req, res) => {
    try {
      const userId = req.params.userId; // or req.user._id if you have the user ID stored in req.user

      // Fetch the user from the database to check if they're an admin
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found.'
        });
      }
  
      const isAdmin = user.isAdmin;
  
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Permission denied. Only admin can update consultation fees.',
        });
      }
  
      // Extract fee information from the request
      const { doctorId, specialty, newFee } = req.body;
  
      // Find the doctor by ID
      const doctor = await Doctor.findById(doctorId);
  
      if (!doctor) {
        return res.status(404).json({ success: false, error: 'Doctor not found' });
      }
  
      // Check if the specialty already exists
      const specialtyIndex = doctor.medicalSpecialty.findIndex(s => s.name === specialty);
  
      if (specialtyIndex > -1) {
        // Specialty exists, update the fee
        doctor.medicalSpecialty[specialtyIndex].fee = newFee;
      } else {
        // Specialty doesn't exist, add new specialty with fee
        doctor.medicalSpecialty.push({ name: specialty, fee: newFee });
      }
  
      // Save the updated doctor
      await doctor.save();
  
      res.status(200).json({
        success: true,
        message: 'Consultation fees updated successfully',
      });
    } catch (error) {
      console.error('Error updating consultation fees:', error);
      res.status(500).json({ success: false, error: 'Error updating consultation fees' });
    }
  },

  setFeeForAllSpecialties: async (req, res) => {
    try {
      
      const userId = req.params.userId; // or req.user._id if you have the user ID stored in req.user

      // Fetch the user from the database to check if they're an admin
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found.'
        });
      }
  
      const isAdmin = user.isAdmin;
  
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Permission denied. Only admin can update consultation fees.',
        });
      }
  
      // Extract fee information from the request
      const { specialtyToUpdate, newFee } = req.body;
  
      // Fetch all doctors with the specified specialty
      const doctors = await Doctor.find({ 'medicalSpecialty.name': specialtyToUpdate });
  
      // Update each doctor's fee for the specified specialty
      const updates = doctors.map(async (doctor) => {
        const specialtyIndex = doctor.medicalSpecialty.findIndex(s => s.name === specialtyToUpdate);
  
        if (specialtyIndex > -1) {
          // Specialty exists, update the fee
          doctor.medicalSpecialty[specialtyIndex].fee = newFee;
        } else {
          // Specialty doesn't exist, add new specialty with fee
          doctor.medicalSpecialty.push({ name: specialtyToUpdate, fee: newFee });
        }
  
        return doctor.save(); // Returns a promise
      });
  
      // Wait for all the update promises to resolve
      await Promise.all(updates);
  
      res.status(200).json({
        success: true,
        message: `Consultation fees for the specialty ${specialtyToUpdate} updated successfully across all doctors.`,
      });
    } catch (error) {
      console.error('Error setting fees for all specialties:', error);
      res.status(500).json({ success: false, error: 'Error setting fees for all specialties' });
    }
  },

  recommendDoctor: async (req, res) => {
    try {
        const { id } = req.params; // ID from the route parameters

        // First, confirm the user with this ID has a role of 'doctor'
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (user.role !== 'doctor') {
            return res.status(404).json({ message: "This user is not a doctor." });
        }

        // Since the User is a doctor, proceed to update the Doctor document using the same ID
        // Assuming the Doctor schema is separate but uses the same ID as the User schema for doctor roles
        const updatedDoctor = await Doctor.findByIdAndUpdate(
            id, // Use the ID directly since Doctor and User share the same ID
            { $set: { isRecommended: true } },
            { new: true }
        );

        if (!updatedDoctor) {
            return res.status(404).json({ message: "Doctor profile could not be updated." });
        }

        return res.status(200).json({
            message: "Doctor recommended successfully.",
            doctor: updatedDoctor
        });
    } catch (error) {
        console.error("Error recommending doctor:", error);
        res.status(500).json({ message: "Error recommending doctor", error: error.message });
    }
},

  
  
  
  


  getRecommendedDoctors: async (req, res) => {
    try {
      // Find all doctors that are recommended
      const recommendedDoctors = await Doctor.find({ isRecommended: true })
        .select('fullName images.profilePhoto medicalSpecialty')
        .lean(); // Add .lean() for performance if you don't need Mongoose documents
  
      res.status(200).json({
        message: "Recommended doctors retrieved successfully.",
        recommendedDoctors
      });
    } catch (error) {
      console.error("Error retrieving recommended doctors:", error);
      res.status(500).json({ message: "Error retrieving recommended doctors", error: error.message });
    }
  },



 // Controller function to update the sponsored status of a doctor
updateSponsoredStatus: async (req, res) => {
  try {
    const adminId = req.body.adminId; // Extract admin ID from the request body

    // Fetch the user from the database to check if they're an admin
    const user = await User.findById(adminId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found.'
      });
    }

    const isAdmin = user.isAdmin;

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied. Only admin can update sponsored status.',
      });
    }

    // Extract necessary information from the request
    const { doctorId, isOnlineStatus } = req.body;

    // Find the doctor by ID
    const foundDoctor = await Doctor.findById(doctorId);

    if (!foundDoctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }

    // Update the sponsored status
    foundDoctor.sponsored = isOnlineStatus;

    // Save the updated doctor
    const updatedDoctor = await foundDoctor.save();

    res.status(200).json({
      success: true,
      message: 'Sponsored status updated successfully',
      updatedDoctor,
    });
  } catch (error) {
    console.error('Error updating sponsored status:', error);
    res.status(500).json({ success: false, error: 'Error updating sponsored status' });
  }
},


setApprovalStatus: async (req, res) => {
  try {
    const adminId = req.params.adminId; // Assuming you're using authentication middleware that adds user info to req

    // Extract userId and approval status from the request body
    const { userId, isApproved } = req.body;

    const admin = await User.findById(adminId);
    if (!admin || !admin.isAdmin) {
        console.log("Unauthorized admin access");
        return res.status(403).json({
            success: false,
            message: "Unauthorized to perform this action",
        });
    }

    

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Update the isApproved status
    user.isApproved = isApproved;

    // Save the updated user
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User approval status updated successfully',
      user,
    });
  } catch (error) {
    console.error('Error updating approval status:', error);
    res.status(500).json({ success: false, error: 'Error updating approval status' });
  }
},

  

  
  
  
};

export default adminController;
