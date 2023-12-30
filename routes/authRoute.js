import passport from "passport";
import express from "express";
import authController from "../controllers/authController.js";
import userController from "../controllers/userController.js";


const router = express.Router();

// Welcome message
router.get("/", (req, res) => {
  res.json({ message: "Welcome to Mobile Doctor" });
});

// Google authentication
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

router.get(
  "/auth/google/user",
  passport.authenticate("google", { failureRedirect: "/" }),
  function (req, res) {
    // Successful authentication.
    res.status(200).json({ message: "Successfully logged in with Google Auth" });
  }
);

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
