import express from 'express';
import {getUserConversations, getConversationById, createOrGetConversation, updateConversation} from '../controller/conversationController.js';
import authenticate from '../Middleware/authMiddleware.js';

const conversationRouter = express.Router();
// Get all conversations for a user
conversationRouter.get('/',authenticate, getUserConversations);

// Get a single conversation by ID
conversationRouter.get('/:id',authenticate, getConversationById);

// Create a new conversation or get existing one
conversationRouter.post('/',authenticate, createOrGetConversation);

// Update a conversation 
conversationRouter.patch('/:id',authenticate, updateConversation);

export default conversationRouter;