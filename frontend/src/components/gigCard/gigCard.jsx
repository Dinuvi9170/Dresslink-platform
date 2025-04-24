import React from 'react';
import { Link } from "react-router-dom";
import "./gigCard.css";
import Star from "../../assets/icons/star.png";
import UnfilledHeart from "../../assets/icons/unfill-heart.png";

const GigCard = ({ gig }) => {
  return (
    <div className="gigCard">
      <Link to={`/gigs/${gig._id}`} className="gigCard__link">
      <div className="gigCard-container">
        <div className="gigCard__picture">
          <img src={gig.image} alt={gig.title} className="gigCard__image" />
          <img src={UnfilledHeart} alt="heart" className="gigCard__heart" />
        </div>
        <div className="gigCard__details">
          <h2 className="gigCard__title">{gig.title}</h2>
          <p className="gigCard__description">{gig.description}</p>
          <div className="gigCard__user">
            <img src={gig.user_img} alt={gig.username} className="gigCard__user-image" />
            <p className='text1'>Created by</p>
            <p className="gigCard__username">{gig.username}</p>
          </div>
          <div className="gigCard__rating">
            <img src={Star} className="star_img"/>
            <span className="gigCard__star">{gig.star}</span>
          </div>  
          <p className="gigCard__price">LKR {gig.price}</p>
        </div>
      </div>
      </Link>
    </div>
  );
};

export default GigCard;
