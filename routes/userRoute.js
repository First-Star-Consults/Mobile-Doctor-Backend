import express from "express";
import userController from "../controllers/userController.js";


const router = express.Router();

// Welcome message
router.get("/", (req, res) => {
  res.json({ message: "Welcome to Mobile Doctor user route" });
});




//get users profile
router.get("/getUsers/role/:role", userController.getProfile);
// Update user profile route
router.put("/updateProfile/:userId",  userController.upDateprofile);

router.post("/reset-password/:userId", userController.resetPassword);
// In your routes file (e.g., userRouter.js)

router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password-with-token', userController.resetPasswordWithToken);





export default router;
