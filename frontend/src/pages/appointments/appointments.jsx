import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "./appointments.css";

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError("Please log in to view appointments");
          setUserLoading(false);
          return;
        }
        
        // Include the token in the request headers
        const response = await axios.get("http://localhost:3000/user/me", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setUser(response.data);
        setUserLoading(false);
      } catch (err) {
        console.error("Failed to load user data", err);
        setError("Failed to load user data. Please log in again.");
        setUserLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Format date to be more readable
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Fetch appointments - only client appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      if (userLoading) return; 
      
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Get only client appointments
        const response = await axios.get("http://localhost:3000/appointments/user", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // Make sure appointments is an array
        setAppointments(Array.isArray(response.data) ? response.data : []);
        setLoading(false);
      } catch (err) {
        setError("Failed to load your appointments");
        setLoading(false);
        toast.error("Could not load your appointments");
        console.error(err);
      }
    };

    fetchAppointments();
  }, [userLoading]);

  // Handle appointment cancellation
  const handleCancel = async (appointmentId) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      try {
        const token = localStorage.getItem('token');
        await axios.patch(`http://localhost:3000/appointments/${appointmentId}/cancel`, {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // Update local state
        setAppointments(appointments.map(apt => 
          apt._id === appointmentId ? {...apt, status: 'cancelled'} : apt
        ));
        
        toast.success("Appointment cancelled successfully");
      } catch (err) {
        toast.error("Failed to cancel appointment");
        console.error(err);
      }
    }
  };

  // Get status badge class based on status
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'pending': return 'badge-warning';
      case 'confirmed': return 'badge-success';
      case 'cancelled': return 'badge-danger';
      case 'completed': return 'badge-info';
      default: return 'badge-secondary';
    }
  };

  if (userLoading || loading) return <div className="appointments loading">Loading...</div>;
  if (error) return <div className="appointments error">{error}</div>;
  if (!user) return <div className="appointments error">Please log in to view appointments</div>;

  return (
    <div className="appointments-container">
      <h1>My Appointments</h1>
      
      {!Array.isArray(appointments) || appointments.length === 0 ? (
        <div className="no-appointments">
          <p>You don't have any appointments yet.</p>
          <p>Browse our services to book your first appointment!</p>
        </div>
      ) : (
        <div className="appointments-list">
          {appointments.map((appointment) => (
            <div key={appointment._id} className={`appointment-card ${appointment.status}`}>
              <div className="appointment-header">
                <span className={`status-badge ${getStatusBadgeClass(appointment.status)}`}>
                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                </span>
                <h3>{appointment.gig && appointment.gig.title}</h3>
              </div>

              <div className="appointment-details">
                <div className="appointment-info">
                  <p><strong>Date:</strong> {formatDate(appointment.date)}</p>
                  <p><strong>Time:</strong> {appointment.time}</p>
                  <p><strong>Service Provider:</strong> {appointment.professional?.fname} {appointment.professional?.lname}</p>
                  
                  {appointment.notes && (
                    <p><strong>Notes:</strong> {appointment.notes}</p>
                  )}
                  
                  {/* Show meeting details if confirmed */}
                  {appointment.status === 'confirmed' && appointment.meetingDetails && (
                    <div className="meeting-details">
                      <h4>Meeting Details</h4>
                      <p><strong>Link:</strong> <a href={appointment.meetingDetails.link} target="_blank" rel="noopener noreferrer">Join Meeting</a></p>
                      {appointment.meetingDetails.password && (
                        <p><strong>Password:</strong> {appointment.meetingDetails.password}</p>
                      )}
                      {appointment.meetingDetails.notes && (
                        <p><strong>Additional Info:</strong> {appointment.meetingDetails.notes}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="appointment-actions">
                  {/* Only show cancel button for pending or upcoming confirmed appointments */}
                  {(appointment.status === 'pending' || 
                    (appointment.status === 'confirmed' && new Date(appointment.date) > new Date())) && (
                    <button 
                      className="btn-cancel" 
                      onClick={() => handleCancel(appointment._id)}
                    >
                      Cancel Appointment
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Appointments;