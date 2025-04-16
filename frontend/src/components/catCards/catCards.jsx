import React from 'react';
import {Link} from 'react-router-dom';
import "./catCards.css";

const CatCards = ({ item}) => {
  return (
    <div className='catCards'>
        <div className="catCards-container">
            <h1 className='catCards-h1'>Our Services</h1>
            <p className='catCards-p'>Find the perfect fabric for your next project. Browse our curated categories to discover a world of possibilities.</p>
            <div className="catCards-list">
                {item.map((item, index) => (
                    <Link to={item.link} className="catCards-item" key={index}>
                        <img src={item.img} alt={item.img} />
                        <span className='desc'>{item.desc}</span>
                        <span className='title'>{item.title}</span>
                    </Link>
            ))}
            </div>
        </div>
      
    </div>  
    
  );
}       
export default CatCards;