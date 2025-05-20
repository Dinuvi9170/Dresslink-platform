import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './orders.css';
import { format } from 'date-fns';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        const response = await axios.get('http://localhost:3000/orders/professional/orders', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        // Add console log to debug the response structure
        console.log('API response:', response.data);
        
        // Ensure orders is always an array
        const ordersData = Array.isArray(response.data) ? response.data : 
                           (response.data.orders || []);
        
        setOrders(ordersData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders. Please try again later.');
        setLoading(false);
        toast.error('Failed to load orders');
      }
    };

    fetchOrders();
  }, []);

  const getStatusClass = (status) => {
    return `status-badge ${status || 'pending'}`;
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const toggleOrderDetails = (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
    }
  };

  if (loading) {
    return <div className="orders-loading">Loading orders...</div>;
  }

  if (error) {
    return <div className="orders-error">{error}</div>;
  }

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h1>My Orders</h1>
      </div>

      {Array.isArray(orders) && orders.length === 0 ? (
        <div className="no-orders">
          <p>You don't have any orders yet</p>
        </div>
      ) : (
        <div className="orders-list">
          {Array.isArray(orders) && orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-summary" onClick={() => toggleOrderDetails(order._id)}>
                <div className="order-main-info">
                  <div className="client-info">
                    <img 
                      src={order.client?.image || "https://avatar.iran.liara.run/public/boy?username=User"} 
                      alt={(order.client?.fname || 'Client')} 
                      className="client-avatar" 
                    />
                    <div>
                      <h3>{order.client?.fname || 'Client'} {order.client?.lname || ''}</h3>
                      <p className="order-service">{order.serviceName || 'No service name'}</p>
                    </div>
                  </div>
                  <div className="order-meta">
                    <div className="order-price">Rs. {(order.budget || 0).toFixed(2)}</div>
                    <div className={getStatusClass(order.status)}>
                      {order.status || 'Pending'}
                    </div>
                  </div>
                </div>
                <div className="order-dates">
                  <span>Order date: {formatDate(order.createdAt)}</span>
                  <span>Deadline: {formatDate(order.deadline)}</span>
                </div>
              </div>
              
              {expandedOrder === order._id && (
                <div className="order-details">
                  <div className="order-description">
                    <h4>Job Description</h4>
                    <p>{order.jobDescription || 'No description provided'}</p>
                    
                    {order.additionalRequirements && (
                      <div className="additional-requirements">
                        <h4>Additional Requirements</h4>
                        <p>{order.additionalRequirements}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="order-payment">
                    <h4>Payment Proof</h4>
                    {order.paymentProof ? (
                      <img src={order.paymentProof} alt="Payment Proof" className="payment-proof-image" />
                    ) : (
                      <p>No payment proof available</p>
                    )}
                  </div>
                  <div className="orderactions">
                    <Link to={`/chatNow/${order.client?._id || ''}`} className=" chat">
                      Chat with Client
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;