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

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending':
        return <span className="status-icon pending">⏱️</span>;
      case 'in-progress':
        return <span className="status-icon in-progress">⚠️</span>;
      case 'completed':
        return <span className="status-icon completed">✓</span>;
      case 'cancelled':
        return <span className="status-icon cancelled">✗</span>;
      default:
        return <span className="status-icon">⏱️</span>;
    }
  };

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
        <p>Manage and track your client orders</p>
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
                      {getStatusIcon(order.status)}
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

                  {order.initialReview && (
                    <div className="order-review">
                      <h4>Client Initial Review</h4>
                      <div className="review-stars">
                        {[...Array(5)].map((_, i) => (
                          <span 
                            key={i} 
                            className={i < (order.initialReview.rating || 0) ? "star filled" : "star"}
                          >
                            {i < (order.initialReview.rating || 0) ? "★" : "☆"}
                          </span>
                        ))}
                        <span className="review-date">
                          {formatDate(order.initialReview.givenAt || new Date())}
                        </span>
                      </div>
                      <p className="review-comment">{order.initialReview.comment || "No comment provided"}</p>
                    </div>
                  )}
                  
                  <div className="order-actions">
                    <Link to={`/chat/${order.client?._id || ''}`} className="action-button chat">
                      Chat with Client
                    </Link>
                    <Link to={`/orders/${order._id || ''}`} className="action-button view">
                      View Full Details
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