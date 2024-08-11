import mongoose from 'mongoose';

const consultationSessionSchema = new mongoose.Schema({
  doctor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Doctor', 
    required: true 
  },
  doctorUser: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', // Reference to the User schema for isOnline status
     
  },
  patient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  startTime: { 
    type: Date, 
    required: true 
  },
  endTime: { 
    type: Date 
  },
  status: { 
    type: String, 
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'], 
    default: 'scheduled' 
  },
  escrowTransaction: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Transaction',
    required: false // This can be optional, depending on whether payment is required upfront
  },
  notes: {
    type: String, 
    required: false // Any notes or diagnosis from the session
  },
  prescription: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Prescription',
    required: false // Reference to a Prescription model if you have one
  }
}, {
  timestamps: true // Automatically manage createdAt and updatedAt timestamps
});

const ConsultationSession = mongoose.model('ConsultationSession', consultationSessionSchema);

export default ConsultationSession;
