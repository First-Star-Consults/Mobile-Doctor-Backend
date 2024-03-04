import express from "express";
import userController from "../controllers/userController.js";


const userRouter = express.Router();

// Welcome message
userRouter.get("/", (req, res) => {
  res.json({ message: "Welcome to Mobile Doctor user route" });
});


// Endpoint to get all user roles
userRouter.get('/roles', userController.getAllRoles);
// Endpoint to get appropriate information based on a specific role
userRouter.get('/roles/:role/appropriate', userController.getAppropriateByRole);
//get users profile
userRouter.get("/getProfile/:userId", userController.getProfile);
// Update user profile route
userRouter.put("/updateProfile/:userId",  userController.upDateprofile);




export default userRouter;
