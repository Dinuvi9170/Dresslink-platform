import express from 'express';
import { getMessagesByConversation, sendMessage, markMessageAsRead,getUnreadCount,deleteMessage } from '../controller/messageController.js';
import authenticate from '../Middleware/authMiddleware.js';

const messageRouter = express.Router();

// Get messages by conversation ID
messageRouter.get('/:conversationId', authenticate, getMessagesByConversation);

// Send a new message
messageRouter.post('/', authenticate, sendMessage);

// Mark a message as read
messageRouter.patch('/:messageId/read', authenticate, markMessageAsRead);

// Get unread message count
messageRouter.get('/unread-count', authenticate, getUnreadCount);

// Delete a message
messageRouter.delete('/:messageId', authenticate, deleteMessage);

export default messageRouter;