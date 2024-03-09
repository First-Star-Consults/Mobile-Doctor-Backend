import { Prescription, Consultation } from '../models/services.js';

const consultationController = {
  // Method for creating a prescription and saving it to the database
  prescriptions: async (req, res) => {
    try {
      const { doctorId, patientId, medicines } = req.body;
      const prescription = await Prescription.create({
        doctor: doctorId,
        patient: patientId,
        medicines
      });
      res.status(201).json(prescription);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Method for linking a prescription to a consultation
  linkPrescription: async (req, res) => {
    try {
      const { consultationId, prescriptionId } = req.params;
      const updatedConsultation = await Consultation.findByIdAndUpdate(consultationId, {
        prescription: prescriptionId
      }, { new: true }); // Ensure you get the updated document back
      res.status(200).json(updatedConsultation);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

export default consultationController;
