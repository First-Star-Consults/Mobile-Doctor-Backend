//admin controller

import { Doctor } from "../models/healthProviders.js";

const adminController = {
  

  updateKycVerificationStatus: async (req, res) => {
    try {
      // Check if the user making the request is an admin
      const isAdmin = req.user.isAdmin; // Assuming you have a middleware that sets req.user

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
      // Check if the user making the request is an admin
      const isAdmin = req.user.isAdmin; 
  
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
  
};

export default adminController;
