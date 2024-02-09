// healthProviderRoute.js
import express from 'express';
import healthProviderControllers from '../controllers/healthProviderController.js';
const providerRouter = express.Router();


providerRouter.get('/verifiedDoctors', healthProviderControllers.getVerifiedDoctors);
providerRouter.post('/credentials/:providerId', healthProviderControllers.setCredentials);
providerRouter.get('/doctors/online', healthProviderControllers.getOnlineDoctors)





export default providerRouter;
