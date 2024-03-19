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

  
  
  
};

export default adminController;
