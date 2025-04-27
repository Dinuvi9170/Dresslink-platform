import React, { useState } from 'react';
import "./scheduleAppoint.css";

const ScheduleAppoint = () => {
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");
    const [appointmentDetails, setAppointmentDetails] = useState(null);
    
    const handleDateChange = (event) => {
        setSelectedDate(event.target.value);
    };
    
    const handleTimeChange = (event) => {
        setSelectedTime(event.target.value);
    };
    
    const handleSubmit = (event) => {
        event.preventDefault();
        if (selectedDate && selectedTime) {
        setAppointmentDetails(`Appointment scheduled on ${selectedDate} at ${selectedTime}`);
        } else {
        alert('Please select both date and time.');
        }
    };
    
    return (
        <div className="schedule-appoint-container">
        <h1>Book Your Appointment</h1>
        <form className='schedule' onSubmit={handleSubmit}>
            <label htmlFor="date">Select Date:</label>
            <input type="date" id="date" value={selectedDate} onChange={handleDateChange} required />
    
            <label htmlFor="time">Select Time:</label>
            <input type="time" id="time" value={selectedTime} onChange={handleTimeChange} required />
    
            <button type="submit">Schedule Appointment</button>
        </form>
    
        {appointmentDetails && <p>{appointmentDetails}</p>}
        </div>
    );
    }
    export default ScheduleAppoint;