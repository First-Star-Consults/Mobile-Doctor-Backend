// routes/Message.Routes.js
import express from 'express';
import messageController from '../controllers/messageController.js'

const router = express.Router();


router.post('/send', messageController.sendMessage);
// Route for creating a prescription
router.post('/createPrescription/:doctorId', messageController.makePrescriptions );
router.post('/share-prescription/:patientId', messageController.sharePrescription);
router.get('/conversations/:userId', messageController.listConversations);
router.get('/:conversationId', messageController.getMessages);
router.get('/recent-chats/:userId', messageController.getRecentChats); 
// for prescription to be shared with health provider
router.get('/provider-prescriptions/:providerId', messageController.getProviderPrescriptions);
// patient to get their prescription
router.get('/prescriptions/patient/:patientId', messageController.getPatientPrescriptions);


export default router;

