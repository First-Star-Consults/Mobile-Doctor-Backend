//authcontroller
import passport from "passport";
import User from "../models/user.js";
import { Doctor, Therapist, Pharmacy, Laboratory } from "../models/healthProviders.js"
import determineRole from "../utils/determinUserRole.js";
// import { sendVerificationEmail } from "../utils/nodeMailer.js";
import { generateVerificationCode } from "../utils/verficationCodeGenerator.js";
import { generateSessionToken } from '../models/user.js';
import { chargePatient, verifyTransaction, creditWallet } from "../config/paymentService.js";

//i am wondering why am getting 500 when i from heroku

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
          name: role, // Example field; replace with actual fields
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
            healthProvider._id = user._id; // Set the health provider's _id to match the user's _id
            user.healthProvider = healthProvider._id;
            await healthProvider.save();
          }

          // Send verification code via email
          // await sendVerificationEmail(user.email, verificationcode);

          passport.authenticate('local')(req, res, () => {
            // Redirect to verify route
            res.status(200).json({ message: `Verification code: ${verificationcode}`, redirectTo: "/verify" });
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
          req.logIn(user, async (err) => {
            if (err) {
              console.log(err);
              return res.status(500).json({ message: 'Internal Server Error' });
            }

            // Set session token for doctor if user is a doctor
            
            if (user.role === 'doctor') {
              const doctor = await Doctor.findById(user._id);
              
              if (doctor) {
                const sessionToken = generateSessionToken();
                

                doctor.sessionToken = sessionToken;
                await doctor.save();
              }
            }

            // Check if the user is verified
            if (!user.isVerified) {
              return res.status(403).json({ message: 'User not verified', redirectTo: "/auth/verify" });
            }



            res.status(201).json({
              message: 'Successfully logged in',
              user: {
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                id: req.user._id,
                username: req.user.username,
                email: req.user.email,
                role: req.user.role,
              },
            });
          });
        })(req, res);
      }
    });
  },

  logout: async function (req, res) {
    // Check if the user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      // Clear session token for doctor if user is a doctor
      if (req.user.role === 'doctor') {
        const doctor = await Doctor.findById(req.user._id);
        if (doctor) {
          doctor.sessionToken = null;
          await doctor.save();
        }
      }

      // Logout the user
      req.logout((err) => {
        if (err) {
          console.log(err);
        } else {
          res.status(200).json({ message: "Successfully logged out" });
        }
      });
    } catch (error) {
      console.error('Error during logout:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
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
        message: 'Email Verified Successfully',
        user: {
          firstName: req.user.firstName,
          lastName: req.user.lastName,
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

  

  fundWallet: async (req, res) => {
    const { amount } = req.body; // Only get amount from the request body

    // Check if the user is logged in (e.g., check if req.userId exists)
    if (!req.userId) {
        // If req.userId doesn't exist, it means the user is not logged in.
        return res.status(401).json({ success: false, message: 'You must be logged in to fund your wallet.' });
    }

    try {
        // Assuming you can identify the user (e.g., through session or a user ID in the request)
        // Fetch the user details using the user ID from the request
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const email = user.email; // Get email from the user model

        const authorizationUrl = await chargePatient(email, amount);
        if (authorizationUrl) {
            // Directly send the authorization URL to the client
            res.status(200).json({ success: true, authorizationUrl });
        } else {
            throw new Error('Unable to initiate wallet funding');
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.toString() });
    }
},



  handlePaystackWebhook: async (req, res) => {
    try {
        const event = req.body;

        // It's important to verify the integrity of the webhook event
        // For simplicity, this example doesn't include signature verification
        // Paystack sends a signature in the header that you should verify

        if (event.event === 'charge.success') {
            // Extract necessary information from event data
            const email = event.data.customer.email;
            const amount = event.data.amount / 100; // Convert from kobo to naira
            const reference = event.data.reference;

            // You might want to verify the transaction again, even though
            // webhook indicates success, to ensure everything matches up
            const verificationResult = await verifyTransaction(reference);
            if (verificationResult && verificationResult.success) {
                const creditResult = await creditWallet(email, amount);
                if (creditResult.success) {
                    console.log('Wallet credited successfully');
                } else {
                    console.error('Failed to credit wallet:', creditResult.message);
                }
            } else {
                console.error('Payment verification failed');
            }
        }

        // Respond to Paystack to acknowledge receipt of the webhook
        res.status(200).send('Webhook received');
    } catch (error) {
        console.error('Error handling Paystack webhook:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

};

export default authController;