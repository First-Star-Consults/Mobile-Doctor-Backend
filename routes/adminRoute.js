// adminRoute.js
import express from 'express';
import adminController from '../controllers/adminController.js';
const router = express.Router();



router.post('/updateKycVerificationStatus/adminId', adminController.updateKycVerificationStatus);
router.post('/updateConsultationFees/:userId', adminController.updateConsultationFees);
router.post('/setFeeForAllSpecialties/:userId', adminController.setFeeForAllSpecialties);




export default router;