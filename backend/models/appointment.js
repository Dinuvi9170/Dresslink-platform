import mongoose from 'mongoose';

const appointmentSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    
  },
  professional: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    
  },
  gig: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Gig',
    
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String, 
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending',
  },
  notes: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;