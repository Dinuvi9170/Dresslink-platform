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
    totalStars:{
        type: Number,
        default: 0,
        required: false,
    },
    starNumber:{
        type: Number,
        default: 0,
        required: false,
    },
    price: {
        type: Number,
        required: true,
    },
    category:{
        type:String,
        enum:['tailoring','designing', 'Tailoring', 'Designing'],
        required:true,
    },
    cover:{
        type:String,
        required:true,
    },
    shorttitle:{
        type:String,
        required:true,
    },
    shortdesc:{
        type:String,
        required:true,
    },
    images:
        {
        type:[String],
        required:false,
        }
    ,
    services:[{
        type:{
            name:{
                type: String,
                required: true,
            },
            description:{
                type: String,
                required: true,
            },
            deliveryTime:{
                type: Number,
                required: true,
            },
            price:{
                type: Number,
                required: true,
            }
        },
        required: false,
        default:[]
    }],
    createdAt:{
        type: Date,
        default: Date.now,
    }
});
const Gig = mongoose.model('Gig', gigSchema);
export default Gig;