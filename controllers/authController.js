//authcontroller
import crypto from "crypto";
import { io } from "../server.js";
import { sendNotificationEmail } from "../utils/nodeMailer.js";
import Notification from "../models/notificationModel.js";

import passport from "passport";
import User from "../models/user.js";
import {
  Doctor,
  Therapist,
  Pharmacy,
  Laboratory,
} from "../models/healthProviders.js";
import MedicalRecord from "../models/medicalRecordModel.js";
import determineRole from "../utils/determinUserRole.js";
import { sendVerificationEmail } from "../utils/nodeMailer.js";
import { generateVerificationCode } from "../utils/verficationCodeGenerator.js";
// import { generateSessionToken } from '../models/user.js';
import {
  chargePatient,
  verifyTransaction,
  initiateTransfer,
  createTransferRecipient,
  validateAccountNumber,
  submitOtpForTransfer,
} from "../config/paymentService.js";
import { Transaction } from "../models/services.js";
import ConsultationSession from "../models/consultationModel.js";
import Conversation from "../models/conversationModel.js";

//i am wondering why am getting 500 when i from heroku

const verificationcode = generateVerificationCode();

const authController = {
  register: async (req, res) => {
    try {
      const {
        userType,
        email,
        password,
        phone,
        firstName,
        lastName,
        appropriate,
      } = req.body;

      const role = determineRole(userType);

      // Create a new user instance
      const newUser = new User({
        username: email,
        email,
        firstName,
        lastName,
        role: role,
        phone,
        appropriate: role === "doctor" ? appropriate : null,
        verificationcode,
        profilePhoto:
          "http://res.cloudinary.com/ditdm55co/image/upload/v1711405225/65f819a7b85308ae12b8bcd7/65f819a7b85308ae12b8bcd7/1711405225600.jpg",
      });

      // Choose the appropriate model based on userType
      let healthProviderModel;
      let medicalReportModel;
      switch (userType.toLowerCase()) {
        case "doctor":
          healthProviderModel = Doctor;
          break;
        case "patient":
          medicalReportModel = MedicalRecord;
          break;
        case "pharmacy":
          healthProviderModel = Pharmacy;
          break;
        case "therapist":
          healthProviderModel = Therapist;
          break;
        case "laboratory":
          healthProviderModel = Laboratory;
          break;
        // Add other cases as needed
        default:
          // Default to patient
          healthProviderModel = null;
      }

      // Create a new health provider instance if userType is one of the specified types
      let healthProvider;
      let medicalRecord;
      if (healthProviderModel) {
        healthProvider = new healthProviderModel({
          // Add fields specific to health providers
          name: role, // Example field; replace with actual fields
        });
      }

      if (medicalReportModel) {
        medicalRecord = new MedicalRecord({
          genotype: null,
          bloodGroup: null,
          maritalStatus: null,
          allergies: [],
          weight: null,
          testResults: [],
          others: null,
        });
      }

      await User.register(newUser, password, async (err, user) => {
        if (err) {
          // Handle registration errors
          console.error(err);
          if (err.name === "UserExistsError") {
            return res.status(400).json({ message: "User already registered" });
          } else {
            console.error(err);
            return res.status(500).json({ message: "Internal Server Error" });
          }
        } else {
          // If a health provider was created, associate it with the user
          if (healthProvider) {
            healthProvider._id = user._id; // Set the health provider's _id to match the user's _id
            user.healthProvider = healthProvider._id;
            await healthProvider.save();
          }

          // If a medical record was created, associate it with the user
          if (medicalRecord) {
            medicalRecord._id = user._id; // Set the health provider's _id to match the user's _id
            user.medicalRecord = medicalRecord._id;
            await medicalRecord.save();
          }

          // Send verification code via email
          await sendVerificationEmail(user.email, verificationcode);

          passport.authenticate("local")(req, res, () => {
            // Redirect to verify route
            res.status(200).json({
              message: `Verification code: ${verificationcode}`,
              redirectTo: "/verify",
            });
          });
        }
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Unexpected error during registration" });
    }
  },

  resendVerificationCode: async (req, res) => {
    try {
      const { email } = req.body;
  
      // Find the user by email
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Check if the user is already verified
      if (user.isVerified) {
        // Set verification code to null since the user is already verified
        user.verificationcode = null;
        await user.save();
  
        return res.status(200).json({ message: "User is already verified. No need to resend the verification code." });
      }
  
      // Check if the user has a verification code
      if (!user.verificationcode) {
        return res.status(400).json({ message: "No verification code found. Please register again." });
      }
  
      // Resend the existing verification code via email
      await sendVerificationEmail(user.email, user.verificationcode);
  
      res.status(200).json({ message: "Verification code resent successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },
  

  login: async (req, res) => {
    const user = new User({
      username: req.body.email,
      password: req.body.password,
    });

    req.login(user, async (err) => {
      if (err) {
        console.log(err);
      } else {
        passport.authenticate("local", (err, user, info) => {
          if (err) {
            console.log(err);
            return res.status(500).json({ message: "Internal Server Error" });
          }

          if (!user) {
            return res.status(401).json({ message: "Authentication failed" });
          }

          req.logIn(user, async (err) => {
            if (err) {
              console.log(err);
              return res.status(500).json({ message: "Internal Server Error" });
            }

            // Prepare the response data
            const responseData = {
              message: "Successfully logged in",
              user: {
                profilePhoto: user.profilePhoto,
                firstName: user.firstName,
                lastName: user.lastName,
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                isVerified: {
                  status: user.isVerified,
                  message: "Alabo, this one na for email verification o",
                },
                isOnline: user.isOnline,      // Added isOnline status
                isApproved: user.isApproved, 
              },
            };

            // Include kycVerification for health providers
            if (
              ["doctor", "therapist", "pharmacy", "laboratory"].includes(
                user.role
              )
            ) {
              let healthProviderInfo = null;
              switch (user.role) {
                case "doctor":
                  healthProviderInfo = await Doctor.findById(user._id);
                  break;
                case "therapist":
                  healthProviderInfo = await Therapist.findById(user._id);
                  break;
                case "pharmacy":
                  healthProviderInfo = await Pharmacy.findById(user._id);
                  break;
                case "laboratory":
                  healthProviderInfo = await Laboratory.findById(user._id);
                  break;
              }

              if (
                healthProviderInfo &&
                healthProviderInfo.kycVerification !== undefined
              ) {
                responseData.user.kycVerification =
                  healthProviderInfo.kycVerification;
              }
            }

            res.status(201).json(responseData);
          });
        })(req, res);
      }
    });
  },

  logout: async function (req, res) {
    // Check if the user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // Logout the user
      req.logout((err) => {
        if (err) {
          console.log(err);
        } else {
          res.status(200).json({ message: "Successfully logged out" });
        }
      });
    } catch (error) {
      console.error("Error during logout:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // Verify
  verify: async (req, res) => {
    try {
      const verifyCode = req.body.verifyCode;

      // Check if the user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Check if the user is already verified
      if (req.user.isVerified) {
        return res.status(400).json({ message: "User is already verified" });
      }

      console.log(req.user.verificationcode, verifyCode);
      // Check if the verification code matches the one in the database
      if (req.user.verificationcode !== verifyCode) {
        return res.status(400).json({ message: "Invalid verification code" });
      }

      // Update user's verification status
      req.user.isVerified = true;
      req.user.verificationcode = null; //clear the code after successful verification
      await req.user.save();

      // Return information to populate dashboard
      return res.status(201).json({
        message:
          "Email Verified Successfully, you can login into your account now",
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Unexpected error during verification" });
    }
  },

  fundWallet: async (req, res) => {
    const { amount } = req.body; // Only get amount from the request body

    try {
      const userId = req.params.userId;
      const user = await User.findById(userId);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      const email = user.email; // Get email from the user model

      const authorizationUrl = await chargePatient(email, amount);
      if (authorizationUrl) {
        // Directly send the authorization URL to the client
        res.status(200).json({ success: true, authorizationUrl });
      } else {
        throw new Error("Unable to initiate wallet funding");
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.toString() });
    }
  },

  handlePaystackWebhook: async (req, res) => {
    try {
      const event = req.body;

      // Verify Paystack webhook signature to ensure the request is legitimate
      const secret = process.env.PAYSTACK_SECRET_KEY;
      const hash = crypto
        .createHmac("sha512", secret)
        .update(JSON.stringify(req.body))
        .digest("hex");
      if (req.headers["x-paystack-signature"] !== hash) {
        return res.status(401).send("Invalid signature");
      }

      // Handle the successful payment event
      if (event.event === "charge.success") {
        const reference = event.data.reference;
        const verificationResult = await verifyTransaction(reference);

        if (verificationResult.success) {
          // Extract email and amount from the verified transaction
          const email = verificationResult.data.customer.email;
          const amount = verificationResult.data.amount / 100; // Convert from kobo to naira

          // Find the user by email and update their wallet balance
          const user = await User.findOne({ email: email });
          if (user) {
            user.walletBalance += amount; // Increase the user's wallet balance
            await user.save();

            // Record the successful transaction
            const transaction = new Transaction({
              user: user._id,
              type: "wallet funding",
              amount: amount,
              status: "success",
              date: new Date(),
            });
            await transaction.save();

            // Create and save a notification for the user
            const notification = new Notification({
              recipient: user._id,
              type: "wallet funding",
              message: `Your account has been successfully funded with ₦${amount}. Your new wallet balance is ₦${user.walletBalance}.`,
              relatedObject: user._id,
              relatedModel: "Transaction",
            });
            await notification.save();

            res
              .status(200)
              .send("Wallet funded and transaction recorded successfully");
          } else {
            console.error("User not found for email:", email);
            res.status(404).json({ message: "User not found" });
          }
        } else {
          console.error(
            "Payment verification failed:",
            verificationResult.message
          );
          res.status(500).json({ message: "Payment verification failed" });
        }
      } else {
        res.status(200).send("Webhook received but not a charge.success event");
      }
    } catch (error) {
      console.error("Error handling Paystack webhook:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // Add a transaction
  addTransaction: async (userId, type, amount, status) => {
    const transaction = new Transaction({
      user: userId,
      type,
      amount,
      status,
    });

    await transaction.save();
  },

  // Update wallet balance
  updateWalletBalance: async (userId, amount, isCredit) => {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    user.walletBalance += isCredit ? amount : -amount;
    await user.save();
  },

  getTransactionHistory: async (req, res) => {
    try {
      const { userId } = req.params;

      const transactions = await Transaction.find({ user: userId }).sort({
        date: -1,
      });
      res.status(200).json({ success: true, transactions });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getWalletBalance: async (req, res) => {
    try {
      const { userId } = req.params; // Assuming you pass userId as a URL parameter

      const user = await User.findById(userId);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      res
        .status(200)
        .json({ success: true, walletBalance: user.walletBalance });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Function to create a withdrawal request
  withdraw: async (req, res) => {
    try {
      const userId = req.params.userId;
      const { amount, accountNumber, bankName } = req.body;

      // Log request details
      console.log(
        `Withdrawal request by User ID: ${userId}, Amount: ${amount}, Account Number: ${accountNumber}, Bank Name: ${bankName}`
      );

      // Check if the user exists and has the appropriate role
      const user = await User.findById(userId);
      if (
        !user ||
        !["doctor", "laboratory", "therapist", "pharmacy"].includes(user.role)
      ) {
        console.log("Unauthorized user role or user not found");
        return res.status(403).json({
          success: false,
          message: "Unauthorized! You are not a health provider",
        });
      }

      // Check if the wallet has enough balance
      if (user.walletBalance < amount) {
        console.log("Insufficient wallet balance");
        return res
          .status(400)
          .json({ success: false, message: "Insufficient wallet balance" });
      }

      // Create a pending transaction with account details
      const transaction = new Transaction({
        user: userId,
        type: "withdrawal",
        status: "pending",
        amount: amount,
        accountNumber: accountNumber,
        bankName: bankName,
      });

      const savedTransaction = await transaction.save();

      // Log the saved transaction
      console.log("Transaction saved:", savedTransaction);

      // Check the saved transaction in the database
      const checkTransaction = await Transaction.findById(savedTransaction._id);
      console.log("Checked Transaction in DB:", checkTransaction);

      // Create a notification for the user about the withdrawal request
      const notification = new Notification({
        recipient: user._id,
        type: "withdrawal",
        message: `Your withdrawal request of ₦${amount} to ${bankName} (${accountNumber}) has been created and is pending approval.`,
        relatedObject: user._id,
        relatedModel: "Transaction",
      });
      await notification.save();

      // Send email notification to the user
      await sendNotificationEmail(
        user.email,
        "Withdrawal Request Created",
        `Your withdrawal request of ₦${amount} to ${bankName} (${accountNumber}) has been created and is pending approval.`
      );

      // Notify the admin for approval...
      res.status(200).json({
        success: true,
        message: "Withdrawal request created and pending approval",
        transactionId: savedTransaction._id,
      });
    } catch (error) {
      console.error("Error during withdrawal:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  getPendingWithdrawals: async (req, res) => {
    try {
      const adminId = req.params.adminId;

      // Validate admin privileges
      const admin = await User.findById(adminId);
      if (!admin || !admin.isAdmin) {
        console.log("Unauthorized admin access");
        return res.status(403).json({
          success: false,
          message: "Unauthorized to perform this action",
        });
      }

      // Retrieve all pending withdrawal transactions
      const pendingWithdrawals = await Transaction.find({
        status: "pending",
        type: "withdrawal",
      }).populate("user", "firstName lastName email");

      // Log the retrieved transactions
      console.log("Pending withdrawals:", pendingWithdrawals);

      res.status(200).json({ success: true, pendingWithdrawals });
    } catch (error) {
      console.error("Error fetching pending withdrawals:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal Server Error" });
    }
  },

  

  approveWithdrawal: async (req, res) => {
    try {
        const adminId = req.params.adminId;
        const { transactionId, accountNumber, bankCode } = req.body;

        const admin = await User.findById(adminId);
        if (!admin || !admin.isAdmin) {
            console.log("Unauthorized admin access");
            return res.status(403).json({
                success: false,
                message: "Unauthorized to perform this action",
            });
        }

        const transaction = await Transaction.findById(transactionId).populate("user");
        if (!transaction || transaction.status !== "pending") {
            console.log(`Invalid or already processed transaction. Transaction ID: ${transactionId}`);
            return res.status(400).json({
                success: false,
                message: "Invalid or already processed transaction",
            });
        }

        const user = transaction.user;
        if (!user) {
            console.log(`User not found for Transaction ID: ${transactionId}`);
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Validate account number with bank code
        let accountValidation;
        try {
            accountValidation = await validateAccountNumber(accountNumber, bankCode);
            if (!accountValidation) {
                throw new Error("Account validation failed");
            }
        } catch (error) {
            console.error("Error during account validation:", error);
            transaction.status = "failed";
            await transaction.save();
            await sendFailureNotification(user, transaction, bankCode, accountNumber, "Account validation failed.");
            return res.status(400).json({
                success: false,
                message: "Invalid account details",
                transactionId,
            });
        }

        // Create transfer recipient
        const recipientName = accountValidation.account_name;
        let recipientDetails;
        try {
            recipientDetails = await createTransferRecipient(recipientName, accountNumber, bankCode);
            if (!recipientDetails) {
                throw new Error("Failed to create transfer recipient");
            }
        } catch (error) {
            console.error("Error during transfer recipient creation:", error);
            transaction.status = "failed";
            await transaction.save();
            await sendFailureNotification(user, transaction, bankCode, accountNumber, "Transfer recipient creation failed.");
            return res.status(500).json({
                success: false,
                message: "Failed to create transfer recipient",
                transactionId,
            });
        }

        // Initiate transfer
        let transferResponse;
        try {
            transferResponse = await initiateTransfer(transaction.amount, recipientDetails.recipient_code);
            if (!transferResponse) {
                throw new Error("Failed to initiate transfer");
            }
        } catch (error) {
            console.error("Error during transfer initiation:", error);
            transaction.status = "failed";
            await transaction.save();
            await sendFailureNotification(user, transaction, bankCode, accountNumber, "Transfer initiation failed.");
            return res.status(500).json({
                success: false,
                message: "Failed to initiate transfer",
                transactionId,
            });
        }

        // Notify user to finalize the transfer using OTP
        res.status(200).json({
            success: true,
            message: "Withdrawal approval processing, please finalize by sending OTP",
            transferDetails: transferResponse,
            transactionId,
        });
    } catch (error) {
        console.error("Error during withdrawal approval:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            transactionId: req.body.transactionId,
        });
    }
},


  finalizeWithdrawal: async (req, res) => {
    try {
        const adminId = req.params.adminId;
        const { otp, transferCode, transactionId } = req.body;

        const admin = await User.findById(adminId);
        if (!admin || !admin.isAdmin) {
            console.log("Unauthorized admin access");
            return res.status(403).json({
                success: false,
                message: "Unauthorized to perform this action",
            });
        }

        if (!otp || !transferCode) {
            return res.status(400).json({
                success: false,
                message: "OTP and transfer code are required.",
            });
        }

        const result = await submitOtpForTransfer(otp, transferCode);

        const transaction = await Transaction.findById(transactionId).populate("user");
        if (!transaction || transaction.status !== "pending") {
            console.log(`Invalid or already processed transaction. Transaction ID: ${transactionId}`);
            return res.status(400).json({
                success: false,
                message: "Invalid or already processed transaction",
            });
        }

        const user = transaction.user;
        if (!user) {
            console.log(`User not found for Transaction ID: ${transactionId}`);
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (result.success) {
            const transferConfirmed = await checkTransferStatus(result.data.reference);
            if (!transferConfirmed) {
                transaction.status = "failed";
                await transaction.save();
                await sendFailureNotification(user, transaction, transaction.bankCode, transaction.accountNumber, "Transfer confirmation failed.");
                return res.status(500).json({
                    success: false,
                    message: "Transfer confirmation failed",
                    transactionId,
                });
            }

            // Deduct the amount from user's wallet balance
            user.walletBalance -= transaction.amount;
            await user.save();

            transaction.status = "success";
            await transaction.save();

            const successNotification = new Notification({
                recipient: user._id,
                type: "withdrawal",
                message: `Your withdrawal request of ₦${transaction.amount} has been approved and processed.`,
                relatedObject: user._id,
                relatedModel: "Transaction",
            });
            await successNotification.save();
            await sendNotificationEmail(
                user.email,
                "Withdrawal Request Approved",
                `Your withdrawal request of ₦${transaction.amount} has been approved and processed. The amount will be credited to your account shortly.`
            );

            return res.status(200).json({
                success: true,
                message: "Withdrawal finalized and transfer successful.",
                data: result.data,
            });
        } else {
          // for result ques transaction is successful
            return res.status(400).json({ success: true, message: result.message });
        }
    } catch (error) {
        console.error("Error finalizing withdrawal:", error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
},


  

  startConsultation: async (req, res) => {
    const { patientId, doctorId } = req.body;
  
    try {
      // Check if there is an existing active session for this doctor
      const existingDoctorSession = await ConsultationSession.findOne({
        doctor: doctorId,
        status: { $in: ["scheduled", "in-progress"] },
      });
  
      // If the doctor is already in an active session, return an error
      if (existingDoctorSession) {
        return res.status(400).json({
          message:
            "The doctor is currently in an active session with another patient. Please wait until the session is completed or canceled before starting a new one.",
        });
      }
  
      // Check if there is an existing active session for this patient and doctor
      const existingPatientSession = await ConsultationSession.findOne({
        patient: patientId,
        doctor: doctorId,
        status: { $in: ["scheduled", "in-progress"] },
      });
  
      // If an existing active session is found for the patient and doctor, indicate that a new session can't be started
      if (existingPatientSession) {
        return res.status(400).json({
          message:
            "An active session already exists for this patient and doctor. Please complete or cancel the existing session before starting a new one.",
        });
      }
  
      // Ensure both patient and doctor exist
      const patient = await User.findById(patientId);
      const doctor = await Doctor.findById(doctorId);
      if (!patient || !doctor) {
        return res.status(404).json({ message: "Patient or Doctor not found" });
      }
  
      // Initialize consultationFee with the default value from doctor.medicalSpecialty
      let consultationFee = doctor.medicalSpecialty.fee; // Use the default fee
      consultationFee = Number(consultationFee);
  
      if (isNaN(consultationFee)) {
        return res.status(400).json({ message: "Invalid consultation fee." });
      }
  
      // Check patient's wallet balance
      if (patient.walletBalance < consultationFee) {
        return res.status(400).json({
          message: "Insufficient wallet balance for this consultation.",
        });
      }
  
      // Deduct consultation fee from patient's wallet
      patient.walletBalance -= consultationFee;
      await patient.save();
  
      // Record the transaction as held in escrow
      const transaction = new Transaction({
        user: patientId,
        doctor: doctorId,
        type: "consultation fee",
        status: "success",
        escrowStatus: "held",
        amount: consultationFee,
      });
      await transaction.save();
  
      // Find or create a conversation between patient and doctor
      let conversation = await Conversation.findOne({
        participants: { $all: [patientId, doctorId] },
      });
      if (!conversation) {
        conversation = new Conversation({
          participants: [patientId, doctorId],
        });
        await conversation.save();
      }
  
      // Create the consultation session
      const newSession = new ConsultationSession({
        doctor: doctorId,
        patient: patientId,
        status: "scheduled",
        escrowTransaction: transaction._id,
        startTime: new Date(),
      });
      await newSession.save();
  
      // Notify the doctor about the new consultation session
      io.to(doctorId).emit("consultationStarted", {
        message: "A new consultation has started!",
        sessionId: newSession._id,
      });
  
      // Create an in-app notification for the doctor
      const notification = new Notification({
        recipient: doctorId,
        type: "Consultation",
        message: `Dear Doctor,\n\n You have a new consultation session scheduled with patient ${patient.username}.`,
        relatedObject: doctorId,
        relatedModel: "Consultation",
      });
      await notification.save();
  
      // Retrieve the doctor's email from the User schema
      const doctorUser = await User.findById(doctorId);
      if (doctorUser && doctorUser.email) {
        // Send a notification email to the doctor
        sendNotificationEmail(
          doctorUser.email,
          "New Consultation Session",
          `You have a new consultation session scheduled with patient ${patient.username}. Please check your dashboard for more details.`
        );
      }
  
      // Return success response with session details and conversation ID
      res.status(200).json({
        message: "New consultation session started successfully.",
        session: newSession,
        conversationId: conversation._id,
      });
    } catch (error) {
      console.error("Failed to start consultation:", error);
      res.status(500).json({
        message: "Error starting consultation",
        error: error.toString(),
      });
    }
  },
  

  // getActiveSession: async (req, res) => {
  //   const { patientId, doctorId } = req.params;

  //   try {
  //     // First, find the conversation ID for the patient and doctor
  //     const conversation = await Conversation.findOne({
  //       participants: { $all: [patientId, doctorId] },
  //     }).select("_id");

  //     if (!conversation) {
  //       return res.status(404).json({ message: "Conversation not found." });
  //     }

  //     // Then, find the active session
  //     const activeSession = await ConsultationSession.findOne({
  //       patient: patientId,
  //       doctor: doctorId,
  //       status: { $in: ["scheduled", "in-progress"] },
  //     })
  //       .sort({ createdAt: -1 })
  //       .populate("patient", "firstName lastName profilePhoto");

  //     if (!activeSession) {
  //       return res.status(404).json({ message: "Active session not found." });
  //     }

  //     // Fetch the Doctor document to access the profilePhoto within the images object
  //     const doctorInfo = await Doctor.findById(doctorId).select(
  //       "images.profilePhoto -_id"
  //     );

  //     // Return the session info including the conversation ID
  //     res.status(200).json({
  //       sessionId: activeSession._id,
  //       conversationId: conversation._id,
  //       patientFirstName: activeSession.patient.firstName,
  //       patientLastName: activeSession.patient.lastName,
  //       patientProfilePhoto: activeSession.patient.profilePhoto,
  //       doctorProfilePhoto: doctorInfo ? doctorInfo.images.profilePhoto : null,
  //       startTime: activeSession.startTime,
  //     });
  //   } catch (error) {
  //     console.error("Error retrieving active session:", error);
  //     res.status(500).json({
  //       message: "Failed to retrieve active session.",
  //       error: error.message,
  //     });
  //   }
  // },


  getActiveSession: async (req, res) => {
    const { patientId, doctorId } = req.params;

    try {
        // First, find the conversation ID for the patient and doctor
        const conversation = await Conversation.findOne({
            participants: { $all: [patientId, doctorId] },
        }).select("_id");

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found." });
        }

        // Find the active session
        const activeSession = await ConsultationSession.findOne({
            patient: patientId,
            doctor: doctorId,
            status: { $in: ["scheduled", "in-progress"] },
        })
            .sort({ createdAt: -1 })
            .populate("patient", "firstName lastName profilePhoto isOnline")
            .populate({
                path: 'doctor', // Fetch the doctor profilePhoto from Doctor schema
                select: 'images.profilePhoto',
                populate: {
                    path: '_id', // Populate User schema data for isOnline status
                    model: 'User',
                    select: 'isOnline',
                }
            });

        if (!activeSession) {
            return res.status(404).json({ message: "Active session not found." });
        }

        // Fetch the User document to get the isOnline status of the doctor
        const doctorUser = await User.findById(doctorId).select("isOnline");

        // Return the session info including the conversation ID
        res.status(200).json({
            sessionId: activeSession._id,
            conversationId: conversation._id,
            patientFirstName: activeSession.patient.firstName,
            patientLastName: activeSession.patient.lastName,
            patientProfilePhoto: activeSession.patient.profilePhoto,
            patientIsOnline: activeSession.patient.isOnline,
            doctorProfilePhoto: activeSession.doctor.images.profilePhoto,
            doctorIsOnline: doctorUser ? doctorUser.isOnline : null,
            startTime: activeSession.startTime,
        });
    } catch (error) {
        console.error("Error retrieving active session:", error);
        res.status(500).json({
            message: "Failed to retrieve active session.",
            error: error.message,
        });
    }
},


  getMostRecentActiveSession: async (req, res) => {
    const userId = req.params.userId;

    try {
      // First, identify the role of the user making the request
      const userMakingRequest = await User.findById(userId);
      if (!userMakingRequest) {
        return res
          .status(404)
          .json({ success: false, message: "User not found." });
      }

      // Find the most recent active session for the user
      const mostRecentActiveSession = await ConsultationSession.findOne({
        $or: [{ patient: userId }, { doctor: userId }],
        status: { $in: ["scheduled", "in-progress"] },
      })
        .sort({ startTime: -1 }) // Get the most recent session
        .lean(); // Use lean() for faster execution as we just need the object

      if (!mostRecentActiveSession) {
        return res.status(404).json({
          success: false,
          message: "No active session found for this user.",
        });
      }

      // Now find the conversation related to the session
      const conversation = await Conversation.findOne({
        participants: {
          $all: [
            mostRecentActiveSession.patient,
            mostRecentActiveSession.doctor,
          ],
        },
      })
        .select("_id")
        .lean();

      // Attach conversationId to the session object if found
      mostRecentActiveSession.conversationId = conversation
        ? conversation._id
        : null;

      // Attach patient or doctor details based on the role of the requester
      const otherParticipantId =
        userMakingRequest.role === "doctor"
          ? mostRecentActiveSession.patient
          : mostRecentActiveSession.doctor;
      const otherParticipantDetails = await User.findById(
        otherParticipantId,
        "firstName lastName profilePhoto _id"
      ).lean();

      // Prepare the response object
      const responseObj = {
        success: true,
        message: "Most recent active session retrieved successfully.",
        session: {
          sessionId: mostRecentActiveSession._id,
          startTime: mostRecentActiveSession.startTime,
          conversationId: mostRecentActiveSession.conversationId,
          otherParticipant: otherParticipantDetails,
        },
      };

      res.status(200).json(responseObj);
    } catch (error) {
      console.error("Error retrieving the most recent active session:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve the most recent active session.",
        error: error.message,
      });
    }
  },

  cancelConsultation: async (req, res) => {
    const { sessionId } = req.body;

    try {
      // Retrieve the session and ensure to populate the escrowTransaction
      const session = await ConsultationSession.findById(sessionId).populate(
        "escrowTransaction"
      );
      if (!session) {
        return res
          .status(404)
          .json({ message: "Consultation session not found" });
      }

      console.log("Session found with escrowTransaction:", session);

      // Ensure that the escrowTransaction exists and is in the 'held' state
      if (
        !session.escrowTransaction ||
        session.escrowTransaction.escrowStatus !== "held"
      ) {
        console.log("Transaction details:", session.escrowTransaction);
        return res.status(400).json({
          message: "No escrow transaction found or not eligible for refund",
        });
      }

      // Retrieve the patient for the session
      const patient = await User.findById(session.patient);
      const doctor = await User.findById(session.doctor);

      if (!patient) {
        return res
          .status(404)
          .json({ message: "Patient not found for refund" });
      }

      // Refund the consultation fee to the patient's wallet
      patient.walletBalance += session.escrowTransaction.amount;
      await patient.save();

      // Update the escrowTransaction status to 'refunded'
      session.escrowTransaction.escrowStatus = "refunded";
      await session.escrowTransaction.save();

      // Update the session status to 'cancelled'
      session.status = "cancelled";
      await session.save();

      // Create notification for the patient
      const patientNotification = new Notification({
        recipient: patient,
        type: "Canceled Consultation",
        message: `Your consultation session with ${doctor.firstName} has been canceled.`,
        relatedObject: session,
        relatedModel: "Consultation",
      });
      await patientNotification.save();

      // Create notification for the doctor

      const doctorNotification = new Notification({
        recipient: doctor,
        type: "Canceled Consultation",
        message: `Your consultation session with patient: ${patient.firstName} has been canceled.`,
        relatedObject: session,
        relatedModel: "Consultation",
      });
      await doctorNotification.save();

      return res.status(200).json({
        message: "Consultation cancelled and fee refunded to patient",
      });
    } catch (error) {
      console.error("Error during consultation cancellation:", error);
      return res.status(500).json({
        message: "Error cancelling consultation",
        error: error.toString(),
      });
    }
  },

  completeConsultation: async (req, res) => {
    const { sessionId } = req.body;
    let consultationComplete = false;

    try {
      const session = await ConsultationSession.findById(sessionId).populate(
        "patient doctor"
      ); // Populate patient and doctor details
      if (!session) {
        return res
          .status(404)
          .json({ message: "Consultation session not found" });
      }

      // Check if the session is already completed to avoid repeated completions
      if (session.status === "completed") {
        return res.status(400).json({
          message: "Consultation session is already marked as completed.",
        });
      }

      // Mark session as completed
      session.status = "completed";
      session.endTime = new Date();
      await session.save();

      // Release the escrow to the doctor
      // const transaction = await Transaction.findById(session.escrowTransaction);
      // if (transaction && transaction.escrowStatus === "held") {
      //   const doctor = session.doctor;
      //   if (doctor) {
      //     doctor.walletBalance += transaction.amount; // Release funds to the doctor
      //     await doctor.save();

      //     transaction.escrowStatus = "released";
      //     await transaction.save();
      //     consultationComplete = true;
      //   }
      // }


      // Release the escrow to the doctor
const transaction = await Transaction.findById(session.escrowTransaction);
if (transaction && transaction.escrowStatus === "held") {
    // Fetch the User document for the doctor
    const doctorUser = await User.findById(session.doctor);
    if (doctorUser) {
        // Update the wallet balance
        doctorUser.walletBalance += transaction.amount;
        try {
            await doctorUser.save(); // Save the updated User document
        } catch (error) {
            console.error("Error saving user wallet balance:", error);
            return res.status(500).json({ message: "Error updating doctor's wallet balance" });
        }

        // Update the transaction status
        transaction.escrowStatus = "released";
        await transaction.save();

        consultationComplete = true;
    } else {
        return res.status(404).json({ message: "Doctor user not found" });
    }
}

      // Create notification for the patient
      const patient = session.patient;
      const doctor = session.doctor;

      if (patient) {
        const patientNotification = new Notification({
          recipient: patient._id,
          type: "Consultation Completed",
          message: `Your consultation with Dr. ${doctor.firstName} ${doctor.lastName} has been completed.`,
          relatedObject: session,
          relatedModel: "Consultation",
        });
        await patientNotification.save();
      }

      // Create notification for the doctor

      if (doctor) {
        const doctorNotification = new Notification({
          recipient: doctor._id,
          type: "Consultation Completed",
          message: `The consultation with ${patient.firstName} ${patient.lastName} has been completed.`,
          relatedObject: session,
          relatedModel: "Consultation",
        });
        await doctorNotification.save();
      }

      res.status(200).json({
        message: "Consultation completed, funds released to doctor",
        consultationComplete,
      });
    } catch (error) {
      console.error("Error during consultation completion:", error);
      res.status(500).json({
        message: "Error completing consultation",
        error: error.toString(),
        consultationComplete,
      });
    }
  },
};

export default authController;
