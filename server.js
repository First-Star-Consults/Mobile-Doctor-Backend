import 'dotenv/config.js';
import express from "express";
import session from 'express-session';
import passport from 'passport';
import bodyParser from "body-parser";
import cors from 'cors';
import { connect } from "./config/connectionState.js";
import authRoute from "./routes/authRoute.js"
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

connect();


app.use("/", authRoute);








app.listen(process.env.PORT || 3000, () => {
    console.log("Server is running on port 3000");
})

