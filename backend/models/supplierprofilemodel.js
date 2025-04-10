import mongoose from 'mongoose';

const SupplierProfileSchema= mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    ShopName:{
        type: String,
        required: true,
    },
    shopDescription:{
        type: String,
    },
    materialOffered:{
        type: String,
    },
    rating:{
        type: Number,
        default: 0,
    },
    contactInfo:{
        type: String,
    },
    shopImages:{
        type: String,
    },
});
const SupplierProfile= mongoose.model('SupplierProfile',SupplierProfileSchema);
export default SupplierProfile;