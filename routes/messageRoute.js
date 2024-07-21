// routes/Message.Routes.js
import express from 'express';
import messageController from '../controllers/messageController.js'

const router = express.Router();


router.post('/send', messageController.sendMessage);

router.get('/conversations/:userId', messageController.listConversations);
router.get('/:conversationId', messageController.getMessages);
router.get('/recent-chats/:userId', messageController.getRecentChats);




export default router;

