import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
  fname: {
    type: String,
    required: true,
  },
  lname: {
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
    type: String,
    enum:['customer','professional','supplier'],
    required: true,
    default: 'customer',
  },
  image: {
        type: String,
        required: false,
        default:'https://avatar.iran.liara.run/public/boy?username=Ash',
  },
    createdAt:{
        type: Date,
        default: Date.now,
    }
});

const User= mongoose.model('User', userSchema);
export default User;