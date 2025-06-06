import React, { useState, useEffect } from "react";
import './manageAppoints.css';
import axios from 'axios';
import { format } from "date-fns";
import { toast } from "react-toastify";

const ManageAppoints = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [error, setError] = useState(null);

    const handleSearch = () => {
        setSearchTerm(searchQuery);
    };

    // meeting functionality
    const [showMeetingModal, setShowMeetingModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [meetingLink, setMeetingLink] = useState("");
    const [meetingPassword, setMeetingPassword] = useState("");
    const [meetingNotes, setMeetingNotes] = useState("");

    // Fetch appointments from backend and handle auto-completion
    useEffect(() => {
        fetchAppointments();
        
        // Set up polling to periodically check for appointments that need auto-completion
        const interval = setInterval(() => {
            fetchAppointments();
        }, 5 * 60 * 1000); 
        
        return () => clearInterval(interval);
    }, []);

    // Fetch appointments and process them
    const fetchAppointments = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const token = localStorage.getItem("token");
            
            if (!token) {
                setError("You need to log in to view your appointments");
                setLoading(false);
                return;
            }
            
            const response = await axios.get("http://localhost:3000/appointments/user", {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            let appointmentsData = [];
            
            if (Array.isArray(response.data)) {
                appointmentsData = response.data;
            } else if (response.data && typeof response.data === 'object') {
                appointmentsData = response.data.appointments || [];
            }
            
            // Process appointments for auto-completion
            const currentDate = new Date();
            const processedAppointments = [];
            const autoCompletedIds = [];
            
            for (const appointment of appointmentsData) {
                // Make a copy to avoid mutating the original
                const updatedAppointment = { ...appointment };
                
                // Check if confirmed appointments should be auto-completed
                if (updatedAppointment.status === "confirmed") {
                    try {
                        // Create a proper date object from the appointment date and time
                        const appointmentDate = new Date(updatedAppointment.date);
                        const [hours, minutes] = updatedAppointment.time.split(':');
                        appointmentDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
                        
                        // If appointment time has passed, mark as completed
                        if (appointmentDate < currentDate) {
                            console.log('Appointment date:', appointmentDate);
                            console.log('Current date (modified):', currentDate);
                            console.log('Should complete:', appointmentDate < currentDate);

                            updatedAppointment.status = "completed";
                            autoCompletedIds.push(updatedAppointment._id);
                        }
                    } catch (err) {
                        console.error("Error parsing appointment date/time:", err);
                    }
                }
                
                processedAppointments.push(updatedAppointment);
            }
            
            // Update appointment statuses in the database
            if (autoCompletedIds.length > 0) {
                for (const appointmentId of autoCompletedIds) {
                    try {
                        await updateAppointmentStatus(appointmentId, "completed");
                    } catch (err) {
                        console.error(`Failed to auto-update appointment ${appointmentId}:`, err);
                    }
                }
                
                if (autoCompletedIds.length === 1) {
                    toast.info("1 appointment was automatically completed");
                } else {
                    toast.info(`${autoCompletedIds.length} appointments were automatically completed`);
                }
            }
            
            setAppointments(processedAppointments);
            
        } catch (error) {
            console.error("Error fetching appointments:", error);
            setError("Failed to load appointments. Please try again.");
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    };

    // Update appointment status in the backend
    const updateAppointmentStatus = async (appointmentId, newStatus) => {
        try {
            const token = localStorage.getItem("token");
            
            await axios.patch(`http://localhost:3000/appointments/status`, {
                appointmentId,
                status: newStatus
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            return true;
        } catch (error) {
            console.error("Error updating appointment status:", error);
            return false;
        }
    };

    // Handle manual status change
    const handleStatusChange = async (appointmentId, newStatus) => {
        try {
            const success = await updateAppointmentStatus(appointmentId, newStatus);
            
            if (success) {
                // Update local state to reflect the change
                setAppointments(prevAppointments => {
                    return prevAppointments.map(appointment => 
                        appointment._id === appointmentId 
                            ? { ...appointment, status: newStatus } 
                            : appointment
                    );
                });
                
                // Show success message
                let successMessage;
                switch(newStatus) {
                    case "confirmed":
                        successMessage = "Appointment confirmed successfully";
                        break;
                    case "completed":
                        successMessage = "Appointment marked as completed";
                        break;
                    case "cancelled":
                        successMessage = "Appointment cancelled";
                        break;
                    case "pending":
                        successMessage = "Appointment restored to pending";
                        break;
                    default:
                        successMessage = "Appointment status updated";
                }
                
                toast.success(successMessage);
            } else {
                toast.error("Failed to update appointment status");
            }
                          
        } catch (error) {
            console.error("Error handling status change:", error);
            toast.error("Failed to update appointment status");
        }
    };

    // Format date for display
    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), "PPP");
        } catch (error) {
            return "Invalid date";
        }
    };
    
    // Check if appointment should be auto-completed
    const shouldAutoComplete = (appointment) => {
        if (appointment.status !== "confirmed") return false;
        
        try {
            const appointmentDate = new Date(appointment.date);
            if (isNaN(appointmentDate.getTime())) {
                return false;
            }
            const [hours, minutes] = appointment.time.split(':');
            appointmentDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));

            return appointmentDate < new Date();
        } catch (error) {
            return false;
        }
    };

    // Filter appointments based on status and search term
    const filteredAppointments = Array.isArray(appointments) 
        ? appointments.filter(appointment => {
            const matchesFilter = filter === "all" || appointment.status === filter;
            
            const matchesSearch = !searchTerm || 
                (appointment.user?.fname?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                (appointment.user?.lname?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                (appointment.gig?.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
            
            return matchesFilter && matchesSearch;
        })
        : [];

    // Get counts for each status
    const getStatusCount = (status) => {
        if (!Array.isArray(appointments)) return 0;
        return appointments.filter(appointment => 
            status === "all" ? true : appointment.status === status
        ).length;
    };

    // Function to open the meeting modal
    const openMeetingModal = (appointment) => {
        setSelectedAppointment(appointment);
        
        // Pre-fill with existing meeting details
        if (appointment.meetingDetails) {
            setMeetingLink(appointment.meetingDetails.link || '');
            setMeetingPassword(appointment.meetingDetails.password || '');
            setMeetingNotes(appointment.meetingDetails.notes || '');
        } else {
            setMeetingLink('');
            setMeetingPassword('');
            setMeetingNotes('');
        }
        
        setShowMeetingModal(true);
    };

    // Function to save meeting details
    const handleSaveMeeting = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.patch(
                "http://localhost:3000/appointments/meeting",
                {
                    appointmentId: selectedAppointment._id,
                    meetingLink,
                    meetingPassword,
                    meetingNotes
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            
            // Update local state
            setAppointments(prevAppointments => {
                return prevAppointments.map(appointment => 
                    appointment._id === selectedAppointment._id 
                        ? { ...appointment, meetingDetails: {
                            link: meetingLink,
                            password: meetingPassword,
                            notes: meetingNotes
                          }} 
                        : appointment
                );
            });
            
            setShowMeetingModal(false);
            toast.success("Meeting details saved successfully");
        } catch (error) {
            console.error("Error saving meeting details:", error);
            toast.error("Failed to save meeting details");
        }
    };

    // Modal close handler
    const handleCloseModal = () => {
        setShowMeetingModal(false);
    };

    return (
        <div className="appointments-manager">
            <div className="appointments-header">
                <h1>Manage Appointments</h1>
                <p>View and manage your client appointments</p>
                <p className="auto-complete-info">
                    <i className="info-icon">ℹ️</i>
                    Confirmed appointments are automatically marked as completed after their scheduled time
                </p>
            </div>
            
            <div className="appointments-controls">
                <div className="status-filters">
                    <div 
                        className={`status-filter ${filter === "all" ? "active" : ""}`}
                        onClick={() => setFilter("all")}
                    >
                        <span className="filter-name">All</span>
                        <span className="filter-count">{getStatusCount("all")}</span>
                    </div>
                    <div 
                        className={`status-filter ${filter === "pending" ? "active" : ""}`}
                        onClick={() => setFilter("pending")}
                    >
                        <span className="filter-name">Pending</span>
                        <span className="filter-count">{getStatusCount("pending")}</span>
                    </div>
                    <div 
                        className={`status-filter ${filter === "confirmed" ? "active" : ""}`}
                        onClick={() => setFilter("confirmed")}
                    >
                        <span className="filter-name">Confirmed</span>
                        <span className="filter-count">{getStatusCount("confirmed")}</span>
                    </div>
                    <div 
                        className={`status-filter ${filter === "completed" ? "active" : ""}`}
                        onClick={() => setFilter("completed")}
                    >
                        <span className="filter-name">Completed</span>
                        <span className="filter-count">{getStatusCount("completed")}</span>
                    </div>
                    <div 
                        className={`status-filter ${filter === "cancelled" ? "active" : ""}`}
                        onClick={() => setFilter("cancelled")}
                    >
                        <span className="filter-name">Cancelled</span>
                        <span className="filter-count">{getStatusCount("cancelled")}</span>
                    </div>
                </div>

                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Search by client or service..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSearch();
                            }
                        }}
                    />
                    <button 
                        className="search-button"
                        onClick={() => handleSearch()}
                    >
                        Search
                    </button>
                    {searchQuery && (
                        <button 
                            className="clear-search"
                            onClick={() => setSearchQuery("")}
                        >
                        ✕
                        </button>
                    )}
                </div>
            </div>

            

            {/* Loading state */}
            {loading && (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading appointments...</p>
                </div>
            )}

            {/* Error state */}
            {!loading && error && (
                <div className="error-container">
                    <p>{error}</p>
                    <button onClick={fetchAppointments} className="retry-button">
                        Try Again
                    </button>
                </div>
            )}

            {/* Empty state */}
            {!loading && !error && filteredAppointments.length === 0 && (
                <div className="empty-state">
                    {searchTerm || filter !== "all" ? (
                        <>
                            <h3>No matching appointments</h3>
                            <p>Try adjusting your search or filters</p>
                            <button 
                                className="clear-filters-button"
                                onClick={() => {
                                 setSearchTerm("");
                                 setFilter("all");
                             }}
                         >
                             Clear Filters
                            </button>
                        </>
                    ) : (
                        <>
                            <h3>No appointments yet</h3>
                            <p>When clients book appointments with you, they'll appear here</p>
                        </>
                    )}
                </div>
            )}

            {/* Appointments list */}
            {!loading && !error && filteredAppointments.length > 0 && (
                <div className="appointments-list">
                    {filteredAppointments.map((appointment) => (
                        <div
                            key={appointment._id}
                            className={`appointment-card ${appointment.status}`}
                        >
                            {/* Status badge */}
                            <div className="appointment-status">
                                <span className={`status-badge ${appointment.status}`}>
                                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                </span>
                                
                                {/* Show auto-completion indicator if applicable */}
                                {appointment.status === "confirmed" && shouldAutoComplete(appointment) && (
                                    <span className="auto-complete-badge">
                                        Auto-completing soon
                                    </span>
                                )}
                            </div>

                            {/* Client info */}
                            <div className="client-info">
                                <h3>Client: 
                                     {appointment.user ? 
                                        ` ${appointment.user.fname} ${appointment.user.lname}` : 
                                        "Client"}
                                </h3>
                            </div>

                            {/* Service info */}
                            <div className="service-info">
                                <h4>{appointment.gig?.title || "Service"}</h4>
                            </div>

                            {/* Date and time */}
                            <div className="appointment-datetime">
                                <div className="appointment-date">
                                    {formatDate(appointment.date)}
                                </div>
                                <div className="appointment-time">
                                    {appointment.time}
                                </div>
                            </div>

                            {/* Notes */}
                            {appointment.notes && (
                                <div className="appointment-notes">
                                    <p>{appointment.notes}</p>
                                </div>
                            )}

                            {/* Meeting details */}
                            {appointment.status === "confirmed" && appointment.meetingDetails && (
                                <div className="meeting-details">
                                    <h4>Meeting Details</h4>
                                    <p><strong>Link:</strong> <a href={appointment.meetingDetails.link} target="_blank" rel="noopener noreferrer">{appointment.meetingDetails.link}</a></p>
                                    {appointment.meetingDetails.password && <p><strong>Password:</strong> {appointment.meetingDetails.password}</p>}
                                    {appointment.meetingDetails.notes && <p><strong>Notes:</strong> {appointment.meetingDetails.notes}</p>}
                                </div>
                            )}

                            {/* Action buttons based on current status */}
                            <div className="appointment-actions">
                                {appointment.status === "pending" && (
                                    <>
                                        <button 
                                            className="confirm-button"
                                            onClick={() => handleStatusChange(appointment._id, "confirmed")}
                                        >
                                            Confirm Appointment
                                        </button>
                                        <button 
                                            className="cancel-button"
                                            onClick={() => handleStatusChange(appointment._id, "cancelled")}
                                        >
                                            Cancel
                                        </button>
                                    </>
                                )}
                                
                                {appointment.status === "confirmed" && (
                                    <>
                                        <button 
                                            className="meeting-button"
                                            onClick={() => openMeetingModal(appointment)}
                                        >
                                            {appointment.meetingDetails ? "Edit Meeting Link" : "Add Meeting Link"}
                                        </button>
                                        <button 
                                            className="complete-button"
                                            onClick={() => handleStatusChange(appointment._id, "completed")}
                                        >
                                            Mark Complete
                                        </button>
                                        <button 
                                            className="cancel-button"
                                            onClick={() => handleStatusChange(appointment._id, "cancelled")}
                                        >
                                            Cancel
                                        </button>
                                    </>
                                )}
                                
                                {appointment.status === "cancelled" && (
                                    <button 
                                        className="restore-button"
                                        onClick={() => handleStatusChange(appointment._id, "pending")}
                                    >
                                        Restore to Pending
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Meeting Modal */}
            {showMeetingModal && (
                <div className="modal-overlay">
                    <div className="meeting-modal">
                        <div className="modal-header">
                            <h2>{selectedAppointment?.meetingDetails ? "Edit Meeting Details" : "Add Meeting Details"}</h2>
                            <button 
                                className="close-modal-btn"
                                onClick={handleCloseModal}
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="form-group">
                                <label htmlFor="meetingLink">Meeting Link</label>
                                <input 
                                    id="meetingLink"
                                    type="url" 
                                    value={meetingLink}
                                    onChange={(e) => setMeetingLink(e.target.value)}
                                    placeholder="https://zoom.us/j/123456789"
                                    className="form-input"
                                    required
                                />
                                <small className="form-text">
                                    Enter your Zoom, Google Meet, or other video meeting URL
                                </small>
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="meetingPassword">Meeting Password (Optional)</label>
                                <input 
                                    id="meetingPassword"
                                    type="text"
                                    value={meetingPassword}
                                    onChange={(e) => setMeetingPassword(e.target.value)}
                                    placeholder="Enter meeting password if required"
                                    className="form-input"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="meetingNotes">Additional Instructions (Optional)</label>
                                <textarea 
                                    id="meetingNotes"
                                    rows="3"
                                    value={meetingNotes}
                                    onChange={(e) => setMeetingNotes(e.target.value)}
                                    placeholder="Any additional instructions for joining the meeting"
                                    className="form-textarea"
                                ></textarea>
                            </div>
                        </div>
                        
                        <div className="modal-footer">
                            <button 
                                className="cancel-button"
                                onClick={handleCloseModal}
                            >
                                Cancel
                            </button>
                            <button 
                                className="save-button"
                                onClick={handleSaveMeeting}
                                disabled={!meetingLink}
                            >
                                Save Meeting Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageAppoints;
