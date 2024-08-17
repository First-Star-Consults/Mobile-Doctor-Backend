// utils/sendSystemMessage.js
import Message from "../models/messageModel.js";
import { io } from '../server.js'; 

export function sendSystemMessage(conversationId, sender, receiver, content) {
    Message.create({
        conversationId,
        sender,
        receiver,
        content,
    }).then(newMessage => {
        // Emit the message to the conversation room using io
        io.to(conversationId).emit('newMessage', newMessage);

        // Update the last message in the conversation
        return Conversation.findByIdAndUpdate(conversationId, {
            $set: { lastMessage: newMessage._id },
            $currentDate: { updatedAt: true }
        });
    }).catch(error => {
        console.error('Error sending system message:', error);
    });
}


