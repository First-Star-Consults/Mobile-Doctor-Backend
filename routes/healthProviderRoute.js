// healthProviderRoute.js
import express from 'express';
import healthProviderControllers from '../controllers/healthProviderController.js';
const router = express.Router();



router.post('/credentialsDetails/:providerId', healthProviderControllers.setCredentials);
// router.post('/uploadCredentialsImages/:providerId', healthProviderControllers.uploadCredentialsImages);
// Route to add a review for a doctor
router.post('/:doctorId/reviews', healthProviderControllers.addReview);


router.get('/:doctorId/reviews', healthProviderControllers.getDoctorReviews);


// Route to get top-rated doctors
router.get('/top-rated-doctors', healthProviderControllers.getTopRatedDoctors);
router.get('/therapists', healthProviderControllers.getAllTherapists);
router.get('/pharmacies', healthProviderControllers.getAllPharmacies);
router.get('/laboratories', healthProviderControllers.getAllLaboratories);
router.get('/all-doctors', healthProviderControllers.getAllDoctors);









export default router;
