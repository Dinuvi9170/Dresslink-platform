import React, { useState, useEffect } from 'react';
import { useParams,useNavigate } from 'react-router-dom';
import axios from 'axios';
import "./scheduleAppoint.css";

const ScheduleAppoint = () => {
    const navigate = useNavigate();
    const {gigId} = useParams();
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");
    const [appointmentDetails, setAppointmentDetails] = useState(null);
    const [notes, setNotes] = useState("");
    const [gigDetails, setGigDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch gig details for displaying service info
    useEffect(() => {
        const fetchGigDetails = async () => {
            try {
                if (!gigId) {
                    setError("No service selected. Please go back and select a service.");
                    return;
                }
                
                const response = await axios.get(`http://localhost:3000/gigs/${gigId}`);
                setGigDetails(response.data);
            } catch (err) {
                console.error("Error fetching gig details:", err);
                setError("Failed to load service details. Please try again.");
            }
        };
        
        fetchGigDetails();
    }, [gigId]);
    
    const handleDateChange = (event) => {
        setSelectedDate(event.target.value);
    };
    
    const handleTimeChange = (event) => {
        setSelectedTime(event.target.value);
    };

    const handleNotesChange = (event) => {
        setNotes(event.target.value);
    };
    
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!selectedDate || !selectedTime) {
            alert('Please select both date and time.');
            return;
        } 
        setIsLoading(true);
        setError(null);

        try{
            // Get token from localStorage
            const token = localStorage.getItem('token');
            
            if (!token) {
                // Redirect to login if user is not authenticated
                alert('Please login to schedule an appointment.');
                navigate('/login');
                return;
            }
            
            // Format date and time for backend
            const formattedDate = selectedDate;
            
            // Make API call to create appointment
            const response = await axios.post('http://localhost:3000/appointments', 
                {
                    gigId,
                    date: formattedDate,
                    time: selectedTime,
                    notes
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            // Show success message
            setAppointmentDetails(`Appointment scheduled on ${selectedDate} at ${selectedTime}`);
            
            // Optionally redirect after a delay
            setTimeout(() => {
                navigate('/');
            }, 3000);
                                     
        }catch(err){
            console.error("Error scheduling appointment: ",err);
            if(err.response?.status===401){
                setError("Please login to schedule an appointment.");
                navigate('/login');
            }else{
                setError(err.response?.data?.message || "Failed to schedule appointment. Please try again.");
            }
        }finally{
            setIsLoading(false);
        }
    };

    // Calculate minimum date (today)
    const today = new Date().toISOString().split('T')[0];
    
    return (
        <div className="schedule-appoint-container">
        <h1>Book Your Appointment</h1>

        {gigDetails && (
            <div className="gig-summary">
                <img src={gigDetails.cover} alt={gigDetails.title} />
                <div className="gig-summary-details">
                    <h2>{gigDetails.title}</h2>
                    <p className="gig-category">{gigDetails.category}</p>
                    <p className="gig-price">Rs. {gigDetails.price.toFixed(2)}</p>
                    {gigDetails.user && (
                        <p className="gig-professional">
                            with {gigDetails.user.fname} {gigDetails.user.lname}
                        </p>
                    )}
                </div>
            </div>
        )}
        {error && <div className="error-message">{error}</div>}

        <form className='schedule' onSubmit={handleSubmit}>
            <label htmlFor="date">Select Date:</label>
            <input type="date" id="date" value={selectedDate} onChange={handleDateChange} min={today} required />
    
            <label htmlFor="time">Select Time:</label>
            <input type="time" id="time" value={selectedTime} onChange={handleTimeChange} required />

            <label htmlFor="notes">Additional Notes (optional):</label>
                <textarea id="notes" value={notes}onChange={handleNotesChange}
                    placeholder="Special requests or information for the professional"
                    rows="4"
                ></textarea>
    
            <button type="submit" disabled={isLoading}>{isLoading ? 'Scheduling...' : 'Schedule Appointment'}</button>
        </form>
    
        {appointmentDetails &&(
            <div className='success-message'>
                <p>{appointmentDetails}</p>
                <p>Redirecting to home page...</p>
            </div>    
        )}
        </div>
    );
    }
    export default ScheduleAppoint;