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
<<<<<<< HEAD
import configRoute from './routes/configRoute.js'
=======
>>>>>>> 74061c393c12cc1814545266738642829b628c83
import medicalReportRoute from './routes/medicalReportRoute.js'
import http from 'http'; 
import { Server as SocketIOServer } from 'socket.io'; 

const app = express();
const server = http.createServer(app); // Wrap the express app with http server
const io = new SocketIOServer(server, { // Initialize Socket.IO server
  cors: {
    origin: "*", // Or specify your client's URL
    methods: ["GET", "POST"]
  }
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
<<<<<<< HEAD
app.use("/api/config", configRoute)
=======
>>>>>>> 74061c393c12cc1814545266738642829b628c83


app.get("/api", (req, res) => {
    res.json({ message: "Welcome to /api" });
});

app.get("/", (req, res) => {
    res.json({ message: "Welcome to mobile doctor" });
});


// Socket.IO logic
io.on('connection', (socket) => {
  console.log('A user connected', socket.id);

  // Join a conversation room
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  // Listen for typing started
  socket.on('typingStarted', (roomId) => {
    socket.to(roomId).emit('typing', { userId: socket.id, typing: true });
    console.log(`User ${socket.id} is typing in room ${roomId}`);
  });

  // Listen for typing stopped
  socket.on('typingStopped', (roomId) => {
    socket.to(roomId).emit('typing', { userId: socket.id, typing: false });
    console.log(`User ${socket.id} stopped typing in room ${roomId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected', socket.id);
  });
});

app.use('/api/messages', messageRoute);


server.listen(process.env.PORT || 3000, () => {
    console.log("Server is running on port 3000");
});


//Set-ExecutionPolicy Bypass -Scope Process

export { io };