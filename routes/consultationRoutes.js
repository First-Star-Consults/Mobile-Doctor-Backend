import express from 'express';
import consultationController from '../controllers/consultationController.js'; 
const router = express.Router();

// Route for creating a prescription
router.post('/prescriptions', consultationController.prescriptions );

// Route for linking a prescription to a consultation
router.patch('/consultations/:consultationId/prescriptions/:prescriptionId', consultationController.linkPrescription);

export default router;
