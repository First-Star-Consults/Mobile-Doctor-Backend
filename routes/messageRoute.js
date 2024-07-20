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
router.get('/provider-prescriptions/:providerId', messageController.getProviderPrescriptions);



export default router;

