import React from 'react';
import "./gigCard.css";

const GigCard = ({ gig }) => {  
  return (
    <div className="gigCard">
      <img src={gig.image} alt={gig.title} className="gigCard__image" />
      <div className="gigCard__details">
        <h2 className="gigCard__title">{gig.title}</h2>
        <p className="gigCard__description">{gig.description}</p>
        <p className="gigCard__price">${gig.price}</p>
      </div>
    </div>
  );
}
export default GigCard;