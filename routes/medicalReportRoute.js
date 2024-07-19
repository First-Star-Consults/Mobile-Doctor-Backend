import express from 'express';
import { updateMedicalReport, getMedicalReport, uploadTestResult, getTestResult } from '../controllers/medicalReportsController.js';

const router = express.Router();

router.put('/create-medicalReport/:userId', updateMedicalReport);
router.get('/get-medicalReport/:userId', getMedicalReport);
router.post('/upload-test-result/:userId', uploadTestResult);
router.get('/test-result/:userId', getTestResult);

export default router;
