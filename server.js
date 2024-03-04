import 'dotenv/config.js';
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
import adminRouter from './routes/adminRoute.js';
const app = express();




// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
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

app.get("/", (req, res)=>{
    res.json({ message: "Welcome to the root route of mobile doctor" });
})
app.use("/auth", authRoute);
app.use("/user", userRouter);
app.use("/provider", providerRouter)
app.use('/admin', adminRouter)








app.listen(process.env.PORT || 3000, () => {
    console.log("Server is running on port 3000");
})

