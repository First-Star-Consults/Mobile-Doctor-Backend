//Search controller
import { Doctor } from "../models/healthProviders.js";
import User from "../models/user.js";


const SearchControllers = {

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

  searchDoctorsBySpecialty: async (req, res) => {
    try {
      const { specialty } = req.query; 
  
     
      const doctorsBySpecialty = await Doctor.find({
        medicalSpecialty: { $elemMatch: { name: { $regex: new RegExp(specialty, 'i') } } },
        // kycVerification: true, 
      });
  
      if (!doctorsBySpecialty.length) {
        return res.status(404).json({
          success: false,
          message: `No verified doctors found for the specialty ${specialty}`,
        });
      }
  
      res.status(200).json({
        success: true,
        message: `Verified doctors for the specialty ${specialty} retrieved successfully`,
        doctorsBySpecialty,
      });
    } catch (error) {
      console.error(`Error retrieving doctors for the specialty ${specialty}:`, error);
      res.status(500).json({ success: false, error: `Error retrieving doctors for the specialty ${specialty}` });
    }
  },
};

export default SearchControllers;
