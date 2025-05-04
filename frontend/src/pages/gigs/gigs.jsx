import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import "./gigs.css";

const Gigs = () => {
  const { gigId } = useParams();
  const navigate = useNavigate();
  const [gig, setGig] = useState(null);
  const[loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchGig = async () => {
      try {
        if(!gigId) {
          setError("Gig ID is missing.");
          setLoading(false);
          return;
        }
        setLoading(true);
        const res = await axios.get(`http://localhost:3000/gigs/${gigId}`);
        setGig(res.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching gig details:", err);
        setError("Failed to fetch gig details. Please try again later.");

        if(err.response && err.response.status===404){
          navigate('/professionals');
        }
      }finally{
        setLoading(false);
      }
    };
    if (gigId) {
      fetchGig();
    }

  }, [gigId]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!gig) return <div className="not-found">Gig not found</div>;

  const averageRating = gig.totalStars / (gig.starNumber || 1);

  const handleImageSelect = (img) => {
    setSelectedImage(img);
  };

  const handleScheduleAppointment = () => {
    navigate(`/scheduleAppoint/${gig._id}`);
  };

  const handleChatNow = () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
  
    if (!token) {
      // If not logged in, redirect to login page with return URL
      navigate('/login', { state: { from: `/gigs/${gigId}` } });
      return;
    }
  
    // Navigate to chat page with the professional's ID
    navigate(`/chatNow/${gig.user._id}`, { 
      state: { 
        professionalName: `${gig.user.fname} ${gig.user.lname}`,
        professionalImage: gig.user.image,
        gigTitle: gig.title
      } 
    });
  };


  return (
    <div className="gig-detail-page">
      <div className="gig-left">
        <h1>{gig.title}</h1>
        <img src={gig.cover} alt="Gig Cover" />
        <div className="gig-info">
          <p className="category">{gig.category}</p>
          <p className='gigs-desc'>
            {gig.description.replace(/\\n/g, '\n').split('\n').map((paragraph, i) => (
              <React.Fragment key={i}>
                {paragraph}
                <br />
              </React.Fragment>
            ))}
          </p>
        </div>

        <div className="gig-professional">
          <img src={gig.user.image} alt="User" />
          
          <p className="rating">⭐ {averageRating.toFixed(1)} / 5</p>
          <div>
            <h3>{gig.user.fname} {gig.user.lname}</h3>
            <p>{gig.user.address.city}, {gig.user.address.district}</p>
            <p className="price">Start from: Rs. {gig.price.toFixed(2)}</p>
          </div>
        </div>

        <div className="gig-images">
          <h3>My Work Showcase</h3>
          <p>Click on the images to view them in full size.</p>
        <div className="gig-main-image">
          {/* Display selected image or cover image if none selected */}
          <img 
            src={selectedImage || gig.cover} 
            alt={gig.title} 
            className="main-image" 
          />
        </div>

          {gig.images && gig.images.length > 0 && (
            <div className="gig-thumbnails">
              {/* Add cover as first image */}
              <div 
                className={`thumbnail ${selectedImage === gig.cover ? 'active' : ''}`} 
                onClick={() => handleImageSelect(gig.cover)}
              >
                <img src={gig.cover} alt="Cover" />
              </div>
            
              {/* Display additional images */}
              {gig.images.map((img, index) => (
                <div 
                  key={index} 
                  className={`thumbnail ${selectedImage === img ? 'active' : ''}`} 
                  onClick={() => handleImageSelect(img)}
                >
                  <img src={img} alt={`Image ${index + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div> 

         {/* Customer Reviews Section */}
        <div className="reviews-section">
          <h3>Customer Reviews</h3>
          <div className="reviews-summary">
            <div className="reviews-average">
              <span className="average-rating">{averageRating.toFixed(1)}</span>
              <div className="stars">
                {'★'.repeat(Math.round(averageRating))}
                {'☆'.repeat(5 - Math.round(averageRating))}
              </div>
              <span className="total-reviews">{gig.starNumber || 0} reviews</span>
            </div>
          </div>

          <div className="reviews-list">
            {gig.reviews && gig.reviews.length > 0 ? (
              gig.reviews.map((review, index) => (
                <div key={index} className="review-item">
                  <div className="review-header">
                    <img 
                      src={review.userImg || "https://avatar.iran.liara.run/public/boy?username=User"} 
                      alt={review.username || "User"} 
                      className="reviewer-img" 
                    />
                    <div className="reviewer-info">
                      <h4>{review.username || "Anonymous User"}</h4>
                      <div className="review-stars">
                        {'★'.repeat(review.star)}
                        {'☆'.repeat(5 - review.star)}
                      </div>
                      <p className="review-date">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className="review-text">{review.desc}</p>
                  {review.response && (
                    <div className="review-response">
                      <h5>Response from Professional:</h5>
                      <p>{review.response}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="no-reviews">No reviews yet. Be the first to review!</p>
            )}
          </div>
        </div>  
      </div>

      <div className="gig-right">
        <button className="btn appointment-btn" onClick={handleScheduleAppointment}>Schedule Appointment</button>
        <button className="btn chat-btn" onClick={handleChatNow}>Chat Now</button>
      </div>
    </div>

    
  );
};

export default Gigs;
