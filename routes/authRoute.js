import express from "express";
import authController from "../controllers/authController.js";
import userController from "../controllers/userController.js";

const router = express.Router();

// Welcome message
router.get("/", (req, res) => {
  res.json({ message: "Welcome to Mobile Doctor" });
});

// Logout route
router.get("/auth/logout", authController.logout);

//get users profile
router.get("/user/profile", userController.getProfile);
// Update user profile route
router.put("/user/update-profile",  userController.updateProfile);

// Registration and login routes
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.post("/auth/verify", authController.verify);

export default router;
