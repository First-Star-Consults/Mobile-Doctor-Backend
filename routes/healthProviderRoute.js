// healthProviderRoute.js
import express from 'express';
import healthProviderControllers from '../controllers/healthProviderController.js';
const router = express.Router();



router.post('/credentialsDetails/:providerId', healthProviderControllers.setCredentials);
// router.post('/uploadCredentialsImages/:providerId', healthProviderControllers.uploadCredentialsImages);

//Route to set other credential details other than doctors
router.post('/otherProvidersCredentials/:providerId', healthProviderControllers.setOtherCredentials);

// Route to add a review for a doctor
router.post('/:doctorId/reviews', healthProviderControllers.addReview);

//recommend a health provider to a patient
router.post('/recommend/:doctorId', healthProviderControllers.recommendHealthProvider);
//patient to get health provider recommedation
router.get('/recommendations/:patientId', healthProviderControllers.getRecommendedProviders);

// Route to update the isOnline status of a doctor
router.put('/:doctorId/update-isOnline', healthProviderControllers.updateIsOnlineStatus);

// Route to get online and sponsored doctors
router.get('/online-sponsored-doctors', healthProviderControllers.getOnlineSponsoredDoctors);


router.get('/:doctorId/reviews', healthProviderControllers.getDoctorReviews);

// Route to check the online status of a health provider
router.get('/:providerId/isOnline', healthProviderControllers.checkOnlineStatus);


// Route to get top-rated doctors
router.get('/top-rated-doctors', healthProviderControllers.getTopRatedDoctors);
router.get('/therapists', healthProviderControllers.getAllTherapists);
router.get('/pharmacies', healthProviderControllers.getAllPharmacies);
router.get('/laboratories', healthProviderControllers.getAllLaboratories);
router.get('/all-doctors', healthProviderControllers.getAllDoctors);












export default router;
