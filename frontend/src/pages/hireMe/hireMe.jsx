import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import axios from 'axios';
import './hireMe.css';

const HireForm = () => {
  const { gigId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { professionalId, professionalName, professionalImage, gigTitle, gigPrice } = location.state || {};

  // Add state for gig data and loading status
  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedServiceId, setSelectedServiceId] = useState('base');
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState('');
  const [bankSlip, setBankSlip] = useState(null);
  const [bankSlipPreview, setBankSlipPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Order state
  const [orderId, setOrderId] = useState(null);
  const [formData, setFormData] = useState({
    jobDescription: '',
    budget: gigPrice || '',
    deadline: '',
    additionalRequirements: '',
    serviceName: '',
    paymentProof: ''
  });
  
  // Form submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Select a service to see delivery date";
    
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Calculate estimated completion date based on delivery time
  const calculateCompletionDate = (deliveryDays) => {
    const currentDate = new Date();
    const completionDate = new Date(currentDate);
    completionDate.setDate(currentDate.getDate() + (deliveryDays || 7)); // Default to 7 days if not specified
    return completionDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  };

  // Add effect to fetch gig details
  useEffect(() => {
    const fetchGig = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/gigs/${gigId}`);
        setGig(response.data);
        
        // Set default estimation date (7 days)
        const defaultDate = calculateCompletionDate(7);
        setEstimatedCompletionDate(defaultDate);
        
        // Initialize with base service
        setFormData(prev => ({
          ...prev,
          budget: response.data.price,
          serviceName: response.data.shorttitle,
          deadline: defaultDate
        }));
      } catch (err) {
        console.error('Failed to fetch gig details:', err);
        setError('Could not load service details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (gigId) {
      fetchGig();
    }
  }, [gigId, gigPrice]);

  // Clean up object URL when component unmounts
  useEffect(() => {
    return () => {
      if (bankSlipPreview) {
        URL.revokeObjectURL(bankSlipPreview);
      }
    };
  }, [bankSlipPreview]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle bank slip upload
  const handleBankSlipChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid file (JPEG, PNG or PDF)');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File is too large. Maximum size is 5MB');
      return;
    }

    setBankSlip(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(file);
      setBankSlipPreview(objectUrl);
    } else {
      // For PDF, show a placeholder or icon
      setBankSlipPreview(null);
    }

    setError(null);
  };

  // Handle service selection
  const handleServiceChange = (e) => {
    const serviceId = e.target.value;
    setSelectedServiceId(serviceId);
    
    // Check if it's not the placeholder option
    if (serviceId !== 'base' && serviceId !== '') {
      // Custom service selected
      const selectedService = gig.services[parseInt(serviceId)];
      if (selectedService) {
        const completionDate = calculateCompletionDate(selectedService.deliveryTime);
        setEstimatedCompletionDate(completionDate);
        
        setFormData({
          ...formData,
          budget: selectedService.price,
          serviceName: selectedService.name,
          deadline: completionDate
        });
      }
    } else if (serviceId === 'base') {
      // Base service selected
      const completionDate = calculateCompletionDate(7); // Default 7 days
      setEstimatedCompletionDate(completionDate);
      
      setFormData({
        ...formData,
        budget: gig.price,
        serviceName: gig.shorttitle,
        deadline: completionDate
      });
    }
  };

  // Upload bank slip to Supabase
  const uploadBankSlipToSupabase = async () => {
    if (!bankSlip) return null;

    try {
      setIsUploading(true);
      
      // Create a unique file name to avoid collisions
      const fileExt = bankSlip.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `bank-slips/${fileName}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('dinuvi1') 
        .upload(filePath, bankSlip, {
          cacheControl: '3600',
          upsert: false,
          contentType: bankSlip.type,
          onUploadProgress: (event) => {
            const percentCompleted = Math.round((event.loaded * 100) / event.total);
            setUploadProgress(percentCompleted);
          }
        });
        
      setIsUploading(false);
      setUploadProgress(0);
      
      if (error) {
        throw error;
      }
      
      // Get public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('dinuvi1')
        .getPublicUrl(filePath);
        
      return publicUrlData.publicUrl;
      
    } catch (err) {
      setIsUploading(false);
      setUploadProgress(0);
      setError('Failed to upload bank slip. Please try again.');
      console.error('Bank slip upload error:', err);
      return null;
    }
  };
  
  const handleRemoveImage = () => {
    // Clean up the URL object to prevent memory leaks
    if (bankSlipPreview) {
      URL.revokeObjectURL(bankSlipPreview);
    }
    
    // Reset the file states
    setBankSlip(null);
    setBankSlipPreview(null);
    
    // Reset the file input by clearing the value
    const fileInput = document.getElementById('bankSlip');
    if (fileInput) {
      fileInput.value = '';
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Check if a service is selected
    if (selectedServiceId === '') {
      setError('Please select a service');
      setSubmitting(false);
      return;
    }

    // Check if bank slip is uploaded
    if (!bankSlip) {
      setError('Please upload a bank slip as proof of payment');
      setSubmitting(false);
      return;
    }

    try {
      // upload the bank slip to Supabase
      const bankSlipPath = await uploadBankSlipToSupabase(); 
      if (!bankSlipPath) {
        setError('Bank slip upload failed. Please try again.');
        setSubmitting(false);
        return;
      }
      
      const token = localStorage.getItem('token');
      
      // Submit the hiring request with payment proof
      const response = await axios.post('http://localhost:3000/orders', {
        professionalId,
        gigId,
        ...formData,
        paymentProof: bankSlipPath
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Set the order ID for the review submission
      if (response.data && response.data.order && response.data.order._id) {
        setOrderId(response.data.order._id);
      }
      
      setSuccess(true);
      
      // Show review modal instead of immediate redirect
      setShowReviewModal(true);
      
    } catch (err) {
      console.error("Error submitting hiring request:", err);
      
      // Display more specific error message if available
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to submit hiring request. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle review submission
  const handleReviewSubmit = async () => {
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }
    
    try {
      setSubmittingReview(true);
      const token = localStorage.getItem('token');
      
      await axios.post(`http://localhost:3000/orders/${orderId}/initial-review`, {
        rating,
        comment: review
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Close modal and redirect
      setShowReviewModal(false);
      
     
      
    } catch (err) {
      console.error("Error submitting review:", err);
      setError("Failed to submit review. Your order was placed successfully.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Handle skip review
  const handleSkipReview = () => {
    setShowReviewModal(false);
    
    // Redirect after skipping
    setTimeout(() => {
      navigate('/');
    }, 1000);
  };
  
  // Render star rating
  const renderStarRating = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span 
          key={i}
          className={`star ${i <= rating ? 'active' : ''}`}
          onClick={() => setRating(i)}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  if (!professionalId || !gigId) {
    return <div className="error-message">Invalid request. Missing professional or gig information.</div>;
  }

  return (
    <div className="hire-container">
      {success ? (
        <div className="success-container">
          <h2>Request Submitted Successfully!</h2>
          {!showReviewModal}
        </div>
      ) : (
        <>
          <div className="hire-header">
            <h1>Hire Professional</h1>
            <div className="professional-summary">
              {professionalImage && <img src={professionalImage} alt={professionalName} />}
              <div>
                <h3>{professionalName}</h3>
                <p className="starting-price">Starting price: Rs. {gigPrice?.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <form className="hire-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="jobDescription">Job Description *</label>
              <textarea
                id="jobDescription"
                name="jobDescription"
                value={formData.jobDescription}
                onChange={handleInputChange}
                required
                rows="4"
                placeholder="Describe what you need done in detail"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="serviceSelect">Select Service *</label>
              {loading ? (
                <div className="loading-text">Loading services...</div>
              ) : gig ? (
                <div className="service-selection">
                  <select
                    id="serviceSelect"
                    name="serviceSelect"
                    value={selectedServiceId}
                    onChange={handleServiceChange}
                    required
                    className="service-dropdown"
                  >
                    <option value="">-- Select a service --</option>
                    {gig.services && Array.isArray(gig.services) && gig.services.map((service, index) => (
                      <option key={index} value={index}>
                        {service.name} - Rs. {service.price?.toFixed(2)} ({service.deliveryTime} days)
                      </option>
                    ))}
                  </select>                              
                </div>
              ) : (
                <div className="error-text">Failed to load services</div>
              )}
              
              {/* Hidden fields for form submission */}
              <input type="hidden" name="budget" value={formData.budget} />
              <input type="hidden" name="serviceName" value={formData.serviceName} />
              <input type="hidden" name="deadline" value={formData.deadline} />
            </div>
            
            <div className="form-group">
              <label>Expected Completion Date</label>
              <div className="completion-date-display">
                {formatDate(estimatedCompletionDate)}
              </div>
              <p className="date-note">
                The delivery date is automatically set based on the service you select.
              </p>
            </div>
            
            {/* Bank Slip Upload Section */}
            <div className="form-group">
              <label htmlFor="bankSlip">Upload Payment Proof (Bank Slip) *</label>
              <div className="bank-slip-container">
                <div className="file-upload-wrapper">
                  <input 
                    type="file"
                    id="bankSlip"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    onChange={handleBankSlipChange}
                    className="file-upload-input"
                    required
                  />
                  <div className="file-upload-button">
                    <span>Choose File</span>
                    <span className="file-name">
                      {bankSlip ? bankSlip.name : 'No file chosen'}
                    </span>
                  </div>
                </div>
                
                {/* Upload progress indicator */}
                {isUploading && (
                  <div className="upload-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">{uploadProgress}% Uploaded</span>
                  </div>
                )}
                
                {/* Preview area */}
                {bankSlipPreview && (
                  <div className="image-previews-container">
                    <div className="image-preview">
                      <img src={bankSlipPreview} alt="Bank Slip Preview" />
                      <button 
                        type="button" 
                        className="remove-image-btn" 
                        onClick={() => handleRemoveImage()}
                      >
                        x
                      </button>
                    </div>
                  </div>
                )}
                
                {/* If it's a PDF, show PDF icon/message */}
                {bankSlip && bankSlip.type === 'application/pdf' && (
                  <div className="pdf-indicator">
                    <span className="pdf-icon">📄</span>
                    <span>PDF File: {bankSlip.name}</span>
                  </div>
                )}
                
                <div className="bank-slip-instructions">
                  <p>Please upload a clear image of your bank transfer receipt.</p>
                  <p>Accepted formats: JPEG, PNG (Max size: 5MB)</p>
                </div>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="additionalRequirements">Additional Requirements</label>
              <textarea
                id="additionalRequirements"
                name="additionalRequirements"
                value={formData.additionalRequirements}
                onChange={handleInputChange}
                rows="3"
                placeholder="Any special instructions or requirements"
              />
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-btn" 
                onClick={() => navigate(`/gigs/${gigId}`)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-btn"
                disabled={submitting || loading || isUploading}
              >
                {submitting || isUploading ? 'Processing...' : 'Submit'}
              </button>
            </div>
          </form>
        </>
      )}
      
      {/* Review Modal */}
      {showReviewModal && (
        <div className="review-modal-overlay">
          <div className="review-modal">
            <h3>Rate Your Experience</h3>
            <p>How was your experience hiring {professionalName}?</p>
            
            <div className="star-rating">
              {renderStarRating()}
            </div>
            
            <textarea
              className="review-textarea"
              placeholder="Share your thoughts about the hiring process (optional)"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows="4"
            ></textarea>
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="review-modal-actions">
              <button 
                className="skip-btn"
                onClick={handleSkipReview}
                disabled={submittingReview}
              >
                Skip
              </button>
              <button 
                className="submit-review-btn"
                onClick={handleReviewSubmit}
                disabled={submittingReview}
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HireForm;