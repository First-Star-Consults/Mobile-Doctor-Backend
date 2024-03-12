//user.js file
import mongoose from "mongoose";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";
import findOrCreate from 'mongoose-findorcreate';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import crypto from 'crypto';



export const generateSessionToken = () => {
  try {
    // Generate a random 32-character hexadecimal string
    const token = crypto.randomBytes(16).toString('hex');
    return token;
  } catch (error) {
    console.error('Error generating session token:', error);
    return null;
  }
};

// User schema (patient, doctor, therapist, etc.)
const userSchema = new mongoose.Schema({
  profilePhoto: { type: String, default: null },
  role:{ type: String, required: false },
  appropriate: { type: String, default: null },
  username: { type: String, required: true },
  password: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  email: { type: String, required: false },
  firstName: { type: String, required: false },
  lastName: { type: String, required: false },
  phone: { type: String, required: false },
  address: { type: String, default: null },
  state: { type: String, default: null },
  gender: { type: String, default: null },
  country: { type: String, default: null },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', default: null },
  pharmacy: { type: mongoose.Schema.Types.ObjectId, ref: 'Pharmacy', default: null },
  therapist: { type: mongoose.Schema.Types.ObjectId, ref: 'Therapist', default: null },
  laboratory: { type: mongoose.Schema.Types.ObjectId, ref: 'Laboratory', default: null },
  walletBalance: { type: Number, default: 0 },
  isAdmin: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  verificationcode: String,
  googleId: String,
});

// methods for password verification and password change
userSchema.methods.setPassword = function(oldPassword, newPassword, callback) {
  this.setPassword(oldPassword, newPassword, callback);
};

userSchema.methods.comparePassword = function(password, callback) {
  this.authenticate(password, callback);
};





userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);


passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id)
    .exec()
    .then(user => {
      done(null, user);
    })
    .catch(err => {
      done(err, null);
    });
});

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/api/auth/google/user",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
async (accessToken, refreshToken, profile, done) => {
  try {
    // Try to find the user based on their googleId
    let user = await User.findOne({ googleId: profile.id });

    // If the user doesn't exist, create a new user with the profile information
    if (!user) {
      user = new User({
        googleId: profile.id,
        email: profile._json.email, // Using directly from profile JSON
        username: profile._json.email, // Assuming username is the email
        firstName: profile._json.given_name,
        lastName: profile._json.family_name,
        role: 'patient', // default role
        isVerified: true, // default isVerified
        verificationcode: null, //default value
        profilePhoto: profile._json.picture // Optional: saving user's Google profile photo
      });

      await user.save();
    }
    
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

export default User






