// userController.js
import User from "../models/user.js";
import upload from "../config/cloudinary.js";

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
      existingUser.country = req.body.country || existingUser.country;
      existingUser.state = req.body.state || existingUser.state;
      existingUser.address = req.body.address || existingUser.address;
      // Save the updated user profile
      await existingUser.save();

      if (!req.files || !req.files.image) {
        return res.status(400).json({ success: false, error: 'Please upload an image' });
      }

      const { image } = req.files;
      const fileTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      const imageSize = 1024;

      if (!fileTypes.includes(image.mimetype)) return res.send('Image formats supported: JPG, PNG, JPEG');

      if (image.size / 1024 > imageSize) return res.send(`Image size should be less than ${imageSize}kb`);

      // Upload image to Cloudinary
      const cloudFile = await upload(image.tempFilePath, userId); // Pass the user ID as the folderName

      // Update user model with the Cloudinary URL for the specific image type
      existingUser.profilePhoto = cloudFile.url; // Update the profilePicture field directly

      await existingUser.save(); // Save the user model again

      return res.status(200).json({ message: 'Profile information updated successfully', user: existingUser });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during profile update' });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const userId = req.params.userId;
      const { oldPassword, newPassword } = req.body;
  
      // Find the user by ID
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // passport-local-mongoose provides a method to change the password
      user.changePassword(oldPassword, newPassword, async (err) => {
        if (err) {
          // If oldPassword is incorrect, it will throw an error
          if (err.name === 'IncorrectPasswordError') {
            return res.status(400).json({ message: 'Old password is incorrect' });
          } else {
            console.error(err);
            return res.status(500).json({ message: 'Could not update password', err });
          }
        }
  
        // Save the updated user record with the new password
        await user.save();
        res.status(200).json({ message: 'Password updated successfully' });
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Unexpected error during password reset' });
    }
  },
  

   
};

export default userController;
