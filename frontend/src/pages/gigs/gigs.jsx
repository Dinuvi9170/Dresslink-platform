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

  return (
    <div className="gig-detail-page">
      <div className="gig-left">
        <img src={gig.cover} alt="Gig Cover" />
        <div className="gig-info">
          <h1>{gig.title}</h1>
          <p className="category">{gig.category}</p>
          <p>{gig.description}</p>
          <p className="price">Rs. {gig.price.toFixed(2)}</p>
          <p className="rating">⭐ {averageRating.toFixed(1)} / 5</p>
        </div>

        <div className="gig-professional">
          <img src={gig.user.image} alt="User" />
          <div>
            <h3>{gig.user.fname} {gig.user.lname}</h3>
            <p>{gig.user.address.city}, {gig.user.address.district}</p>
          </div>
        </div>

        <div className="tailoring-info">
          <h3>Tailoring Details (Sri Lankan System)</h3>
          <ul>
            <li>🎽 Type: {gig.category === 'tailoring' ? 'Stitching / Alteration' : 'Designing'}</li>
            <li>🧵 Fabric Type: Custom selected during appointment</li>
            <li>📏 Measurement: Collected during scheduling or through profile</li>
            <li>🎨 Design: Client provided or custom suggested</li>
          </ul>
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
      </div>

      <div className="gig-right">
        <button className="btn appointment-btn">Schedule Appointment</button>
        <button className="btn chat-btn">Chat Now</button>
      </div>
    </div>
  );
};

export default Gigs;
