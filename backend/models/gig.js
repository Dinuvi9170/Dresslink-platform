import mongoose from 'mongoose';

const gigSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    category:{
        type:String,
        required:true,
    },
    images:[
        {
            type:String,
            required:true,
        }
    ],
    createdAt:{
        type: Date,
        default: Date.now,
    }
});
const Gig = mongoose.model('Gig', gigSchema);
export default Gig;