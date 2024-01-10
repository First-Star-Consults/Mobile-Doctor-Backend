// userController.js

import User from "../models/user.js";

const userController = {
 
    // To get user profile
    getProfile: async (req, res) => {
      try {
        const userId = req.params.userId
  
        // Check if the user exists
        const existingUser = await User.findById(userId);
  
        if (!existingUser) {
          return res.status(404).json({ message: 'User not found' });
        }
  
        // Extract relevant profile information
        const userProfile = {
          profilePhoto: existingUser.profilePicture,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
          role: existingUser.role,
          subRole: existingUser.subRole,
          phone: existingUser.phone,
          email: existingUser.email,
          gender: existingUser.gender,
          age: existingUser.age,
          rating: existingUser.rating,
          country: existingUser.country,
          state: existingUser.state,
          emailVerification: existingUser.isVerified
        };
  
        return res.status(200).json({ message: 'User profile retrieved successfully', user: userProfile });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Unexpected error during profile retrieval' });
      }
    },
  
  
      //To update user profile
      upDateprofile: async (req, res) => {
          try {
            const userId = req.params.userId;
      
            // Check if the user exists
            const existingUser = await User.findById(userId);
      
            if (!existingUser) {
              return res.status(404).json({ message: 'User not found' });
            }
      
            // Update user profile information
            existingUser.firstName = req.body.firstName || existingUser.firstName;
            existingUser.lastName = req.body.lastName || existingUser.lastName;
            existingUser.phone = req.body.phone || existingUser.phone;
            existingUser.gender = req.body.gender || existingUser.gender;
            // Save the updated user profile
            await existingUser.save();
      
            return res.status(200).json({ message: 'Profile information updated successfully', user: existingUser });
          } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Unexpected error during profile update' });
          }
        },
};

export default userController;
