// controllers/messageController.js
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
  const { patientId, medicines } = req.body;

  if (!patientId || !medicines || medicines.length === 0) {
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
      patient: patientId,
      medicines
    });
    
    res.status(201).json(prescription);
  } catch (error) {
    console.error('Failed to create prescription:', error);
    res.status(500).json({ message: error.message });
  }
}

};

export default messageController;
