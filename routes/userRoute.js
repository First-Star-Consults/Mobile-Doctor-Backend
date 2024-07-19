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
router.post('/update-location', userController.updateLocation);
//for doctor to use and get nearby HealthProvider
router.get('/find-nearby-providers/:userId', userController.getNearbyProvider )
// get notification
router.get('/get-notifications/:userId', userController.getNotifications);
//update user location
router.post('/map/patient/update-location', userController.updateLocation)
// Update user profile route

router.put("/updateProfile/:userId",  userController.upDateprofile);
// reset password and reset pasword with token
router.post("/reset-password/:userId", userController.resetPassword);
router.post("/resetWithToken", userController.resetPasswordWithToken);
//update Online Status
router.post('/updateOnlineStatus/:userId', userController.updateOnlineStatus)

router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPasswordWithToken);





export default router;
