// adminRoute.js
import express from 'express';
import adminController from '../controllers/adminController.js';
const router = express.Router();



router.post('/updateKycVerificationStatus', adminController.updateKycVerificationStatus);
router.post('/updateConsultationFees', adminController.updateConsultationFees);




export default router;