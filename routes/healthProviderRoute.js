// healthProviderRoute.js
import express from 'express';
import healthProviderControllers from '../controllers/healthProviderController.js';
const providerRouter = express.Router();



providerRouter.post('/credentials/:providerId', healthProviderControllers.setCredentials);






export default providerRouter;
