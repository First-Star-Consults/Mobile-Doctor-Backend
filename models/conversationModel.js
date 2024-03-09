import mongoose from 'mongoose';

const { Schema } = mongoose;

const conversationSchema = new Schema({
  participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  lastMessage: { type: Schema.Types.ObjectId, ref: 'Message', default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
