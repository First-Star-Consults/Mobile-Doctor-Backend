import MedicalRecord from "../models/medicalRecordModel.js";
import { upload } from "../config/cloudinary.js";

export const createMedicalReport = async (req, res) => {
  try {

    const { userId } = req.params;

    const { genotype, bloodGroup, maritalStatus, allergies, weight, others } =
      req.body;

    

    const medicalRecord = new MedicalRecord({
      user: userId,
      genotype,
      bloodGroup,
      maritalStatus,
      allergies,
      weight,
      others,
    });

    await medicalRecord.save();
    res.status(201).json({ message: "Medical report created successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMedicalReport = async (req, res) => {
  try {
    const { userId } = req.params;
    const medicalRecord = await MedicalRecord.findOne({ user: userId });
    res.json(medicalRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadTestResult = async (req, res) => {
  try {
    const { userId } = req.params;
    const { file, folderName } = req.body; // Using userId instead of medicalRecordId
    const uploadedFile = await upload(file, folderName);

    // Update the testReport field in the MedicalRecord schema
    await MedicalRecord.findOneAndUpdate(
      { user: userId },
      { $push: { testResults: uploadedFile.secure_url } },
      { new: true }
    );

    res.json({ url: uploadedFile.secure_url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTestResult = async (req, res) => {
    try {
      const { userId } = req.params; // Assuming userId is sent as a parameter in the request
  
      // Fetch medical records for the specified user and populate the 'user' field to get the username
      const medicalRecords = await MedicalRecord.find({ user: userId }).populate('user', 'username');
  
      // Extract testResults for the user
      const userTestResults = medicalRecords.map(record => ({
        username: record.user.username,
        testResults: record.testResults,
      }));
  
      res.json(userTestResults);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
