import mongoose from 'mongoose';

const ProfessionalProfileSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  professionalType: {
    type: String,
    enum:['designer','tailor'],
    required: true,
  },
  bio: {
    type: String,
  },
  portpolioImages:{type: String},
  yearsOfExperience: { type: Number },
  rating: { type: Number, default: 0 },

});

const ProfessionalProfile= mongoose.model('ProfessionalProfile',ProfessionalProfileSchema);
export default ProfessionalProfile;