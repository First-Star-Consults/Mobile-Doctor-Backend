//Search controller
import { Doctor } from "../models/healthProviders.js";
import User from "../models/user.js";


const healthProviderControllers = {

  getVerifiedDoctors: async (req, res) => {
    try {
      // Find all doctors with kycVerification set to true
      const verifiedDoctors = await Doctor.find({ kycVerification: true });

      if (verifiedDoctors.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No verified doctors found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Verified doctors retrieved successfully',
        verifiedDoctors,
      });
    } catch (error) {
      console.error('Error retrieving verified doctors:', error);
      res.status(500).json({ success: false, error: 'Error retrieving verified doctors' });
    }
  },


  getOnlineDoctors: async (req, res) => {
    try {
        // Find all doctors with kycVerification set to true, onlineStatus set to true, and a valid sessionToken
        const onlineDoctors = await Doctor.find({
            kycVerification: true,
            onlineStatus: true,
            sessionToken: { $ne: null }, // Ensure sessionToken is not null
            fullName: { $ne: null }, // Ensure fullName is not null
        });

        if (onlineDoctors.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No online and logged-in doctors found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Online and logged-in doctors retrieved successfully',
            onlineDoctors,
        });
    } catch (error) {
        console.error('Error retrieving online and logged-in doctors:', error);
        res.status(500).json({ success: false, error: 'Error retrieving online and logged-in doctors' });
    }
},


 // Endpoint to get all users with their roles
 getAllRoles: async (req, res) => {
    try {
      const users = await User.find({}, 'firstName lastName role');
      return res.status(200).json({ users });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Endpoint to get appropriate information based on a specific role
  getAppropriateByRole: async (req, res) => {
    try {
      const role = req.params.role;
      const users = await User.find({ role }, 'appropriate firstName lastName');
      return res.status(200).json({ users });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
};

export default healthProviderControllers;
