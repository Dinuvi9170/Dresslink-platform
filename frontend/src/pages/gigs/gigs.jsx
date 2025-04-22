import React, { useState, useEffect } from 'react';
import "./gigs.css";

const images = [
  "/images/tailoring.png",
  "/images/fitting preview.png",
  "/images/tailoring.png"
];

const Gigs = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000); 

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{color:"black"}} className="gigs">
      <div className="container">
        <div className="gigs_left">
          <h1>Hi..</h1>
          <div className="user">
            <img
              src="https://images.unsplash.com/photo-1502685104226-e9df14d4d9f2?auto=format&fit=crop&w=500&q=60"
              alt="user"
              className="user_img"
            />
            <span className="text1">name</span>
            <div className="user_rating">
              <img src="https://example.com/star.png" alt="star" className="star_img" />
              <img src="https://example.com/star.png" alt="star" className="star_img" />
              <img src="https://example.com/star.png" alt="star" className="star_img" />
              <img src="https://example.com/star.png" alt="star" className="star_img" />
              <span className="user_star">4</span>
            </div>
          </div>

          <div className="custom_slider">
            <img src={images[currentIndex]} alt="slider" className="slider_img" />
          </div>

          <h2 className="gigs_title">About Gig</h2>
          <p className="gigs_desc">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio vitae
            vestibulum...
          </p>
        </div>
        <div className="gigs_right">

        </div>
      </div>
    </div>
  );
};

export default Gigs;
