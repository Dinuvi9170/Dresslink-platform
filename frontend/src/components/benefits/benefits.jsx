import React from 'react';
import "./benefits.css";

const Benefits = () => { 
  return (
    <div className="benefits">
        <div className="benefit-container">
            <h1 className='benefit-h1'>Why DressLink?</h1>
            <p className='benefit-p'>A smart platform built to empower local tailoring talent and connect customers with trusted fabric suppliers — enhanced with technology that makes fittings easier than ever.</p>
            <div className="benefits-list">
                <div className="benefit-item">
                    <img src="#" alt="Benefit 1" />
                    <h2 className='benefit-h2'>Discover Skilled Professionals</h2>
                    <p className='benefit-p'>Find tailors, designers, and stitching experts who match your style and budget.</p>
                </div>
                <div className="benefit-item">
                    <img src="#" alt="Benefit 2" />
                    <h2 className='benefit-h2'>Browse Material Suppliers</h2>
                    <p className='benefit-p'>Explore fabric shops, compare collections, and connect directly with sellers — all on one platform.</p>
                </div>
                <div className="benefit-item">
                    <img src="#" alt="Benefit 3" />
                    <h2 className='benefit-h2'>Bridge Between Tradition & Technology</h2>
                    <p className='benefit-p'>DressLink combines traditional tailoring expertise with modern tools, creating a digital home for rural textile professionals.</p>
                </div>
                <div className="benefit-item">
                    <img src="#" alt="Benefit 4" />
                    <h2 className='benefit-h2'>Smart Fitting with 2D Model</h2>
                    <p className='benefit-p'>Upload your photo and measurements to preview how designs fit — no guesswork, just precision.</p>
                </div>
            </div>
        </div>
    </div>
  );
}
export default Benefits;