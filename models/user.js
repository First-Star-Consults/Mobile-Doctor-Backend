import mongoose from "mongoose";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";
import findOrCreate from 'mongoose-findorcreate';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';




// User schema (patient, doctor, therapist, etc.)
const userSchema = new mongoose.Schema({
  profilePhoto: { type: String, default: null },
  role:{ type: String, required: true },
  appropriate: { type: String, default: null },
  username: { type: String, required: true },
  password: String,
  email: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, required: true },
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
  kycVerification: { type: Boolean, default: false },
  verificationcode: String,
  googleId: String,
});



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
  callbackURL: "http://localhost:3000/auth/google/user",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
  function (accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

export default User






