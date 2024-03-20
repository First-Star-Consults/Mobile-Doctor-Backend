//services.js
import mongoose from "mongoose";



// Consultation schema
// const consultationSchema = new mongoose.Schema({
//   doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
//   patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//   message: { type: String },
//   prescription: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
// });

const prescriptionSchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  medicines: [{
    name: { type: String, required: true },
    dosage: { type: String, required: true }
  }],
});


// Review schema
const reviewSchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rating: { type: Number },
  comment: { type: String },
});


// transaction history
const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: false }, // Reference to the Doctor
  consultationSession: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation', required: false }, // Optional, if you have a consultation model
  type: { type: String, required: true }, // e.g., 'payout', 'consultation fee'
  status: { type: String, required: true }, // e.g., 'pending', 'success', 'failed'
  escrowStatus: { type: String, enum: ['held', 'released', 'refunded'], default: null }, // Handles escrow state
  amount: { type: Number, required: true },
  accountNumber: String,
  bankName: String,
  date: { type: Date, default: Date.now },
});




const Transaction = new mongoose.model('Transaction', transactionSchema);
// const Consultation = new mongoose.model("Consultation", consultationSchema);
const Prescription = new mongoose.model("Prescription", prescriptionSchema);
const Reviews = new mongoose.model("Reviews", reviewSchema);



export { Prescription, Reviews, Transaction};