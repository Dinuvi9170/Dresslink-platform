import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './manageSupplier.css';

const ManageSupplierGigs = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [supplierProfiles, setSupplierProfiles] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState(null);

  // Fetch supplier profiles data
  useEffect(() => {
    const fetchSupplierProfiles = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login', { state: { from: '/manageSupplierGigs' } });
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get('http://localhost:3000/suppliers/mygigs', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setSupplierProfiles(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching supplier profiles:', err);
        
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login', { state: { from: '/manageSupplierGigs' } });
          return;
        }
        
        setError(err.response?.data?.message || 'Failed to load supplier profiles');
        setLoading(false);
      }
    };

    fetchSupplierProfiles();
  }, [navigate]);

  // Navigate to edit profile
  const handleEditProfile = (profileId) => {
    navigate(`/editSupplierGig/${profileId}`);
  };

  // Open delete confirmation modal
  const openDeleteModal = (profileId) => {
    setProfileToDelete(profileId);
    setDeleteModalOpen(true);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setProfileToDelete(null);
  };

  // Delete supplier profile
  const handleDeleteProfile = async () => {
    if (!profileToDelete) return;
    
    const token = localStorage.getItem('token');
    
    try {
      await axios.delete(`http://localhost:3000/suppliers/${profileToDelete}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Remove the deleted profile from state
      setSupplierProfiles(supplierProfiles.filter(profile => profile._id !== profileToDelete));
      setDeleteModalOpen(false);
      setProfileToDelete(null);
    } catch (err) {
      console.error('Error deleting supplier profile:', err);
      setError(err.response?.data?.message || 'Failed to delete supplier profile');
      setDeleteModalOpen(false);
    }
  };

  // Navigate to create new supplier gig
  const handleCreateNewGig = () => {
    navigate('/createSuppliergig');
  };

  // Render HTML content safely
  const createMarkup = (htmlContent) => {
    return { __html: htmlContent };
  };

  if (loading) {
    return <div className="loading">Loading supplier profiles...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="manage-supplier-container">
      <div className="page-header">
        <h1>Manage Supplier Gigs</h1>
        <button className="create-gig-btn" onClick={handleCreateNewGig}>
          Create New Gig
        </button>
      </div>

      {supplierProfiles.length === 0 ? (
        <div className="no-gigs-message">
          <p>You don't have any supplier gigs yet.</p>
          <button onClick={handleCreateNewGig}>Create Your First Gig</button>
        </div>
      ) : (
        <div className="gigs-list">
          {supplierProfiles.map(profile => (
            <div key={profile._id} className="gig-card">
              <div className="gig-image">
                <img src={profile.cover} alt={profile.ShopName} />
              </div>
              <div className="gig-details">
                <h2>{profile.ShopName}</h2>
                <h3>{profile.title}</h3>
                <div className="gig-description" dangerouslySetInnerHTML={createMarkup(profile.shopDescription.substring(0, 150) + '...')} />
                
                <div className="materials-offered">
                  <h4>Materials Offered:</h4>
                  <div className="materials-tags">
                    {profile.materialOffered.map((material, idx) => (
                      <span key={idx} className="material-tag">{material}</span>
                    ))}
                  </div>
                </div>
                
                <div className="contact-info">
                  <p><strong>Contact:</strong> {profile.contactInfo.mobile}</p>
                  <p><strong>Email:</strong> {profile.contactInfo.email}</p>
                </div>
              </div>
              
              <div className="gig-actions">
                <button 
                  className="edit-btn" 
                  onClick={() => handleEditProfile(profile._id)}
                >
                  Edit
                </button>
                <button 
                  className="delete-btn" 
                  onClick={() => openDeleteModal(profile._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete this supplier gig? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={closeDeleteModal}>
                Cancel
              </button>
              <button className="confirm-delete-btn" onClick={handleDeleteProfile}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSupplierGigs;