//authRoute.js

import passport from "passport";
import express from "express";
import authController from "../controllers/authController.js";




const router = express.Router();

// Welcome message
router.get("/", (req, res) => {
  res.json({ message: "Welcome to Mobile Doctor authentication" });
});

// Google authentication
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }) 
);


router.get(
  "/google/user",
  passport.authenticate("google", { failureRedirect: "/" }),
  function (req, res) {
    // Successful authentication.
    res.status(200).json({ message: "Successfully logged in with Google Auth", user: {
      profilePhoto: req.user.profilePhoto,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      isVerified: {status: req.user.isVerified, message: "Alabo, this one na for email verification o"}
    }, });
  }
);

// Logout route
router.get("/logout", authController.logout);


// Registration and login routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/verify", authController.verify);

router.post('/fund-wallet/:userId', authController.fundWallet);
router.post('/paystack/webhook', express.json(), authController.handlePaystackWebhook);




export default router;
