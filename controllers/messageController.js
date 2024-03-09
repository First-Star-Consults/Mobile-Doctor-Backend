// controllers/messageController.js
import Message from '../models/messageModel.js';
// import Conversation from '../models/Conversation.js';

const messageController = {
    findOrCreateConversation: async (req, res) => {
        const { user1Id, user2Id } = req.body; // IDs of the users attempting to chat
      
        try {
          let conversation = await Conversation.findOne({
            participants: { $all: [user1Id, user2Id] }
          });
      
          if (!conversation) {
            // If no conversation exists, create a new one
            conversation = await Conversation.create({
              participants: [user1Id, user2Id]
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
      const message = await Message.create({
        conversationId,
        sender,
        receiver,
        content
      });
      return res.status(201).json(message);
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
  }
};

export default messageController;
