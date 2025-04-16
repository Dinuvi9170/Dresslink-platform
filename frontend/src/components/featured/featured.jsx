import React from 'react';
import "./featured.css";
import { useNavigate } from "react-router-dom";


const Featured = () => {

  const navigate = useNavigate();
  const handleExplore=() => {
    navigate("/professionals");
  }
  
  return (
    <div className="featured">
        <div className='left'>
            <h1>Find the Right Hands for Your Threads</h1>
            <p>Discover skilled tailoring professionals to bring your vision to life.</p>
            <button className='btn' onClick={handleExplore}>Explore Now</button>
        </div>
        <div className='right'>
          <img src="#" alt="featured" className='featured-img' />
           
        </div>    
    </div>
  );
}
export default Featured;