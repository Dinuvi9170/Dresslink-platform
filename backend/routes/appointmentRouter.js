import express from 'express';
import { createAppointment, getUserAppointments, updateAppointmentStatus, cancelAppointment, provideMeetingId } from '../controller/appointmentController.js';
import authenticate from '../Middleware/authMiddleware.js';

const appointmentRouter = express.Router();

// Create a new appointment
appointmentRouter.post('/', authenticate, createAppointment);

// Get current user's appointments (for professional)
appointmentRouter.get('/user', authenticate, getUserAppointments);

// Update appointment status (for professionals)
appointmentRouter.patch('/status', authenticate, updateAppointmentStatus);

// Cancel an appointment
appointmentRouter.patch('/:appointmentId/cancel', authenticate, cancelAppointment);

// Provide meeting details for an appointment
appointmentRouter.patch('/meeting', authenticate, provideMeetingId);

export default appointmentRouter;