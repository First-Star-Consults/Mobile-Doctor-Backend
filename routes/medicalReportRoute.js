import express from 'express';
import { createMedicalReport, getMedicalReport, uploadTestResult, getTestResult } from '../controllers/medicalReportsController.js';

const router = express.Router();

router.post('/create-medicalReport/:userId', createMedicalReport);
router.get('/get-medicalReport/:userId', getMedicalReport);
router.post('/upload-test-result/:userId', uploadTestResult);
router.get('/test-result/:userId', getTestResult);

export default router;
