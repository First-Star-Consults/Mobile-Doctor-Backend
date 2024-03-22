// healthProviders.js
import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
  type: {
    type: String,
    default: "Point",
    enum: ["Point"] // 'location.type' must be 'Point'
  },
  coordinates: {
    type: [Number], // Array of numbers for longitude and latitude
    index: "2dsphere"
  }
});







// Doctor schema
const doctorSchema = new mongoose.Schema({
    fullName: { type: String, default: null },
    medicalOfficer: { type: Boolean, default: false },
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Reviews' }],
    approval: { type: Boolean, default: false },
    onlineStatus: { type: Boolean, default: true },
    baseConsultationFee: { type: Number, default: 1000 },
    medicalSpecialty: [{
      name: { type: String },
      fee: { type: Number, default: 3000 }
  }],
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
    kycVerification: { type: Boolean, default: false },
    location: locationSchema,
});

// Therapist schema
const therapistSchema = new mongoose.Schema({
    name: { type: String, required: true },
    kycVerification: { type: Boolean, default: false },
    location: locationSchema,
});

// Laboratory schema
const laboratorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: locationSchema,
});

const Doctor = mongoose.model("Doctor", doctorSchema);
const Pharmacy = mongoose.model("Pharmacy", pharmacySchema);
const Therapist = mongoose.model("Therapist", therapistSchema);
const Laboratory = mongoose.model("Laboratory", laboratorySchema);

export { Doctor, Pharmacy, Therapist, Laboratory };
