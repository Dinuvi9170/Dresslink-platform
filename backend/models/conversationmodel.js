import mongoose from "mongoose";   

const conversationSchema = new mongoose.Schema({
    participants: [
        {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
        }
    ],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    gigInfo: {
        gigId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Gig'
        },
        gigTitle: String
    },
    unreadCount: {
        type: Number,
        default: 0
    }
    }, { 
    timestamps: true 
    }
);
export default mongoose.model('Conversation', conversationSchema);

