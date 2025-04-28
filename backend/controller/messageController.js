import Message from '../models/messagemodel.js';
import Conversation from '../models/conversationmodel.js';

// Get all messages for a specific conversation
export const getMessagesByConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get conversation to verify user is a participant
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Check if user is part of this conversation
    if (!conversation.participants.some(p => p.toString() === userId.toString())) {
      return res.status(403).json({ message: 'Not authorized to view these messages' });
    }

    // Get the participants to filter messages
    const participants = conversation.participants.map(p => p.toString());

    // Find messages where sender and receiver are both in the conversation participants
    const messages = await Message.find({
      $and: [
        { sender: { $in: participants } },
        { receiver: { $in: participants } }
      ]
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'username fname lname image')
    .populate('receiver', 'username fname lname image');

    const totalMessages = await Message.countDocuments({
      $and: [
        { sender: { $in: participants } },
        { receiver: { $in: participants } }
      ]
    });

    // Mark messages as read if current user is receiver
    await Message.updateMany(
      { 
        receiver: userId, 
        read: false,
        sender: { $in: participants }
      },
      { read: true }
    );

    // Reset unread count in conversation
    if (conversation.unreadCount > 0) {
      conversation.unreadCount = 0;
      await conversation.save();
    }

    res.status(200).json({
      messages,
      pagination: {
        total: totalMessages,
        pages: Math.ceil(totalMessages / limit),
        page,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};

// Send a new message
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, receiverId } = req.body;
    const senderId = req.user._id;

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Message content cannot be empty' });
    }

    let conversation;
    
    // If conversationId is provided, use existing conversation
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      
      // Check if sender is part of the conversation
      if (!conversation.participants.some(p => p.toString() === senderId.toString())) {
        return res.status(403).json({ message: 'Not authorized to send message in this conversation' });
      }
    } 
    // Otherwise, if receiverId is provided, find or create conversation
    else if (receiverId) {
      // Check if conversation exists
      conversation = await Conversation.findOne({
        participants: { $all: [senderId, receiverId] }
      });
      
      // If not, create new conversation
      if (!conversation) {
        conversation = new Conversation({
          participants: [senderId, receiverId],
          unreadCount: 1
        });
      } else {
        // Increment unread count
        conversation.unreadCount += 1;
      }
    } else {
      return res.status(400).json({ message: 'Either conversationId or receiverId is required' });
    }

    // Find receiver from conversation participants
    const receiver = conversation.participants.find(
      p => p.toString() !== senderId.toString()
    );

    // Create new message
    const newMessage = new Message({
      sender: senderId,
      receiver,
      content,
      read: false
    });

    const savedMessage = await newMessage.save();

    // Update conversation's lastMessage and save
    conversation.lastMessage = savedMessage._id;
    await conversation.save();

    // Return populated message
    const populatedMessage = await Message.findById(savedMessage._id)
      .populate('sender', 'username fname lname image')
      .populate('receiver', 'username fname lname image');

    res.status(201).json({
      message: populatedMessage,
      conversationId: conversation._id
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

// Mark message as read
export const markMessageAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: 'Invalid message ID' });
    }

    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the receiver
    if (message.receiver.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to mark this message as read' });
    }

    // Mark as read if not already
    if (!message.read) {
      message.read = true;
      await message.save();
    }

    res.status(200).json({ message: 'Message marked as read', success: true });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'Failed to update message' });
  }
};

// Get unread message count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const unreadCount = await Message.countDocuments({
      receiver: userId,
      read: false
    });

    res.status(200).json({ unreadCount });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Failed to get unread count' });
  }
};

// Delete a message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: 'Invalid message ID' });
    }

    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only the sender can delete their message
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    await Message.findByIdAndDelete(messageId);

    // If this was the last message in a conversation, update lastMessage
    const conversations = await Conversation.find({
      lastMessage: messageId
    });

    for (const conversation of conversations) {
      const participants = conversation.participants;
      
      // Find the latest message in this conversation
      const latestMessage = await Message.findOne({
        sender: { $in: participants },
        receiver: { $in: participants },
        _id: { $ne: messageId } // Exclude the deleted message
      }).sort({ createdAt: -1 });

      if (latestMessage) {
        conversation.lastMessage = latestMessage._id;
      } else {
        conversation.lastMessage = null;
      }
      
      await conversation.save();
    }

    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Failed to delete message' });
  }
};