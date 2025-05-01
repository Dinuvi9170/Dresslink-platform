import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Suppliergig.css';

const Suppliergig = () => {
  const { supplierId } = useParams(); 
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const handleChat = () => 
    navigate(`/chatNow/${supplier.user._id}`,{    
        state: {
            professionalName: fullName,
            professionalImage: supplier.user.image,
            gigTitle: supplier.ShopName
        }
    });

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/suppliers/${supplierId}`);
        console.log("Supplier data received:", res.data);
        setSupplier(res.data);
      } catch (err) {
        console.error('Error fetching supplier:', err);
        setError('Failed to load supplier profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchSupplier();
  }, [supplierId]);

  if (loading) return <div className="single-supplier-loading">Loading...</div>;
  if (error) return <div className="single-supplier-error">{error}</div>;
  if (!supplier) return <div>No supplier found.</div>;

  const fullName = `${supplier.user.fname} ${supplier.user.lname}`;
  const address = supplier.user.address
    ? `${supplier.user.address.number || ''} ${supplier.user.address.street || ''}, ${supplier.user.address.city || ''}, ${supplier.user.address.district || ''}`
    : 'Address not available';

  return (
    <div className="single-supplier-container">
      <div className="supplier-left">
        <div className="supplier-header">
        <img src={supplier.cover} alt="Shop Cover" className="shop-cover" />
        <div className="supplier-info">
          <h1>{supplier.ShopName}</h1>
          <p>{supplier.shopDescription}</p>
          <div className="supplier-owner">
            <img src={supplier.user.image} alt="Supplier" className="supplier-avatar" />
            <div>
              <h4>{fullName}</h4>
              <p>{address}</p>
              <p>Email: {supplier.user.email}</p>
            </div>
          </div>
        </div>
      </div>

        <div className="contact-info">
          <h2>Contact Information</h2>
          <p>{supplier.contactInfo || "No contact information provided"}</p>
        </div>
        <div className="chat-now-wrapper">
            <button className="chat-now-btn" onClick={handleChat}>Chat Now</button>
        </div>
        </div>

        <div className="supplier-right">
            <div className="materials-pricing">
          <h2>Available Materials and Prices</h2>
          {supplier.materials && Array.isArray(supplier.materials) && supplier.materials.length > 0 ? (
            <ul className="materials-list">
              {supplier.materials.map((material, index) => (
                <li key={index} className="material-item">
                  {material.type && (
                    <span className="material-name">{material.type}</span>
                )}
                {material.price && (
                    <span className="material-price">Rs. {material.price}</span>
                )}
                </li>
              ))}
            </ul>
          ) : (
            <p>No materials available at the moment</p>
          )}
        </div>
        </div>
    </div>
  );
};

export default Suppliergig;
