import React from 'react';
import "./featured.css";
import Tailoring from "../../assets/tailoring-image.png";
import Fit from "../../assets/fit-image.png";
import { useNavigate } from "react-router-dom";


const Featured = () => {

  const navigate = useNavigate();
  const handleExplore=() => {
    navigate("/professionals");
  }

  const handleTry=() => {
    navigate("/myfit");
  }
  
  return (
  <div>
    <div className="featured">
        <div className='left'>
            <h1>Find the Right Hands for Your Threads</h1>
            <p>Discover skilled tailoring professionals to bring your vision to life.</p>
            <button className='btn' onClick={handleExplore}>Explore Now</button>
        </div>
        <div className='right'>
          <img src={Tailoring} alt="featured" className='featured-img' />
           
        </div>    
    </div>

    <div className="featured1">
        <div className='left'>
            <h1>Try Before You Tie the Thread</h1>
            <p>Visualize your perfect fit with our interactive 2D model preview. Style confidently and see how your design comes to life before stitching begins.</p>
            <button className='btn' onClick={handleTry}>Try It On</button>
        </div>
        <div className='right'>
          <img src={Fit} alt="featured" className='featured-img' />
           
        </div>
      
    </div>
  </div>  
  );
}
export default Featured;