import React, { useEffect, useState } from 'react';
import axios from 'axios';
// import GigCard from '../../components/gigCard/GigCard';
import './fabrics.css';

const Materials = () => {
  const [gigs, setGigs] = useState([]);
  const [filteredGigs, setFilteredGigs] = useState([]);
  const [city, setCity] = useState('');
  const [materialType, setMaterialType] = useState('');
  const [priceRange, setPriceRange] = useState('');

  // Fetch all gigs from the backend
  useEffect(() => {
    const fetchGigs = async () => {
      try {
        const res = await axios.get('http://localhost:3000/suppliers');
        setGigs(res.data);
        setFilteredGigs(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchGigs();
  }, []);

  const handleFilter = async (e) => {
    e.preventDefault();
    
    try {
      const params = new URLSearchParams();
      if (city) params.append("city", city);
      if (materialType) params.append("materialType", materialType);
      if (priceRange) params.append("priceRange", priceRange);
      
      const url = params.toString() 
        ? `http://localhost:3000/suppliers/search?${params.toString()}`
        : 'http://localhost:3000/suppliers';
        
      const res = await axios.get(url);
      setFilteredGigs(res.data);
    } catch (err) {
      console.error("Error fetching filtered supplier gigs:", err);
    }
  };

  return (
    <div className="materials-page">
      <div className="fabrics-img" />
      <h1 className="page-title">Fabrics & Materials</h1>
      <p className="page-subtitle">Use filters to find the perfect match for your need.</p>

      <form className="filters-form" onSubmit={handleFilter}>
        <div className="filter-container">
          <div className="filter-group">
            <label>City</label>
            <input
              type="text"
              placeholder=" city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Material Type</label>
            <select
              value={materialType}
              onChange={(e) => setMaterialType(e.target.value)}
            >
              <option value="">All Materials</option>
              <option value="Cotton">Cotton</option>
              <option value="Silk">Silk</option>
              <option value="Linen">Linen</option>
              <option value="Denim">Denim</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Price Range</label>
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
            >
              <option value="">Any Price</option>
              <option value="0-1000">Under Rs.1000</option>
              <option value="1000-3000">Rs.1000 - 3000</option>
              <option value="3000-5000">Rs.3000 - 5000</option>
              <option value="5000-10000">Rs.5000 - 10000</option>
            </select>
          </div>
          <div className="filter-group button-group">
            <button type="submit" className="find-button">Find</button>
          </div>
        </div>
      </form>

      <div className="gig-cards-grid">
        {filteredGigs.length > 0 ? (
          filteredGigs.map((gig) => (
            <GigCard key={gig._id} gig={gig} />
          ))
        ) : (
          <p>No materials found matching your filters.</p>
        )}
      </div>
    </div>
  );
};

export default Materials;
