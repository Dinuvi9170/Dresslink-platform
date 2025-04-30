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
        type: [String],
        required:true,
    },
    materials:[{
        type: String,
        price: Number,
    }],
    cover:{
        type:String,
        required: true,
    },
    averagePrice:{
        type: Number,
    },
    contactInfo:{
        type: String,
    },
    title:{
        type:String,
        required:true,
    },
    shopImages:{
        type: String,
    },
});
const SupplierProfile= mongoose.model('SupplierProfile',SupplierProfileSchema);
export default SupplierProfile;