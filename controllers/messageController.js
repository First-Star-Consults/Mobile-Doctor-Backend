// controllers/messageController.js
import Message from '../models/messageModel.js';
import Conversation from '../models/conversationModel.js';

const messageController = {
    findOrCreateConversation: async (req, res) => {
        const { patientId, providersId } = req.body; // IDs of the users attempting to chat
      
        try {
          let conversation = await Conversation.findOne({
            participants: { $all: [patientId, providersId] }
          });
      
          if (!conversation) {
            // If no conversation exists, create a new one
            conversation = await Conversation.create({
              participants: [patientId, providersId]
            });
          }
      
          return res.status(200).json(conversation);
        } catch (error) {
          return res.status(500).json({ error: error.message });
        }
      },
      

      sendMessage: async (req, res) => {
        try {
            const { conversationId, sender, receiver, content } = req.body;
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
}

};

export default messageController;
