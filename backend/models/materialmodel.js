import mongoose from 'mongoose';

const MaterialSchema= mongoose.Schema({
    supplier:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'SupplierProfile',
    },
     name:{
        type: String,
        required: true,
    },
    type:{
        type: String,
        required: true,
    },
    price:{
        type: Number,
        required: true,
    },
    avaialbility:{
        type: Boolean,
        default: true,
    },
});
const Material= mongoose.model('Material',"MaterialSchema");
export default Material;