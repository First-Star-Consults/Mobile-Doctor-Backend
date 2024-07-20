// controllers/messageController.js
import Message from '../models/messageModel.js';
import Conversation from '../models/conversationModel.js';
import User from '../models/user.js';
import {Doctor, Pharmacy, Laboratory, Therapist} from '../models/healthProviders.js';
import { Prescription } from '../models/services.js';
import ConsultationSession from '../models/consultationModel.js';
import { io } from '../server.js'; 


// Custom function to populate participants from various collections
const populateParticipants = async (conversations) => {
  const models = { User, Doctor, Pharmacy, Therapist, Laboratory }; // Mapping of participant types to their models
  
  for (let conversation of conversations) {
    await Promise.all(conversation.participants.map(async (participant) => {
      const model = models[participant.participantType];
      if (model) {
        participant.info = await model.findById(participant.participantId)
          .select('fullName profilePhoto medicalSpecialty.name -_id') // Customize this select to your needs
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

          // Emit newMessage event to the conversation room
      io.to(conversationId).emit('newMessage', newMessage);
      
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
makePrescriptions: async (req, res) => {
  const { doctorId } = req.params; 
  const { userId, medicines, labTests, diagnosis } = req.body;

  

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
      medicines,
      labTests,
      diagnosis
    });
    
    res.status(201).json(prescription);
  } catch (error) {
    console.error('Failed to create prescription:', error);
    res.status(500).json({ message: error.message });
  }
},



sharePrescription: async (req, res) => {
  const { prescriptionId, providerId, providerType, deliveryOption } = req.body;
  const patientId = req.params.patientId;  

  try {
    const prescription = await Prescription.findById(prescriptionId);

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Add patient's address and delivery option to the prescription
    prescription.patientAddress = patient.address;
    prescription.deliveryOption = deliveryOption;
    await prescription.save();

    const sharedPrescription = {
      prescription: prescription._id,
      deliveryOption,
      patient: patientId,
      patientAddress: prescription.patientAddress, 
      diagnosis: prescription.diagnosis,
      deliveryOption: prescription.deliveryOption, 
      createdAt: prescription.createdAt
    };

    

    let ProviderModel;

    switch (providerType.toLowerCase()) {
      case 'doctor':
        ProviderModel = Doctor;
        break;
      case 'pharmacy':
        ProviderModel = Pharmacy;
        break;
      case 'therapist':
        ProviderModel = Therapist;
        break;
      case 'laboratory':
        ProviderModel = Laboratory;
        break;
      default:
        return res.status(400).json({ message: 'Invalid provider type' });
    }

    const provider = await ProviderModel.findById(providerId);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    provider.prescriptions.push(sharedPrescription);
    await provider.save();

    res.status(200).json({
      message: 'Prescription shared successfully',
      prescriptions: provider.prescriptions,
      patientAddress: prescription.patientAddress, // Add patientAddress in the response
      diagnosis: prescription.diagnosis,
      deliveryOption: prescription.deliveryOption, // Include deliveryOption in the response
      createdAt: prescription.createdAt
    });
  } catch (error) {
    console.error('Failed to share prescription:', error);
    res.status(500).json({ message: error.message });
  }
},


// for provider to get presction
getProviderPrescriptions: async (req, res) => {
  const providerId = req.params.providerId;
  const providerType = req.body.providerType;

  try {
    let ProviderModel;

    switch (providerType.toLowerCase()) {
      case 'doctor':
        ProviderModel = Doctor;
        break;
      case 'pharmacy':
        ProviderModel = Pharmacy;
        break;
      case 'therapist':
        ProviderModel = Therapist;
        break;
      case 'laboratory':
        ProviderModel = Laboratory;
        break;
      default:
        return res.status(400).json({ message: 'Invalid provider type' });
    }

    const provider = await ProviderModel.findById(providerId).populate('prescriptions.prescription');
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const prescriptionsWithDetails = provider.prescriptions.map(prescription => {
      return {
        ...prescription.prescription.toObject(),
        patientAddress: prescription.prescription.patientAddress,
        diagnosis: prescription.prescription.diagnosis,
        createdAt: prescription.prescription.createdAt
      };
    });

    res.status(200).json(prescriptionsWithDetails);
  } catch (error) {
    console.error('Failed to get prescriptions:', error);
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
        select: 'firstName lastName profilePhoto role _id'
      })
      .sort({ 'updatedAt': -1 })
      .limit(10);

    // Transform the data to include the most recent consultation session status
    const transformedChats = await Promise.all(recentChats.map(async chat => {
      const lastMessageContent = chat.lastMessage ? chat.lastMessage.content : '';
      const lastMessageTime = chat.lastMessage ? chat.lastMessage.timestamp : '';

      // Determine the other participant's ID
      const otherParticipantId = chat.participants[0]._id;

      // Find the most recent consultation session for these participants
      const mostRecentSession = await ConsultationSession.findOne({
        $or: [
          { patient: userId, doctor: otherParticipantId },
          { patient: otherParticipantId, doctor: userId }
        ]
      }).sort({ startTime: -1 }); // Get the latest session

      return {
        conversationId: chat._id,
        lastMessage: lastMessageContent,
        lastMessageTime: lastMessageTime,
        otherParticipant: chat.participants[0],
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
