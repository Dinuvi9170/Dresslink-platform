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
        type: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        }
    }],
    cover:{
        type:String,
        required: true,
    },
    contactInfo:{
        mobile: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        whatsapp: {
            type: String
        }
    },
    title:{
        type:String,
        required:true,
    },
    shopImages:{
        type: [String],
        default: []
    },
});
const SupplierProfile= mongoose.model('SupplierProfile',SupplierProfileSchema);
export default SupplierProfile;