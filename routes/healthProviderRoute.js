// healthProviderRoute.js
import express from 'express';
import healthProviderControllers from '../controllers/healthProviderController.js';
const providerRouter = express.Router();



providerRouter.post('/credentials/:providerId', healthProviderControllers.setCredentials);
// Route to add a review for a doctor
providerRouter.post('/:doctorId/reviews', healthProviderControllers.addReview);

// Route to get top-rated doctors
providerRouter.get('/top-rated-doctors', healthProviderControllers.getTopRatedDoctors);
providerRouter.get('/therapists', healthProviderControllers.getAllTherapists);
providerRouter.get('/pharmacies', healthProviderControllers.getAllPharmacies);
providerRouter.get('/laboratories', healthProviderControllers.getAllLaboratories);








export default providerRouter;
