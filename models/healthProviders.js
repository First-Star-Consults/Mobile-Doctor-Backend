// healthProviders.js
import mongoose from "mongoose";



// Doctor schema
const doctorSchema = new mongoose.Schema({
    fullName: { type: String, default: null },
    specialties: [{ type: String }],
    consultations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Consultation' }],
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Reviews' }],
    approval: { type: Boolean, default: false },
    onlineStatus: { type: Boolean, default: true },
    sessionToken: String,
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
    about: String,
    kycVerification: { type: Boolean, default: false },
    feedback: [{ 
      patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      comment: String,
      rating: { type: Number, min: 1, max: 5 }
  }],

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
