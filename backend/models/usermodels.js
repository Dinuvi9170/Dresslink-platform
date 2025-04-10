import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: string,
    enum:['customer','professional','supplier','admin'],
    required: true,
  },
    image: {
        type: String,
    },
    createdAt:{
        type: Date,
        default: Date.now,
    }
});

const user= mongoose.model('User', userSchema);
export default user;