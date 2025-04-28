import Conversation from '../models/conversationmodel.js';
import User from '../models/usermodels.js';

// Get all conversations for current user
export const getUserConversations = async (req, res) => {
    try {
      const userId = req.user._id;
  
      const conversations = await Conversation.find({
        participants: userId
      })
      .populate('participants', 'username fname lname image')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });
  
      res.status(200).json(conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ message: 'Failed to fetch conversations' });
    }
};
  
// Get single conversation by ID
export const getConversationById = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user._id;
  
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid conversation ID' });
      }
  
      const conversation = await Conversation.findById(id)
        .populate('participants', 'username fname lname image')
        .populate('lastMessage');
  
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
  
      // Check if user is part of the conversation
      if (!conversation.participants.some(p => p._id.toString() === userId.toString())) {
        return res.status(403).json({ message: 'Not authorized to access this conversation' });
      }
  
      res.status(200).json(conversation);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      res.status(500).json({ message: 'Failed to fetch conversation details' });
    }
};
  
// Create a new conversation or get existing one
export const createOrGetConversation = async (req, res) => {
    try {
      const { participantId } = req.body;
      const currentUserId = req.user._id;
  
      // Validate user exists
      const participantExists = await User.findById(participantId);
      if (!participantExists) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Check if conversation already exists between these users
      let conversation = await Conversation.findOne({
        participants: { $all: [currentUserId, participantId] }
      }).populate('participants', 'username fname lname image');
  
      if (conversation) {
        return res.status(200).json(conversation);
      }
  
      // Create new conversation
      const newConversation = new Conversation({
        participants: [currentUserId, participantId],
        unreadCount: 0
      });
  
      await newConversation.save();
  
      // Populate user details before returning
      const populatedConversation = await Conversation.findById(newConversation._id)
        .populate('participants', 'username fname lname image');
  
      res.status(201).json(populatedConversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
      res.status(500).json({ message: 'Failed to create conversation' });
    }
};
  
// Update conversation (e.g., mark as read)
export const updateConversation = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user._id;
      const { unreadCount } = req.body;
  
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid conversation ID' });
      }
  
      const conversation = await Conversation.findById(id);
      
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
  
      // Ensure user is part of the conversation
      if (!conversation.participants.some(p => p.toString() === userId.toString())) {
        return res.status(403).json({ message: 'Not authorized to update this conversation' });
      }
  
      // Update unread count if provided
      if (unreadCount !== undefined) {
        conversation.unreadCount = unreadCount;
      }
  
      await conversation.save();
      res.status(200).json(conversation);
    } catch (error) {
      console.error('Error updating conversation:', error);
      res.status(500).json({ message: 'Failed to update conversation' });
    }
};