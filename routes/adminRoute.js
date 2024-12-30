// adminRoute.js
import express from 'express';
import adminController from '../controllers/adminController.js';
const router = express.Router();



router.post('/updateKycVerificationStatus/adminId', adminController.updateKycVerificationStatus);
router.post('/updateConsultationFees/:adminId', adminController.updateConsultationFees);
router.post('/setFeeForAllSpecialties/:adminId', adminController.setFeeForAllSpecialties);


// Endpoint to update the isOnline status of a doctor
router.post('/doctors/update-sponsored-status', adminController.updateSponsoredStatus);

// In your routes file
router.post('/recommend-doctor/:id', adminController.recommendDoctor);
router.get('/recommended', adminController.getRecommendedDoctors);

router.get('/statistics-cards', adminController.getStatisticsCards);

router.get('/patient-stats', adminController.getPatientStat);
router.get('/top-ailments', adminController.getTopAilments);
router.get('/approveRequest', adminController.approveRequest);
router.get('/approveRequestList', adminController.approveRequestsList);
router.get('/patients', adminController.GetPatients);
router.put('/set-approval-status/:adminId', adminController.setApprovalStatus);


// New routes for fetching pharmacies and laboratories
router.get('/pharmacies', adminController.getAllPharmacies); // Fetch all pharmacies
router.get('/laboratories', adminController.getAllLaboratories); // Fetch all laboratories

//get money inflow and user transaction
router.get('/:adminId/total-money-flow', adminController.getTotalMoneyFlow);
router.get('/:adminId/user-transactions', adminController.getUserTransactions);




export default router;