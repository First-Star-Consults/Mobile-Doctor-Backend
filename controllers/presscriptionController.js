import User from '../models/user.js'
import { Prescription, Transaction } from '../models/services.js';
import { calculateFeesAndTransfer } from '../utils/transactionService.js';
import {Doctor, Therapist, Pharmacy, Laboratory} from '../models/healthProviders.js'


// Assuming you have an admin user with a fixed ID for receiving fees
const adminId = '669c4f6f78766d19d1d3230b'; 

const prescriptionController = {


  makePrescriptions: async (req, res) => {
    const { doctorId } = req.params; 
    const { patientId, medicines, labTests, diagnosis } = req.body;
  
    try {
      // Fetch the doctor's details from the database
      const doctor = await Doctor.findById(doctorId);
  
      // Check if the doctor exists and if their KYC verification is true
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found.' });
      }
      if (doctor.kycVerification !== true) {
        return res.status(403).json({ message: 'Doctor not verified.' });
      }
  
      // Find an existing incomplete prescription for the patient
      let prescription = await Prescription.findOne({ patient: patientId, status: 'incomplete' });
  
      if (!prescription) {
        // If no incomplete prescription exists, create a new one
        prescription = new Prescription({
          doctor: doctorId,
          patient: patientId,
          medicines: medicines || [],
          labTests: labTests || [],
          diagnosis: diagnosis || ''
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
      if (prescription.medicines.length > 0 && prescription.labTests.length > 0 && prescription.diagnosis) {
        prescription.status = 'complete';
      }
  
      await prescription.save();
  
      // Respond with a clear message including the prescription ID
      res.status(201).json({ 
        message: 'Prescription created/updated successfully', 
        prescriptionId: prescription._id 
      });
    } catch (error) {
      console.error('Failed to create/update prescription:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
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
    const { prescriptionId, providerId, providerType, deliveryOption } = req.body;
    const patientId = req.params.patientId;
  
    try {
      const prescription = await Prescription.findById(prescriptionId);
      if (!prescription) return res.status(404).json({ message: 'Prescription not found' });
  
      const patient = await User.findById(patientId);
      if (!patient) return res.status(404).json({ message: 'Patient not found' });
  
      prescription.patientAddress = patient.address;
      prescription.deliveryOption = deliveryOption;
      prescription.providerType = providerType.toLowerCase(); // Set provider type
      prescription.provider = providerId; // Set provider reference
      await prescription.save();
  
      const sharedPrescription = {
        prescription: prescription._id,
        deliveryOption,
        patient: patientId,
        patientAddress: prescription.patientAddress,
        diagnosis: prescription.diagnosis,
        deliveryOption: prescription.deliveryOption,
        medicines: prescription.medicines,
        createdAt: prescription.createdAt
      };
  
      let ProviderModel;
      switch (providerType.toLowerCase()) {
        case 'doctor':
          ProviderModel = Doctor;
          break;
        case 'pharmacy': 
          ProviderModel = Pharmacy;
          break;
        case 'therapist':
          ProviderModel = Therapist;
          break;
        case 'laboratory':
          ProviderModel = Laboratory;
          break;
        default:
          return res.status(400).json({ message: 'Invalid provider type' });
      }
  
      const provider = await ProviderModel.findById(providerId);
      if (!provider) return res.status(404).json({ message: 'Provider not found' });
  
      provider.prescriptions.push(sharedPrescription);
      await provider.save();
  
      res.status(200).json({
        message: 'Prescription shared successfully',
        prescriptions: provider.prescriptions,
        patientAddress: prescription.patientAddress,
        diagnosis: prescription.diagnosis,
        deliveryOption: prescription.deliveryOption,
        medicines: prescription.medicines,
        createdAt: prescription.createdAt
      });
    } catch (error) {
      console.error('Failed to share prescription:', error);
      res.status(500).json({ message: error.message });
    }
  },
  
  
  
  getPatientPrescriptions: async (req, res) => {
    const patientId = req.params.patientId;
  
    try {
      const prescriptions = await Prescription.find({ patient: patientId })
        .populate('doctor', 'fullName profilePhoto medicalSpecialty.name')
        .sort({ createdAt: -1 });
  
      if (!prescriptions.length) {
        return res.status(404).json({ message: 'No prescriptions found for this patient' });
      }
  
      const prescriptionsWithDetails = prescriptions.map(prescription => ({
        ...prescription.toObject(),
        doctor: prescription.doctor,
        diagnosis: prescription.diagnosis,
        medicines: prescription.medicines, // Include medicines with daysOfTreatment
        labTests: prescription.labTests,
        createdAt: prescription.createdAt
      }));
  
      res.status(200).json(prescriptionsWithDetails);
    } catch (error) {
      console.error('Failed to fetch prescriptions:', error);
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
        case 'doctor':
          ProviderModel = Doctor;
          break;
        case 'pharmacy':
          ProviderModel = Pharmacy;
          break;
        case 'therapist':
          ProviderModel = Therapist;
          break;
        case 'laboratory':
          ProviderModel = Laboratory;
          break;
        default:
          return res.status(400).json({ message: 'Invalid provider type' });
      }
  
      const provider = await ProviderModel.findById(providerId).populate('prescriptions.prescription');
      if (!provider) {
        return res.status(404).json({ message: 'Provider not found' });
      }
  
      const prescriptionsWithDetails = provider.prescriptions.map(prescription => {
        return {
          ...prescription.prescription.toObject(),
          patientAddress: prescription.prescription.patientAddress,
          diagnosis: prescription.prescription.diagnosis,
          medicines: prescription.prescription.medicines,
          createdAt: prescription.prescription.createdAt
        };
      });
  
      res.status(200).json(prescriptionsWithDetails);
    } catch (error) {
      console.error('Failed to get prescriptions:', error);
      res.status(500).json({ message: error.message });
    }
  },

  
// Function to add costing details
addCosting: async (req, res) => {
  const { prescriptionId, amount } = req.body;
  const providerId = req.params.providerId;

  try {
    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

    const isAuthorized = await Laboratory.exists({ _id: providerId }) || await Pharmacy.exists({ _id: providerId });
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to add costing to this prescription' });
    }

    prescription.totalCost = amount;
    await prescription.save();

    const transaction = new Transaction({
      user: prescription.patient,
      doctor: prescription.doctor,
      prescription: prescriptionId,
      type: 'costing',
      status: 'pending',
      amount,
    });

    await transaction.save();
    res.status(200).json({ message: 'Costing added successfully', transaction });
  } catch (error) {
    console.error('Error adding costing:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
},
  
  


  // Function to get costing details for review
  getCostingDetails: async (req, res) => {
    const { prescriptionId } = req.params;
    const patientId = req.query.patientId; // Assuming patientId is passed as a query parameter

    try {
      // Find the prescription
      const prescription = await Prescription.findById(prescriptionId);
      if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

      

      // Find the related transaction
      const transaction = await Transaction.findOne({ prescription: prescriptionId });
      if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

      // Calculate the amount to be paid, including any admin fee
      const amount = transaction.amount;
      const adminFeePercentage = 0.05; // 5% admin fee
      const adminFee = amount * adminFeePercentage;
      const totalAmount = amount + adminFee; // Total amount to be paid

      res.status(200).json({
        message: 'Costing details fetched successfully',
        transaction: {
          amount,
          adminFee,
          totalAmount,
        },
      });
    } catch (error) {
      console.error('Error fetching costing details:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  // Function to approve costing
approveCosting: async (req, res) => {
  const { prescriptionId } = req.body;
  const patientId = req.params.patientId;

  try {
    const prescription = await Prescription.findById(prescriptionId);

    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

    // Check if the prescription has already been approved
    if (prescription.approved) {
      return res.status(400).json({ error: 'This prescription has already been approved.' });
    }

    const amount = prescription.totalCost;

    const transaction = await Transaction.findOne({ prescription: prescriptionId });
    if (transaction) {
      transaction.status = 'approved';
      await transaction.save();
    }

    let providerModel;
    switch (prescription.providerType) {
      case 'pharmacy':
        providerModel = Pharmacy;
        break;
      case 'laboratory':
        providerModel = Laboratory;
        break;
      default:
        return res.status(400).json({ message: 'Invalid provider type' });
    }

    const provider = await providerModel.findById(prescription.provider);
    if (!provider) return res.status(404).json({ message: 'Provider not found' });

    // Check user's balance
    const user = await User.findById(patientId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.walletBalance < amount) {
      return res.status(400).json({ balanceMessage: 'Insufficient balance' });
    }

    await calculateFeesAndTransfer(patientId, prescription.provider, amount, adminId);

    // Set the approved field to true
    prescription.approved = true;
    await prescription.save();

    res.status(200).json({ message: 'Costing approved successfully', transaction });
  } catch (error) {
    console.error('Error approving costing:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
},

  
uploadTestResult: async (req, res) => {
  try {
    const { patientId, testName } = req.body;
    const providerId = req.user._id;

    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Handle file upload
    if (!req.files || !req.files.testResult) {
      return res.status(400).json({ message: 'No test result file uploaded' });
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
    res.status(201).json({ message: 'Test result uploaded successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
},

  getTestResults: async (req, res) => {
    try {
      const patientId = req.params.patientId;
  
      const testResults = await TestResult.find({ patient: patientId })
        .populate('provider', 'username email')
        .sort({ date: -1 });
  
      res.status(200).json(testResults);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  },

  // Function to update the status of a prescription
  updatePrescriptionStatus: async (req, res) => {
    const { prescriptionId, status } = req.body;
    const providerId = req.params.providerId;

    if (!['approved', 'declined', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    try {
      const prescription = await Prescription.findById(prescriptionId);
      if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

      

      prescription.status = status;
      await prescription.save();

      // Handle transaction state if needed
      const transaction = await Transaction.findOne({ prescription: prescriptionId });
      if (transaction) {
        transaction.status = status === 'completed' ? 'success' : 'pending';
        await transaction.save();
      }

      res.status(200).json({ message: `Prescription ${status} successfully` });
    } catch (error) {
      console.error('Error updating prescription status:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
};

export default prescriptionController;
