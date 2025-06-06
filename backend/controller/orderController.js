import Order from '../models/ordermodel.js';
import Gig from '../models/gig.js';

// Create new order
const createOrder = async (req, res) => {
  const {
    professionalId,
    gigId,
    jobDescription,
    budget,
    deadline,
    additionalRequirements,
    serviceName,
    paymentProof
  } = req.body;

  // Validate required fields
  if (!professionalId || !gigId || !jobDescription || !budget || !deadline || !paymentProof) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  try {
    // Create the order record
    const order = await Order.create({
      client: req.user._id, 
      professional: professionalId,
      gig: gigId,
      jobDescription,
      budget: parseFloat(budget),
      deadline: new Date(deadline),
      additionalRequirements: additionalRequirements || '',
      serviceName,
      paymentProof
    });

    // Send response with created order
    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Error creating order: ${error.message}`);
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('client', 'fname lname email image')
    .populate('professional', 'fname lname email image')
    .populate('gig', 'title description cover price');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if user is authorized to view this order
  if (
    order.client._id.toString() !== req.user._id.toString() && 
    order.professional._id.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to access this order');
  }

  res.status(200).json(order);
};

//  Get all orders for logged-in client
const getClientOrders = async (req, res) => {
  const orders = await Order.find({ client: req.user._id })
    .sort({ createdAt: -1 })
    .populate('professional', 'fname lname image')
    .populate('gig', 'title cover price');

  res.status(200).json(orders);
};

//  Get all orders for logged-in professional
const getProfessionalOrders = async (req, res) => {
  const orders = await Order.find({ professional: req.user._id })
    .sort({ createdAt: -1 })
    .populate('client', 'fname lname image')
    .populate('gig', 'title cover price');

  res.status(200).json(orders);
};

// Add review 
const addInitialReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    // Find the order
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if the user is the client
    if (order.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to add review to this order' });
    }
    
    // Add the initial review
    order.initialReview = {
      rating,
      comment: comment || '',
      givenAt: new Date()
    };
    
    await order.save();
    
    res.status(200).json({
      success: true,
      message: 'Initial review added successfully',
      order
    });
  } catch (error) {
    console.error('Error adding initial review:', error);
    res.status(500).json({ 
      message: 'Server error while adding initial review',
      error: error.message 
    });
  }
};
//  Cancel an order (client only, if status is pending)
const cancelOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if user is the client for this order
  if (order.client.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to cancel this order');
  }

  // Check if order is in a cancellable state 
  if (order.status !== 'pending') {
    res.status(400);
    throw new Error('Cannot cancel order that is already in progress or completed');
  }

  // Update the status
  order.status = 'cancelled';
  order.cancelledAt = new Date();
  
  const updatedOrder = await order.save();
  
  res.status(200).json({
    success: true,
    message: 'Order cancelled successfully',
    order: updatedOrder
  });
};

const addFeedback = async (req, res) => {
  const { rating, comment } = req.body;
  
  if (!rating || rating < 1 || rating > 5) {
    res.status(400);
    throw new Error('Rating must be between 1 and 5');
  }

  // Find the order
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if user is the client for this order
  if (order.client.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to add feedback to this order');
  }

  // Check if order is completed
  if (order.status !== 'completed') {
    res.status(400);
    throw new Error('Feedback can only be added to completed orders');
  }

  // Add feedback
  order.clientFeedback = {
    rating,
    comment: comment || '',
    givenAt: new Date()
  };
  
  const updatedOrder = await order.save();

  // Update the gig's rating 
  if (order.gig) {
    try {
      const gig = await Gig.findById(order.gig);
      if (gig) {
        gig.totalStars = (gig.totalStars || 0) + rating;
        gig.starNumber = (gig.starNumber || 0) + 1;
        await gig.save();
      }
    } catch (error) {
      console.error('Error updating gig rating:', error);
    }
  }
  
  res.status(200).json({
    success: true,
    message: 'Feedback added successfully',
    order: updatedOrder
  });
};

export {
  createOrder,
  getOrderById,
  getClientOrders,
  getProfessionalOrders,
  addInitialReview,
  cancelOrder,
  addFeedback
};