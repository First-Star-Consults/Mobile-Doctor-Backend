import mongoose from 'mongoose';
import User from "../models/user.js";
import { Prescription, Transaction, TestResult } from "../models/services.js";
import { calculateFeesAndTransfer } from "../utils/inAppTransferService.js";
import {
  Doctor,
  Therapist,
  Pharmacy,
  Laboratory,
} from "../models/healthProviders.js";
import { upload } from "../config/cloudinary.js";
import { sendNotificationEmail } from "../utils/nodeMailer.js";
import Notification from "../models/notificationModel.js";

// Assuming you have an admin user with a fixed ID for receiving fees
const adminId = "669c4f6f78766d19d1d3230b";

const prescriptionController = {
  makePrescriptions: async (req, res) => {
    const { doctorId } = req.params;
    const { patientId, medicines, labTests, diagnosis, providerType } =
      req.body;

    try {
      // Fetch the doctor's details from the database
      const doctor = await Doctor.findById(doctorId);
      const patientEmail = await User.findById(patientId);

      // Check if the doctor exists and if their KYC verification is true
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found." });
      }
      if (doctor.kycVerification !== true) {
        return res.status(403).json({ message: "Doctor not verified." });
      }

      // Find an existing incomplete prescription for the patient
      let prescription = await Prescription.findOne({
        patient: patientId,
        status: "incomplete",
      });

      if (!prescription) {
        // If no incomplete prescription exists, create a new one
        prescription = new Prescription({
          doctor: doctorId,
          patient: patientId,
          medicines: medicines || [],
          labTests: labTests || [],
          diagnosis: diagnosis || "",
          providerType: providerType || "",
        });
      } else {
        // Update the existing incomplete prescription with new data
        if (medicines) {
          prescription.medicines = medicines;
        }
        if (labTests) {
          prescription.labTests = labTests;
        }
        if (diagnosis) {
          prescription.diagnosis = diagnosis;
        }
      }

      // Update status to complete if all necessary fields are present
      if (
        prescription.medicines.length > 0 &&
        prescription.labTests.length > 0 &&
        prescription.diagnosis
      ) {
        prescription.status = "complete";
      }

      await prescription.save();

      // Send email notification to the patient
      const emailSubject = "New Prescription Created";
      const emailMessage = `Dear ${patientEmail.firstName},\n\nYour doctor has created a new prescription for you. Please check your prescription details in app.\n\nBest regards,\nThe Mobile Doctor Team`;
      await sendNotificationEmail(
        patientEmail.email,
        emailSubject,
        emailMessage
      );

      // Create in-app notification for the patient
      const notification = new Notification({
        recipient: patientEmail._id, // Set recipient field
        type: "Prescription Created",
        message: `A new prescription has been created for you by Dr. ${doctor.fullName}.`,
        relatedObject: prescription._id,
        relatedModel: "Prescription",
      });
      await notification.save();

      // Respond with a clear message including the prescription ID
      res.status(201).json({
        message: "Prescription created/updated successfully",
        prescriptionId: prescription._id,
        providerType: prescription.providerType,
      });
    } catch (error) {
      console.error("Failed to create/update prescription:", error);
      res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  },

  // makePrescriptions: async (req, res) => {
  //     const { doctorId } = req.params;
  //     const { patientId, medicines, labTests, diagnosis } = req.body;

  //     // Check for missing required fields
  //     if (!patientId || !medicines || medicines.length === 0) {
  //       return res.status(400).json({
  //         message: 'Missing required fields: patientId, medicines are required.'
  //       });
  //     }

  //     try {
  //       // Fetch the doctor's details from the database
  //       const doctor = await Doctor.findById(doctorId);

  //       // Check if the doctor exists and if their KYC verification is true
  //       if (!doctor) {
  //         return res.status(404).json({ message: 'Doctor not found.' });
  //       }

  //       if (doctor.kycVerification !== true) {
  //         return res.status(403).json({ message: 'Doctor not verified.' });
  //       }

  //       // Proceed with creating the prescription
  //       const prescription = await Prescription.create({
  //         doctor: doctorId,
  //         patient: patientId,
  //         medicines,
  //         labTests,
  //         diagnosis
  //       });

  //       // Respond with a clear message including the prescription ID
  //       res.status(201).json({
  //         message: 'Prescription created successfully',
  //         prescriptionId: prescription._id
  //       });
  //     } catch (error) {
  //       console.error('Failed to create prescription:', error);
  //       res.status(500).json({ message: 'Internal server error', error: error.message });
  //     }
  //   },

  sharePrescription: async (req, res) => {
    const { prescriptionId, providerId, providerType, deliveryOption } =
      req.body;
    const patientId = req.params.patientId;

    // Validate inputs
  if (!mongoose.isValidObjectId(prescriptionId) || !mongoose.isValidObjectId(providerId)) {
    return res.status(400).json({ message: "Invalid prescription or provider ID" });
  }

    try {
      const prescription = await Prescription.findById(prescriptionId);
      if (!prescription)
        return res.status(404).json({ message: "Prescription not found" });

      const patient = await User.findById(patientId);
      if (!patient)
        return res.status(404).json({ message: "Patient not found" });

      // Perform update using findByIdAndUpdate
    const updatedPrescription = await Prescription.findByIdAndUpdate(
      prescriptionId,
      {
        $set: {
          patientAddress: patient.address,
          deliveryOption: deliveryOption,
          providerType: providerType.toLowerCase(), // Ensure lowercase
          provider: providerId, // Set provider reference
        }
      },
      { new: true } // Return the updated document
    );

    if (!updatedPrescription) {
      return res.status(500).json({ message: "Failed to update prescription" });
    }

      const sharedPrescription = {
        prescription: prescription._id,
        deliveryOption,
        patient: patientId,
        patientAddress: prescription.patientAddress,
        diagnosis: prescription.diagnosis,
        deliveryOption: prescription.deliveryOption,
        medicines: prescription.medicines,
        createdAt: prescription.createdAt,
      };

      let ProviderModel;
      switch (providerType.toLowerCase()) {
        case "doctor":
          ProviderModel = Doctor;
          break;
        case "pharmacy":
          ProviderModel = Pharmacy;
          break;
        case "therapist":
          ProviderModel = Therapist;
          break;
        case "laboratory":
          ProviderModel = Laboratory;
          break;
        default:
          return res.status(400).json({ message: "Invalid provider type" });
      }

      const provider = await ProviderModel.findById(providerId);
      if (!provider)
        return res.status(404).json({ message: "Provider not found" });

      provider.prescriptions.push(sharedPrescription);
      await provider.save();

      // Fetch provider user information for email notification
      const providerUser = await User.findById(providerId);
      if (!providerUser)
        return res.status(404).json({ message: "Provider user not found" });

      // Send email notification
      const subject = "New Prescription Shared";
      const message = `A new prescription has been shared with you by patient ${patient.firstName} ${patient.lastName}. Please review it as soon as possible.`;
      await sendNotificationEmail(providerUser.email, subject, message);

      // Create in-app notification
      const inAppNotification = new Notification({
        recipient: providerUser._id,
        type: "Prescription Shared",
        message: `A new prescription has been shared with you by patient ${patient.firstName} ${patient.lastName}.`,
        relatedObject: prescriptionId,
        relatedModel: "Prescription",
      });
      await inAppNotification.save();

      res.status(200).json({
        message: "Prescription shared successfully",
        prescriptions: provider.prescriptions,
        patientAddress: prescription.patientAddress,
        diagnosis: prescription.diagnosis,
        deliveryOption: prescription.deliveryOption,
        medicines: prescription.medicines,
        createdAt: prescription.createdAt,
      });
    } catch (error) {
      console.error("Failed to share prescription:", error);
      res.status(500).json({ message: error.message });
    }
  },

  getPatientPrescriptions: async (req, res) => {
    const patientId = req.params.patientId;

    try {
      const prescriptions = await Prescription.find({ patient: patientId })
        .populate("doctor", "fullName profilePhoto medicalSpecialty.name")
        .sort({ createdAt: -1 });

      if (!prescriptions.length) {
        return res
          .status(404)
          .json({ message: "No prescriptions found for this patient" });
      }

      const prescriptionsWithDetails = prescriptions.map((prescription) => ({
        prescriptionId: prescription._id, // Add prescriptionId
        doctorId: prescription.doctor._id, // Add doctorId
        doctor: {
          fullName: prescription.doctor.fullName,
          profilePhoto: prescription.doctor.profilePhoto,
          medicalSpecialty: prescription.doctor.medicalSpecialty,
        },
        diagnosis: prescription.diagnosis,
        medicines: prescription.medicines,
        labTests: prescription.labTests,
        createdAt: prescription.createdAt,
        status: prescription.status, // Include the status field
        providerType: prescription.providerType, // Add providerType
      }));

      res.status(200).json(prescriptionsWithDetails);
    } catch (error) {
      console.error("Failed to fetch prescriptions:", error);
      res.status(500).json({ message: error.message });
    }
  },

  // for provider to get presction
  getProviderPrescriptions: async (req, res) => {
    const providerId = req.params.providerId;
    const providerType = req.body.providerType;

    try {
      let ProviderModel;

      switch (providerType.toLowerCase()) {
        case "doctor":
          ProviderModel = Doctor;
          break;
        case "pharmacy":
          ProviderModel = Pharmacy;
          break;
        case "therapist":
          ProviderModel = Therapist;
          break;
        case "laboratory":
          ProviderModel = Laboratory;
          break;
        default:
          return res.status(400).json({ message: "Invalid provider type" });
      }

      const provider = await ProviderModel.findById(providerId).populate(
        "prescriptions.prescription"
      );
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }

      const prescriptionsWithDetails = provider.prescriptions.map(
        (prescription) => {
          return {
            ...prescription.prescription.toObject(),
            patientAddress: prescription.prescription.patientAddress,
            diagnosis: prescription.prescription.diagnosis,
            medicines: prescription.prescription.medicines,
            createdAt: prescription.prescription.createdAt,
          };
        }
      );

      res.status(200).json(prescriptionsWithDetails);
    } catch (error) {
      console.error("Failed to get prescriptions:", error);
      res.status(500).json({ message: error.message });
    }
  },

  // Function to add costing details
  addCosting: async (req, res) => {
    const { prescriptionId, amount } = req.body;
    const providerId = req.params.providerId;

    try {
      const prescription = await Prescription.findById(prescriptionId);
      if (!prescription)
        return res.status(404).json({ message: "Prescription not found" });

      const isAuthorized =
        (await Laboratory.exists({ _id: providerId })) ||
        (await Pharmacy.exists({ _id: providerId }));
      if (!isAuthorized) {
        return res.status(403).json({
          message: "Not authorized to add costing to this prescription",
        });
      }

      prescription.totalCost = amount;
      await prescription.save();

      const transaction = new Transaction({
        user: prescription.patient,
        doctor: prescription.doctor,
        prescription: prescriptionId,
        type: "costing",
        status: "pending",
        amount,
      });

      await transaction.save();

      // Create an in-app notification for the patient
      const patient = await User.findById(prescription.patient);
      if (patient) {
        const notification = new Notification({
          recipient: patient._id,
          type: "Costing Added",
          message: `The provider has added a cost of ${amount} to your prescription. Please review and approve the cost.`,
          relatedObject: prescriptionId,
          relatedModel: "Prescription",
        });

        await notification.save();
      }

      res
        .status(200)
        .json({ message: "Costing added successfully", transaction });
    } catch (error) {
      console.error("Error adding costing:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // Function to get costing details for review
  getCostingDetails: async (req, res) => {
    const { prescriptionId } = req.params;
    const patientId = req.query.patientId; // Assuming patientId is passed as a query parameter

    try {
      // Find the prescription
      const prescription = await Prescription.findById(prescriptionId);
      if (!prescription)
        return res.status(404).json({ message: "Prescription not found" });

      // Find the related transaction
      const transaction = await Transaction.findOne({
        prescription: prescriptionId,
      });
      if (!transaction)
        return res.status(404).json({ message: "Transaction not found" });

      // Calculate the amount to be paid, including any admin fee
      const amount = transaction.amount;
      const adminFeePercentage = 0.05; // 5% admin fee
      const adminFee = amount * adminFeePercentage;
      const totalAmount = amount + adminFee; // Total amount to be paid

      res.status(200).json({
        message: "Costing details fetched successfully",
        transaction: {
          amount,
          adminFee,
          totalAmount,
        },
      });
    } catch (error) {
      console.error("Error fetching costing details:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  // Function to approve costing
  approveCosting: async (req, res) => {
    const { prescriptionId } = req.body;
    const patientId = req.params.patientId;

    try {
      const prescription = await Prescription.findById(prescriptionId);

      if (!prescription)
        return res.status(404).json({ message: "Prescription not found" });

      // Check if the prescription has already been approved
      if (prescription.approved) {
        return res
          .status(400)
          .json({ error: "This prescription has already been approved." });
      }

      const amount = prescription.totalCost;

      const transaction = await Transaction.findOne({
        prescription: prescriptionId,
      });
      if (transaction) {
        transaction.status = "approved";
        await transaction.save();
      }

      let providerModel;
      switch (prescription.providerType) {
        case "pharmacy":
          providerModel = Pharmacy;
          break;
        case "laboratory":
          providerModel = Laboratory;
          break;
        default:
          return res.status(400).json({ message: "Invalid provider type" });
      }

      const provider = await providerModel.findById(prescription.provider);
      if (!provider)
        return res.status(404).json({ message: "Provider not found" });

      // Check user's balance
      const user = await User.findById(patientId);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (user.walletBalance < amount) {
        return res.status(400).json({ balanceMessage: "Insufficient balance" });
      }

      await calculateFeesAndTransfer(
        patientId,
        prescription.provider,
        amount,
        adminId
      );

      // Set the approved field to true
      prescription.approved = true;
      await prescription.save();

      // Create an in-app notification for the provider
      const providerNotification = new Notification({
        recipient: provider._id,
        type: "Costing Approved",
        message: `The patient has approved the cost of ${amount} for the prescription.`,
        relatedObject: prescriptionId,
        relatedModel: "Prescription",
      });

      await providerNotification.save();

      res
        .status(200)
        .json({ message: "Costing approved successfully", transaction });
    } catch (error) {
      console.error("Error approving costing:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  uploadTestResult: async (req, res) => {
    try {
      const { patientId, testName, prescriptionId } = req.body;
      const providerId = req.params.providerId;

      const patient = await User.findById(patientId);
      if (!patient || patient.role !== "patient") {
        return res.status(404).json({ message: "Patient not found" });
      }

      const healthProvider = await User.findById(providerId);

      // Handle file upload
      if (!req.files || !req.files.testResult) {
        return res
          .status(400)
          .json({ message: "No test result file uploaded" });
      }

      const file = req.files.testResult;
      const folderName = `test_results/${providerId}/${patientId}`;
      const uploadedFile = await upload(file.tempFilePath, folderName);

      const testResultEntry = new TestResult({
        patient: patientId,
        provider: providerId,
        testName,
        testResult: uploadedFile.secure_url,
      });

      await testResultEntry.save();

      // Create an in-app notification for the patient
      const patientNotification = new Notification({
        recipient: patient._id,
        type: "Test Result Uploaded",
        message: `A new test result for ${testName} has been uploaded by ${healthProvider.firstName}.`,
        relatedObject: prescriptionId,
        relatedModel: "Prescription",
      });

      await patientNotification.save();

      // Send email notification to the patient
      const subject = "New Test Result Uploaded";
      const message = `Dear ${patient.firstName},\n\nA new test result for ${testName} has been uploaded by your provider. log into the mobile doctor app to download your result.\n\nBest regards,\nYour Healthcare Team`;

      await sendNotificationEmail(patient.email, subject, message);

      res.status(201).json({
        message: "Test result uploaded successfully",
        testResult: testResultEntry,
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  },

  getTestResults: async (req, res) => {
    try {
      const patientId = req.params.patientId;

      // Debug: Log patientId
      console.log("Fetching test results for patient ID:", patientId);

      const testResults = await TestResult.find({ patient: patientId })
        .populate("provider", "name profilePhoto")
        .sort({ date: -1 });

      // Debug: Log testResults before sending response
      console.log("Test results:", testResults);

      res.status(200).json(testResults);
    } catch (error) {
      console.error("Error fetching test results:", error);
      res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  },

  // Function to update the status of a prescription
  updatePrescriptionStatus: async (req, res) => {
    const { prescriptionId, status } = req.body;
  
    if (!["approved", "declined", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
  
    try {
      // Fetch the prescription
      const prescription = await Prescription.findById(prescriptionId);
      if (!prescription)
        return res.status(404).json({ message: "Prescription not found" });
  
      // Update the status of the prescription
      prescription.status = status;
      await prescription.save();
  
      // Handle transaction state if needed
      const transaction = await Transaction.findOne({
        prescription: prescriptionId,
      });
      if (transaction) {
        transaction.status = status === "completed" ? "success" : "pending";
        await transaction.save();
      }
  
      // Fetch the patient details for notification
      const patient = await User.findById(prescription.patient);
      if (!patient)
        return res.status(404).json({ message: "Patient not found" });
  
      // Create an in-app notification for the patient
      const notification = new Notification({
        recipient: patient._id,
        type: "Prescription Status Updated",
        message: `The status of your prescription has been updated to "${status}". Please check your prescription details for more information.`,
        timestamp: new Date(),
        relatedObject: prescription._id,
        relatedModel: 'Prescription',
      });
      await notification.save();
  
      res.status(200).json({ message: `Prescription ${status} successfully` });
    } catch (error) {
      console.error("Error updating prescription status:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};

export default prescriptionController;
