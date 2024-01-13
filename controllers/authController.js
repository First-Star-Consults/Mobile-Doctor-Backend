//authcontroller
import passport from "passport";
import User from "../models/user.js";
import { Doctor, Therapist, Pharmacy, Laboratory } from "../models/healthProviders.js"
import determineRole from "../utils/determinUserRole.js";
import { sendVerificationEmail } from "../utils/nodeMailer.js";
import { generateVerificationCode } from "../utils/verficationCodeGenerator.js";


const verificationcode = generateVerificationCode()


const authController = {
  register: async (req, res) => {
    try {
      const { userType, email, password, phone, firstName, lastName } = req.body;

      const role = determineRole(userType);
      

      // Create a new user instance
      const newUser = new User({
        username: email,
        email,
        firstName,
        lastName,
        role: role,
        phone,
        verificationcode,
      });

      // Choose the appropriate model based on userType
      let healthProviderModel;
      switch (userType) {
        case 'doctor':
          healthProviderModel = Doctor;
          break;
        case 'pharmacy':
          healthProviderModel = Pharmacy;
          break;
        case 'therapist':
          healthProviderModel = Therapist;
          break;
        case 'laboratory':
          healthProviderModel = Laboratory;
          break;
        // Add other cases as needed
        default:
          // Default to patient
          healthProviderModel = null;
      }

      // Create a new health provider instance if userType is one of the specified types
      let healthProvider;
      if (healthProviderModel) {
        healthProvider = new healthProviderModel({
          // Add fields specific to health providers
          name: 'Example Pharmacy', // Example field; replace with actual fields
        });
      }

      await User.register(newUser, password, async (err, user) => {
        if (err) {
          // Handle registration errors
          console.error(err);
          if (err.name === 'UserExistsError') {
            return res.status(400).json({ message: 'User already registered' });
          } else {
            console.error(err);
            return res.status(500).json({ message: 'Internal Server Error' });
          }
        } else {
          // If a health provider was created, associate it with the user
          if (healthProvider) {
            user.healthProvider = healthProvider;
            await healthProvider.save();
          }

          // Send verification code via email
          await sendVerificationEmail(user.email, verificationcode);

          passport.authenticate('local')(req, res, () => {
            // Redirect to verify route
            res.status(200).json({ message: "Verification code sent to email", redirectTo: "/verify" });
          });
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during registration' });
    }
  },



  login: async (req, res) => {
    const user = new User({
      username: req.body.email,
      password: req.body.password
    });

    console.log(user);

    req.login(user, async (err) => {
      if (err) {
        console.log(err);
      } else {
        passport.authenticate("local", (err, user, info) => {
          if (err) {
            console.log(err);
            return res.status(500).json({ message: 'Internal Server Error' });
          }

          if (!user) {
            // User authentication failed
            return res.status(401).json({ message: 'Authentication failed' });
          }

          // Manually log in the user
          req.logIn(user, (err) => {
            if (err) {
              console.log(err);
              return res.status(500).json({ message: 'Internal Server Error' });
            }

            // Check if the user is verified
            if (!user.isVerified) {
              return res.status(403).json({ message: 'User not verified', redirectTo: "/auth/verify" });
            }

            res.status(201).json({
              message: 'Successfully logged in',
            });
          });
        })(req, res);
      }
    });
  },

  logout: function (req, res) {
    req.logout((err) => {
      if (err) {
        console.log(err);
      } else {
        res.status(200).json({ message: "Successfully logged out" })
      }
    });

  },


  
  // Verify 
  verify: async (req, res) => {
    try {
      const verifyCode = req.body.verifyCode;

      
      // Check if the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Check if the user is already verified
    if (req.user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    console.log(req.user.verificationcode, verifyCode);
      // Check if the verification code matches the one in the database
      if (req.user.verificationcode !== verifyCode) {
        return res.status(400).json({ message: 'Invalid verification code' });
      }

      

      // Update user's verification status
      req.user.isVerified = true;
      req.user.verificationcode = null; //clear the code after successful verification
      await req.user.save();

      // Return information to populate dashboard
      return res.status(201).json({
        message: 'Successfully Registered',
        user: {
          fName: req.user.fName,
          id: req.user._id,
          username: req.user.username,
          email: req.user.email,
          role: req.user.role,
        },
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during verification' });
    }
  },  
};

export default authController;