// userController.js
import User from "../models/user.js";
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { upload } from "../config/cloudinary.js";

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

  forgotPassword: async (req, res) => {
    const { email } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'No account with that email address exists.' });
      }
  
      // Generate a token
      const token = crypto.randomBytes(20).toString('hex');
  
      // Set token and expiry on user model
      user.resetPasswordToken = token;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  
      await user.save();
  
      // Prepare reset link
      const resetLink = `http://${req.headers.host}/reset-password/${token}`; // Make sure this URL matches your frontend route for resetting passwords
  
      // Use your sendVerificationEmail function
      await sendVerificationEmail(user.email, `Please click on the following link, or paste this into your browser to complete the process: ${resetLink}`);
  
      res.status(200).json({ message: 'An e-mail has been sent to ' + user.email + ' with further instructions.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Unexpected error during the forgot password process' });
    }
  },

  resetPasswordWithToken: async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
  
      if (!user) {
        return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
      }
  
      // Reset the password
      user.setPassword(newPassword, async (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Error resetting password' });
        }
  
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
  
        await user.save();
        res.status(200).json({ message: 'Password has been reset successfully' });
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Unexpected error during the password reset process' });
    }
  }
  

   
};

export default userController;
