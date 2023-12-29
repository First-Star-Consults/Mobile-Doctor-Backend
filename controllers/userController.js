// userController.js

import User from "../models/user.js";

const userController = {
  // Existing method to get the user profile
  getProfile: async (req, res) => {
    try {
      const userId = req.user._id;

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({ user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // New method to update the user profile with default null values
  updateProfile: async (req, res) => {
    try {
      const userId = req.user._id;

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            address: null,
            state: null,
            gender: null,
            country: null,
          },
        },
        { new: true } // To return the updated user
      );

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({ updatedUser });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
};

export default userController;
