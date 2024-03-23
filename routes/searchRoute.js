// healthProviderRoute.js
import express from 'express';
import searchControllers from '../controllers/searchController.js';
const router = express.Router();

// Endpoint to get all user roles
router.get('/roles', searchControllers.getAllRoles);
// Endpoint to get appropriate information based on a specific role
router.get('/roles/:role', searchControllers.getAppropriateByRole);
//Endpoint to get only verified doctors
router.get('/verifiedDoctors', searchControllers.getVerifiedDoctors);
router.get('/doctors', searchControllers.searchDoctorsBySpecialty);





export default router;
