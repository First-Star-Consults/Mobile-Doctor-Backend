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
import configRoute from './routes/configRoute.js'
import medicalReportRoute from './routes/medicalReportRoute.js'
import prescriptionRoute from './routes/prescriptionRoute.js'
import http from 'http'; 
// import { Server as SocketIOServer } from 'socket.io';
import { Server } from 'socket.io';

const app = express();
// const server = http.createServer(app); 
// const io = new SocketIOServer(server, { 
//   cors: {
//     origin: "*", 
//     methods: ["GET", "POST"]
//   }
// });

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


app.get("/api", (req, res) => {
    res.json({ message: "Welcome to /api" });
});

app.get("/", (req, res) => {
    res.json({ message: "Welcome to mobile doctor" });
});


// Socket.IO logic
// io.on('connection', (socket) => {
//   console.log('A user connected', socket.id);

//   // Join a conversation room
//   socket.on('joinRoom', (roomId) => {
//     socket.join(roomId);
//     console.log(`User ${socket.id} joined room ${roomId}`);
//   });

//   // Listen for typing started
//   socket.on('typingStarted', (roomId) => {
//     socket.to(roomId).emit('typing', { userId: socket.id, typing: true });
//     console.log(`User ${socket.id} is typing in room ${roomId}`);
//   });

//   // Listen for typing stopped
//   socket.on('typingStopped', (roomId) => {
//     socket.to(roomId).emit('typing', { userId: socket.id, typing: false });
//     console.log(`User ${socket.id} stopped typing in room ${roomId}`);
//   });

//   socket.on('disconnect', () => {
//     console.log('User disconnected', socket.id);
//   });
// });




// Listen for new connections
io.on('connection', (socket) => {
  console.log('a user connected');

  // Listen for a join room event
  socket.on('joinRoom', (conversationId) => {
    socket.join(conversationId);
    console.log(`User joined room: ${conversationId}`);
  });

  // Listen for a leave room event
  socket.on('leaveRoom', (conversationId) => {
    socket.leave(conversationId);
    console.log(`User left room: ${conversationId}`);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

export { io };
server.listen(process.env.PORT || 3000, () => {
  console.log('listening on *:3000');
});