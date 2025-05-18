import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './manageGigs.css';

const ManageSupplierGigs = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // Fetch profiles data based on user role
  useEffect(() => {
    const fetchProfiles = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login', { state: { from: '/manageSupplierGigs' } });
        return;
      }

      try {
        // Decode token to get user role
        let tokenPayload;
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          tokenPayload = JSON.parse(window.atob(base64));
        } catch (tokenError) {
          console.error('Error decoding token:', tokenError);
          // Token is invalid, redirect to login
          localStorage.removeItem('token');
          navigate('/login', { state: { from: '/manageSupplierGigs' } });
          return;
        }
        const role = tokenPayload.role;
        setUserRole(role);
        
        setLoading(true);
        
        // Determine which endpoint to call based on user role
        let endpoint;
        if (role === 'supplier') {
          endpoint = 'http://localhost:3000/suppliers/mygigs';
        } else if (role === 'professional') {
          endpoint = 'http://localhost:3000/gigs/mygigs'; 
        } else {
          throw new Error('Unauthorized role');
        }
        
        const response = await axios.get(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setProfiles(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching profiles:', err);
        
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login', { state: { from: '/manageSupplierGigs' } });
          return;
        }
        
        setError(err.response?.data?.message || 'Failed to load profiles');
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [navigate]);

  // Navigate to edit profile based on role
  const handleEditProfile = (profileId) => {
    if (userRole === 'supplier') {
      navigate(`/editSupplierGig/${profileId}`);
    } else if (userRole === 'professional') {
      navigate(`/editProfessionalGig/${profileId}`);
    }
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

  // Delete profile
  const handleDeleteProfile = async () => {
    if (!profileToDelete) return;
    
    const token = localStorage.getItem('token');
    
    try {
      // Use the appropriate endpoint based on user role
      let endpoint;
      if (userRole === 'supplier') {
        endpoint = `http://localhost:3000/suppliers/${profileToDelete}`;
      } else if (userRole === 'professional') {
        endpoint = `http://localhost:3000/gigs/${profileToDelete}`;
      }
      
      await axios.delete(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Remove the deleted profile from state
      setProfiles(profiles.filter(profile => profile._id !== profileToDelete));
      setDeleteModalOpen(false);
      setProfileToDelete(null);
    } catch (err) {
      console.error('Error deleting profile:', err);
      setError(err.response?.data?.message || 'Failed to delete profile');
      setDeleteModalOpen(false);
    }
  };

  // Navigate to create new gig based on role
  const handleCreateNewGig = () => {
    if (userRole === 'supplier') {
      navigate('/createSuppliergig');
    } else if (userRole === 'professional') {
      navigate('/createProfessioonalgig');
    }
  };

  // Render HTML content safely
  const createMarkup = (htmlContent) => {
    return { __html: htmlContent };
  };

  if (loading) {
    return <div className="loading">Loading profiles...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="manage-supplier-container">
      <div className="page-header">
        <h1>
          {userRole === 'supplier' 
            ? 'Manage Supplier Gigs' 
            : 'Manage Professional Gigs'}
        </h1>
        <button className="create-gig-btn" onClick={handleCreateNewGig}>
          Create New {userRole === 'supplier' ? 'Supplier' : 'Professional'} Gig
        </button>
      </div>

      {profiles.length === 0 ? (
        <div className="no-gigs-message">
          <p>You don't have any {userRole} gigs yet.</p>
          <button onClick={handleCreateNewGig}>Create Your First Gig</button>
        </div>
      ) : (
        <div className="gigs-list">
          {profiles.map(profile => (
            <div key={profile._id} className="gig-card">
              <div className="gig-image">
                <img src={profile.cover || profile.image} alt={profile.ShopName || profile.title} />
              </div>
              <div className="gig-details">
                {/* For supplier */}
                {userRole === 'supplier' && (
                  <>
                    <h2>{profile.ShopName}</h2>
                    <h3>{profile.title}</h3>
                    <div className="gig-description" 
                      dangerouslySetInnerHTML={createMarkup(
                        profile.shopDescription ? 
                        (profile.shopDescription.substring(0, 150) + '...') : ''
                      )} 
                    />
                    
                    <div className="materials-offered">
                      <h4>Materials Offered:</h4>
                      <div className="materials-tags">
                        {profile.materialOffered?.map((material, idx) => (
                          <span key={idx} className="material-tag">{material}</span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="contact-info">
                      <p><strong>Contact:</strong> {profile.contactInfo?.mobile}</p>
                      <p><strong>Email:</strong> {profile.contactInfo?.email}</p>
                    </div>
                  </>
                )}

                {/* For professional */}
                {userRole === 'professional' && (
                  <>
                    <h2>{profile.title}</h2>
                    <h3>{profile.category}</h3>
                    <div className="gig-description" 
                      dangerouslySetInnerHTML={createMarkup(
                        profile.description ? 
                        (profile.description.substring(0, 150) + '...') : ''
                      )} 
                    />
                    
                    <div className="skills-offered">
                      <h4>Skills:</h4>
                      <div className="skills-tags">
                        {profile.skills?.map((skill, idx) => (
                          <span key={idx} className="skill-tag">{skill}</span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="price-info">
                      <p><strong>Rate:</strong> ${profile.rate}</p>
                      <p><strong>Location:</strong> {profile.location}</p>
                    </div>
                  </>
                )}
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
            <p>Are you sure you want to delete this {userRole} gig? This action cannot be undone.</p>
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