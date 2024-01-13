// healthProviders.js
import mongoose from "mongoose";



// Doctor schema
const doctorSchema = new mongoose.Schema({
    specialties: [{ type: String }],
    consultations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Consultation' }],
    approval: { type: Boolean, default: false },
    images: {
      profilePhoto: { type: String },
      governmentIdfront: { type: String },
      governmentIdback: { type: String },
      workLicense: { type: String },
      qualificationCert: { type: String },
      educationQualification: { type: String },
    },
    registrationNumber: String,
    registrationYear: String,
    registrationCouncil: String,
    country: String,
    address: String,
    gender: String,
    aboutYourself: String,
  });
  

// Pharmacy schema
const pharmacySchema = new mongoose.Schema({
    name: { type: String, required: true },
});

// Therapist schema
const therapistSchema = new mongoose.Schema({
    name: { type: String, required: true },
});

// Laboratory schema
const laboratorySchema = new mongoose.Schema({
    name: { type: String, required: true },
});

const Doctor = mongoose.model("Doctor", doctorSchema);
const Pharmacy = mongoose.model("Pharmacy", pharmacySchema);
const Therapist = mongoose.model("Therapist", therapistSchema);
const Laboratory = mongoose.model("Laboratory", laboratorySchema);

export { Doctor, Pharmacy, Therapist, Laboratory };
