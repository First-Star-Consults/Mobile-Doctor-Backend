// healthProviderRoute.js
import express from 'express';
import healthProviderControllers from '../controllers/healthProviderController.js';
const providerRouter = express.Router();



providerRouter.post('/updateImage/:doctorId/:imageTitle', healthProviderControllers.updateImages);
providerRouter.post('/updateProfile/:userId', healthProviderControllers.updateProfile);



export default providerRouter;
