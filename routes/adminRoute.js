// adminRoute.js
import express from 'express';
import adminController from '../controllers/adminController.js';
const router = express.Router();



router.post('/updateKycVerificationStatus/adminId', adminController.updateKycVerificationStatus);
router.post('/updateConsultationFees/:userId', adminController.updateConsultationFees);
router.post('/setFeeForAllSpecialties/:userId', adminController.setFeeForAllSpecialties);
router.post('/set-approval/:adminId', adminController.setApprovalStatus);

// Endpoint to update the isOnline status of a doctor
router.post('/doctors/update-sponsored-status', adminController.updateSponsoredStatus);

// In your routes file
router.post('/recommend-doctor/:id', adminController.recommendDoctor);
router.get('/recommended', adminController.getRecommendedDoctors);




export default router;