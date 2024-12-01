// controllers/messageController.js
import Message from '../models/messageModel.js';
import Conversation from '../models/conversationModel.js';
import User from '../models/user.js';
import {Doctor, Pharmacy, Laboratory, Therapist} from '../models/healthProviders.js';
import ConsultationSession from '../models/consultationModel.js';
import { io } from '../server.js'; 
import { upload } from '../config/cloudinary.js'; // Cloudinary upload function
import { sendNotificationEmail } from "../utils/nodeMailer.js";


// Custom function to populate participants from various collections
const populateParticipants = async (conversations) => {
  const models = { User, Doctor, Pharmacy, Therapist, Laboratory };

  for (let conversation of conversations) {
    await Promise.all(conversation.participants.map(async (participant) => {
      const model = models[participant.participantType];
      if (model) {
        participant.info = await model.findById(participant.participantId)
          .select('fullName profilePhoto medicalSpecialty.name -_id')
          .lean();
      }
    }));
  }

  return conversations;
};

const messageController = {

  sendMessage: async (req, res) => {
    try {
      const { conversationId, sender, receiver, content } = req.body;
      let fileUrl = null;

      // Check if a file is attached
      if (req.files && req.files.attachment) {
        const file = req.files.attachment;
        const uploadResult = await upload(file.tempFilePath, `messages/${conversationId}`);
        fileUrl = uploadResult.secure_url;
      }

      const activeSession = await ConsultationSession.findOne({
        $or: [{ doctor: sender, patient: receiver }, { doctor: receiver, patient: sender }],
        status: { $in: ['scheduled', 'in-progress'] }
      });

      if (!activeSession) {
        return res.status(403).json({ message: 'No active consultation session found between the users.' });
      }

      const newMessage = await Message.create({
        conversationId,
        sender,
        receiver,
        content,
        fileUrl 
      });

      io.to(conversationId).emit('newMessage', newMessage);

      await Conversation.findByIdAndUpdate(conversationId, {
        $set: { lastMessage: newMessage._id },
        $currentDate: { updatedAt: true }
      });

     // Fetch the sender's firstName from the User model
     const senderUser = await User.findById(sender);
     if (!senderUser) {
       return res.status(404).json({ message: 'Sender not found.' });
     }

     // Fetch the receiver's email from the User model
     const receiverUser = await User.findById(receiver);
     if (!receiverUser) {
       return res.status(404).json({ message: 'Receiver not found.' });
     }

     // Prepare email content
     const message = `Hello,\n\nYou have received a new message from ${senderUser.firstName}. Here is the content of the message:\n\n"${newMessage.content}"\n\nPlease log into the app to chat with ${senderUser.firstName} ,\nYour Healthcare Team`;

     console.log("Sending email to:", receiverUser.email);
     await sendNotificationEmail(receiverUser.email, 'New Message Received', message);
     console.log("Email sent successfully to:", receiverUser.email);

      return res.status(201).json(newMessage);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  getMessages: async (req, res) => {
    try {
      const { conversationId } = req.params;
      const messages = await Message.find({ conversationId }).sort('timestamp');
      return res.status(200).json(messages);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  listConversations: async (req, res) => {
    const userId = req.params.userId;

    try {
      const conversations = await Conversation.find({
        participants: userId
      })
        .populate('lastMessage')
        .populate('participants', 'name')
        .sort('-updatedAt');

      return res.status(200).json(conversations);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },


  getRecentChats: async (req, res) => {
    const { userId } = req.params;

    try {
        const recentChats = await Conversation.find({ participants: userId })
            .populate({
                path: 'lastMessage',
                select: 'content timestamp -_id',
                options: { sort: { 'timestamp': -1 } }
            })
            .populate({
                path: 'participants',
                match: { _id: { $ne: userId } },
                select: 'firstName lastName profilePhoto role _id isOnline'
            })
            .sort({ 'updatedAt': -1 })
            .limit(10);

        const transformedChats = await Promise.all(recentChats.map(async (chat) => {
            const lastMessageContent = chat.lastMessage ? chat.lastMessage.content : '';
            const lastMessageTime = chat.lastMessage ? chat.lastMessage.timestamp : '';

            const otherParticipant = chat.participants[0];

            const mostRecentSession = await ConsultationSession.findOne({
                $or: [
                    { patient: userId, doctor: otherParticipant._id },
                    { patient: otherParticipant._id, doctor: userId }
                ]
            }).sort({ startTime: -1 });

            return {
                conversationId: chat._id,
                lastMessage: lastMessageContent,
                lastMessageTime: lastMessageTime,
                otherParticipant: {
                    _id: otherParticipant._id,
                    firstName: otherParticipant.firstName,
                    lastName: otherParticipant.lastName,
                    profilePhoto: otherParticipant.profilePhoto,
                    role: otherParticipant.role,
                    isOnline: otherParticipant.isOnline // Include isOnline status
                },
                sessionStatus: mostRecentSession ? mostRecentSession.status : 'No session'
            };
        }));

        res.status(200).json({ success: true, recentChats: transformedChats });
    } catch (error) {
        console.error('Error retrieving recent chats:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.toString() });
    }
},


  







};

export default messageController;
