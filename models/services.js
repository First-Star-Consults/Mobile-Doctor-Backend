//servicesSchema.js
import mongoose from "mongoose";



// Consultation schema
const consultationSchema = new mongoose.Schema({
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: { type: String },
    prescription: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
  });
  
  // Prescription schema
  const prescriptionSchema = new mongoose.Schema({
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    medicines: [{ name: String, dosage: String }],
  });
  
  // Review schema
  const reviewSchema = new mongoose.Schema({
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, required: true },
    comment: { type: String },
  });



const Consultation = new mongoose.model("Consultation", consultationSchema);
const Prescription = new mongoose.model("Prescription", prescriptionSchema);
const Review = new mongoose.model("Review", reviewSchema);



export {Consultation, Prescription, Review};