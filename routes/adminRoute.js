// adminRoute.js
import express from 'express';
import adminController from '../controllers/adminController.js';
const adminRouter = express.Router();



adminRouter.post('/updateKycVerificationStatus', adminController.updateKycVerificationStatus);



export default adminRouter;