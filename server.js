import 'dotenv/config';
import express from "express";
import session from 'express-session';
import passport from 'passport';
import bodyParser from "body-parser";
import fileUpload from "express-fileupload";
import cors from 'cors';
import { connect } from "./config/connectionState.js";
import authRoute from "./routes/authRoute.js";
import userRouter from './routes/userRoute.js';
import providerRouter from './routes/healthProviderRoute.js';
import searchRouter from './routes/searchRoute.js';
import adminRouter from './routes/adminRoute.js';
import messageRoute from './routes/messageRoute.js';
import configRoute from './routes/configRoute.js';
import medicalReportRoute from './routes/medicalReportRoute.js';
import prescriptionRoute from './routes/prescriptionRoute.js';
import notificationRoute from './routes/notificationRoute.js';
import http from 'http'; 
import { Server } from 'socket.io';
import { setupTransactionStatusChecker } from './utils/transactionStatusChecker.js';
const app = express();



const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(
    fileUpload({
      useTempFiles: true
    })
);

connect();

app.use("/api/auth", authRoute);
app.use("/api/user", userRouter);
app.use("/api/provider", providerRouter);
app.use("/api/search", searchRouter);
app.use("/api/admin", adminRouter);
app.use("/api/medical-report", medicalReportRoute);
app.use("/api/prescription", prescriptionRoute)
app.use("/api/config", configRoute)
app.use('/api/messages', messageRoute);
app.use('/api/notification', notificationRoute)



app.get("/api", (req, res) => {
    res.json({ message: "Welcome to /api" });
});

app.get("/", (req, res) => {
    res.json({ message: "Welcome to mobile doctor" });
});







// Listen for new connections
// Socket.IO logic
io.on('connection', (socket) => {
  console.log('A user connected');

  // Join a conversation room
  socket.on('joinRoom', (conversationId) => {
    socket.join(conversationId);
    console.log(`User ${socket.id} joined room ${conversationId}`);
  });

  // Leave a conversation room
  socket.on('leaveRoom', (conversationId) => {
    socket.leave(conversationId);
    console.log(`User ${socket.id} left room ${conversationId}`);
  });

  // Handle sending messages
  socket.on('sendMessage', async (message) => {
    try {
      const { conversationId, sender, receiver, content } = message;

      const activeSession = await ConsultationSession.findOne({
        $or: [{ doctor: sender, patient: receiver }, { doctor: receiver, patient: sender }],
        status: { $in: ['scheduled', 'in-progress'] }
      });

      if (!activeSession) {
        return socket.emit('messageError', { message: 'No active consultation session found between the users.' });
      }

      const newMessage = await Message.create({
        conversationId,
        sender,
        receiver,
        content
      });

      io.to(conversationId).emit('newMessage', newMessage);

      await Conversation.findByIdAndUpdate(conversationId, {
        $set: { lastMessage: newMessage._id },
        $currentDate: { updatedAt: true }
      });

      socket.emit('messageSent', newMessage);
    } catch (error) {
      socket.emit('messageError', { error: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

export { io };
server.listen(process.env.PORT || 3000, () => {
  console.log(`Server is listening on port ${process.env.PORT || 3000}`);
  
  // Start the transaction status checker to run every 30 minutes
  setupTransactionStatusChecker(30);
  console.log('Transaction status checker initialized');
});