// controllers/messageController.js
import moment from 'moment';
import Message from '../models/messageModel.js';
import Conversation from '../models/conversationModel.js';
import {Doctor} from '../models/healthProviders.js';
import { Prescription } from '../models/services.js';
import ConsultationSession from '../models/consultationModel.js';

const messageController = {
   

      sendMessage: async (req, res) => {
        try {
          const { conversationId, sender, receiver, content } = req.body;
      
          // Find an active consultation session between the sender and receiver
          const activeSession = await ConsultationSession.findOne({
            $or: [{ doctor: sender, patient: receiver }, { doctor: receiver, patient: sender }],
            status: { $in: ['scheduled', 'in-progress'] }
          });
      
          if (!activeSession) {
            return res.status(403).json({ message: 'No active consultation session found between the users.' });
          }
      
          // Proceed with creating the message if an active session is found
          const newMessage = await Message.create({
            conversationId,
            sender,
            receiver,
            content
          });
      
          // Update the conversation's lastMessage field
          await Conversation.findByIdAndUpdate(conversationId, {
            $set: { lastMessage: newMessage._id },
            $currentDate: { updatedAt: true } // Update the updatedAt field to current date
          });
      
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
    const userId = req.params.userId; // Assuming you're passing the user's ID as a parameter
    
    try {
        const conversations = await Conversation.find({
            participants: userId
        })
        .populate('lastMessage') // Only if you have a lastMessage field
        .populate('participants', 'name') // Adjust to populate only necessary fields
        .sort('-updatedAt'); // Sort by most recently updated
        
        return res.status(200).json(conversations);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
},

// Method for creating a prescription and saving it to the database
prescriptions: async (req, res) => {
  const { doctorId } = req.params; // Assuming doctorId is passed as URL parameter
  const { userId, medicines } = req.body;

  if (!userId || !medicines || medicines.length === 0) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Fetch the doctor's details from the database
    const doctor = await Doctor.findById(doctorId);

    // Check if the doctor exists and if their KYC verification is true
    if (!doctor || doctor.kycVerification !== true) {
      return res.status(403).json({ message: 'Doctor not verified or does not exist.' });
    }

    // Proceed with creating the prescription
    const prescription = await Prescription.create({
      doctor: doctorId,
      patient: userId,
      medicines
    });
    
    res.status(201).json(prescription);
  } catch (error) {
    console.error('Failed to create prescription:', error);
    res.status(500).json({ message: error.message });
  }
},


// Endpoint to retrieve recent chats for a user (either patient or doctor)
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
        select: 'firstName lastName profilePhoto role -_id'
      })
      .sort({ 'updatedAt': -1 })
      .limit(10);

    // Transform the data into a more friendly structure
    const transformedChats = [];

    for (const chat of recentChats) {
      const lastMessageContent = chat.lastMessage ? chat.lastMessage.content : '';
      const lastMessageTime = chat.lastMessage ? moment(chat.lastMessage.timestamp).format('h:mm') : '';
      
      let sessionId = null;
      
      // Find the active session for each chat
      if (chat.participants.length > 0) {
        const otherParticipantId = chat.participants[0]._id;
        const activeSession = await ConsultationSession.findOne({
          $or: [{ doctor: userId, patient: otherParticipantId }, { doctor: otherParticipantId, patient: userId }],
          status: { $in: ['scheduled', 'in-progress'] }
        }).sort({ createdAt: -1 });

        sessionId = activeSession ? activeSession._id : null;
      }
      
      transformedChats.push({
        sessionId,
        conversationId: chat._id,
        lastMessage: lastMessageContent,
        lastMessageTime: lastMessageTime,
        otherParticipant: chat.participants[0] // Assuming there's always one other participant
      });
    }

    res.status(200).json({ success: true, recentChats: transformedChats });
  } catch (error) {
    console.error('Error retrieving recent chats:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.toString() });
  }
},








};

export default messageController;
