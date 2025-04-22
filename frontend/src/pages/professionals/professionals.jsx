import React from 'react';
import "./professionals.css";
import GigCard from "../../components/gigCard/gigCard";
import Data from "../../components/gigCard/data";

const Professionals = () => {
  return (
    <div className="professionals">
      <div className="professional_img"/>
      <h1>Welcome to the Professionals Page</h1>
      <p>This is a simple professionals page.</p>
      <div className="professional_card">
        {Data.map((gig) => (
          <GigCard key={gig.id} gig={gig} />
        ))}
      </div>  

    </div>
      
  );
}
export default Professionals;