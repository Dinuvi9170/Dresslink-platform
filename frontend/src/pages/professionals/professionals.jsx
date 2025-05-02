import React,{useState,useEffect} from 'react';
import "./professionals.css";
import GigCard from "../../components/gigCard/gigCard";
import axios from "axios";

const Professionals = () => {
  const [gigs, setGigs] = useState([]);
  const[filters,setFilters]=useState({
    city: "",
    minPrice:"",
    maxPrice:"",
  });

  //fech all gigs from the backend
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

  //handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  //fetch filtered gigs from the backend
  const handleFilterSubmit = async (e) => {
    e.preventDefault();
    try {
      const params= new URLSearchParams();
      if (filters.city) params.append("city", filters.city);
      if (filters.minPrice) params.append("minPrice", filters.minPrice);
      if (filters.maxPrice) params.append("maxPrice", filters.maxPrice); 

      const res = await axios.get(`http://localhost:3000/gigs/search?${params.toString()}`);
      setGigs(res.data);
    } catch (err) {
      console.error("Error fetching filtered gigs:", err);
    }
  };
  return (
    <div className="professionals">
      <div className="professional_img"/>
      <h1>Meet Tailoring & Designing Professionals</h1>
      <p className='professional-desc'>Use filters to find the perfect match for your need. </p>
      
      <form className="filters" onSubmit={handleFilterSubmit}>
        <label className="filter-option"> City</label>
        <input
          type="text"
          placeholder="city"
          name="city"
          value={filters.city}
          onChange={handleFilterChange}
        />
        <label className="filter-option">Budget</label>
        <input
          type="text"
          placeholder="Rs min"
          name="minPrice"
          value={filters.minPrice}
          onChange={handleFilterChange}
        />
        <input
          type="text"
          placeholder="Rs max"
          name="maxPrice"
          value={filters.maxPrice}
          onChange={handleFilterChange}
        />
        <button className="filter-button">Find</button>
      </form>
      <div className="professional_card">
        {gigs.map((gig) => (
          <GigCard key={gig._id} gig={{
            _id: gig._id,
            title: gig.title,
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