import express from "express";
import userController from "../controllers/userController.js";


const router = express.Router();

// Welcome message
router.get("/", (req, res) => {
  res.json({ message: "Welcome to Mobile Doctor user route" });
});




//get users profile
router.get("/profile/:userId", userController.getProfile);
//get online users
router.get('/online-users/:role', userController.getOnlineUsers)
// Route to find nearby health providers
router.get('/find-nearby/:userId', userController.findNearby);
// Update user profile route
router.put("/updateProfile/:userId",  userController.upDateprofile);

router.post("/reset-password/:userId", userController.resetPassword);
//update Online Status
router.post('/updateOnlineStatus/:userId', userController.updateOnlineStatus)

router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPasswordWithToken);





export default router;
