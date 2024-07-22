import express from 'express';
import prescriptionController from '../controllers/presscriptionController.js';

const router = express.Router();

// Route for creating a prescription
router.post('/createPrescription/:doctorId', prescriptionController.makePrescriptions );
router.post('/share-prescription/:patientId', prescriptionController.sharePrescription);


router.post('/status/:providerId', prescriptionController.updatePrescriptionStatus);
router.post('/costing/:providerId', prescriptionController.addCosting);
router.post('/approve-costing/:patientId', prescriptionController.approveCosting);
// Endpoint for providers to upload test results
router.post('/upload-result/:providerId', prescriptionController.uploadTestResult);
router.post('/prescription-status/:providerId', prescriptionController.updatePrescriptionStatus);

// Endpoint for patients to retrieve their test results
router.get('/test-results/:patientId', prescriptionController.getTestResults);

// Get costing details for patient to see before calling the approve-costing
router.get('/costing-details/:prescriptionId', prescriptionController.getCostingDetails);

// for prescription to be shared with health provider
router.get('/provider-prescriptions/:providerId', prescriptionController.getProviderPrescriptions);
// patient to get their prescription
router.get('/prescriptions/patient/:patientId', prescriptionController.getPatientPrescriptions);

export default router;
