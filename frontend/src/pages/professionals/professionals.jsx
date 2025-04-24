import React,{useState,useEffect} from 'react';
import "./professionals.css";
import GigCard from "../../components/gigCard/gigCard";
//import Data from "../../components/gigCard/data";
import axios from "axios";

const Professionals = () => {
  const [gigs, setGigs] = useState([]);

  useEffect(() => {
    const fetchGigs = async () => {
      try {
        const res = await axios.get("http://localhost:3000/gigs"); 
        setGigs(res.data);
      } catch (err) {
        console.error("Error fetching gigs:", err);
      }
    };

    fetchGigs();
  }, []);


  return (
    <div className="professionals">
      <div className="professional_img"/>
      <h1>Welcome to the Professionals Page</h1>
      <p>This is a simple professionals page.</p>
      <div className="professional_card">
        {gigs.map((gig) => (
          <GigCard key={gig._id} gig={{title: gig.title,
            description: gig.shortdesc,
            image: gig.cover,
            price: gig.price,
            star: gig.totalStars / (gig.starNumber || 1),
            username: `${gig.user.fname} ${gig.user.lname}`,
            user_img: gig.user.image}} />
        ))}
      </div>  

    </div>
      
  );
}
export default Professionals;