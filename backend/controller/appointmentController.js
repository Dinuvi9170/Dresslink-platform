import Appointment from '../models/appointment.js';
import Gig from '../models/gig.js';

// Create a new appointment
export const createAppointment = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated || !req.user || !req.user._id) {
      return res.status(401).json({ message: 'You must be logged in to schedule an appointment' });
    }

    const { gigId, date, time, notes } = req.body;

    // Find the gig to get professional information
    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({ message: 'Gig not found' });
    }

    // Create new appointment
    const appointment = new Appointment({
      user: req.user._id, 
      professional: gig.user, 
      gig: gigId,
      date,
      time,
      notes: notes || '',
      status: 'pending',
    });

    await appointment.save();
    res.status(201).json({ 
      success: true, 
      message: 'Appointment scheduled successfully',
      appointment
    });

  } catch (error) {
    console.error('Error scheduling appointment:', error);
    res.status(500).json({ message: 'Failed to schedule appointment', error: error.message });
  }
};

// Get appointments for the current user 
export const getUserAppointments = async (req, res) => {
  try {
    if (!req.isAuthenticated || !req.user || !req.user._id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { role } = req.user;
    let query = {};

    // If customer, find appointments they booked
    // If professional, find appointments booked with them
    if (role === 'customer') {
      query.user = req.user._id;
    } else if (role === 'professional') {
      query.professional = req.user._id;
    }

    const appointments = await Appointment.find(query)
      .populate('gig', 'title category price cover')
      .populate('professional', 'fname lname image')
      .populate('user', 'fname lname image')
      .sort({ date: 1, time: 1 });

    res.status(200).json(appointments);
    
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Failed to fetch appointments', error: error.message });
  }
};

// Update appointment status
export const updateAppointmentStatus = async (req, res) => {
  try {
    if (!req.isAuthenticated || !req.user || !req.user._id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { appointmentId, status } = req.body;
    
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Only allow professional to update status or admin
    if (req.user.role !== 'admin' && 
        appointment.professional.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this appointment' });
    }

    appointment.status = status;
    await appointment.save();

    res.status(200).json({ 
      success: true, 
      message: 'Appointment status updated successfully',
      appointment 
    });
    
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ message: 'Failed to update appointment status', error: error.message });
  }
};

// Cancel appointment
export const cancelAppointment = async (req, res) => {
  try {
    if (!req.isAuthenticated || !req.user || !req.user._id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { appointmentId } = req.params;
    
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Allow cancellation by customer or professional
    if (appointment.user.toString() !== req.user._id.toString() && 
        appointment.professional.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    res.status(200).json({ 
      success: true, 
      message: 'Appointment cancelled successfully' 
    });
    
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ message: 'Failed to cancel appointment', error: error.message });
  }
};