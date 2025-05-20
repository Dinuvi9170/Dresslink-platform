import mongoose from 'mongoose';

const orderSchema = mongoose.Schema({
  // Client who placed the order
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Professional who will fulfill the order
  professional: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Related gig
  gig: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gig',
    required: true
  },
  
  // Service details
  serviceName: {
    type: String,
    required: true
  },
  
  jobDescription: {
    type: String,
    required: true
  },
  
  budget: {
    type: Number,
    required: true
  },
  
  deadline: {
    type: Date,
    required: true
  },
  
  additionalRequirements: {
    type: String,
    required: false,
    default: ''
  },
  
  // Payment information
  paymentProof: {
    type: String, 
    required: true
  },

  initialReview: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String
    },
    givenAt: {
      type: Date
    }
  },
  
  // Timestamps with mongoose schema options
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});
const Order = mongoose.model('Order',orderSchema)
export default Order;