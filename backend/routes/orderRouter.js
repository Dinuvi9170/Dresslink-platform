import express from 'express';
import authenticate  from '../Middleware/authMiddleware.js';
import {
  createOrder,
  getOrderById,
  getClientOrders,
  addInitialReview,
  getProfessionalOrders,
  cancelOrder,
  addFeedback
} from '../controller/orderController.js';

const orderrouter = express.Router();

// Create a new order
orderrouter.post('/', authenticate, createOrder);

// Get order by ID
orderrouter.get('/:id', authenticate, getOrderById);

// Get all orders for logged-in client
orderrouter.get('/client/orders', authenticate, getClientOrders);

// Get all orders for logged-in professional
orderrouter.get('/professional/orders', authenticate, getProfessionalOrders);

// Update order status (professional only)
//router.put('/:id/status', protect, updateOrderStatus);

// Add deliverable to order (professional only)
//router.post('/:id/deliverables', protect, addDeliverable);

// Cancel an order (client only)
orderrouter.put('/:id/cancel', authenticate, cancelOrder);

// Add feedback (client only)
orderrouter.post('/:id/feedback', authenticate, addFeedback);

// Add initial review route
orderrouter.post('/:id/initial-review', authenticate, addInitialReview);
export default orderrouter;