import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import './profile.css';

const Profile = ({ currentUser, setCurrentUser }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [userData, setUserData] = useState({
        fname: '',
        lname: '',
        email: '',
        role: '',
        phone: '',
        address: {
            number: '',
            street: '',
            city: '',
            district: '',
            province: ''
        },
        image: ''
    });
    const [originalData, setOriginalData] = useState(null);

    // Districts and provinces in Sri Lanka
    const sriLankaProvinces = [
        'Central', 'Eastern', 'North Central', 'Northern', 'North Western',
        'Sabaragamuwa', 'Southern', 'Uva', 'Western'
    ];

    const districtsByProvince = {
        'Central': ['Kandy', 'Matale', 'Nuwara Eliya'],
        'Eastern': ['Ampara', 'Batticaloa', 'Trincomalee'],
        'North Central': ['Anuradhapura', 'Polonnaruwa'],
        'Northern': ['Jaffna', 'Kilinochchi', 'Mannar', 'Mullaitivu', 'Vavuniya'],
        'North Western': ['Kurunegala', 'Puttalam'],
        'Sabaragamuwa': ['Kegalle', 'Ratnapura'],
        'Southern': ['Galle', 'Hambantota', 'Matara'],
        'Uva': ['Badulla', 'Monaragala'],
        'Western': ['Colombo', 'Gampaha', 'Kalutara']
    };

    // Fetch user data on component mount
    useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem('token');
            
            if (!token) {
                navigate('/login');
                return;
            }
            
            try {
                const response = await fetch('http://localhost:3000/user/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch user data');
                }
                
                const data = await response.json();

                // Ensure address is properly structured as an object
                const addressData = typeof data.address === 'object' ? data.address || {} : {};
                // Set user data 
                const formattedUserData = {
                    fname: data.fname || '',
                    lname: data.lname || '',
                    email: data.email || '',
                    role: data.role || '',
                    phone: data.phone || '',
                    address: {
                        number: addressData.number || '',
                        street: addressData.street || '',
                        city: addressData.city || '',
                        district: addressData.district || '',
                        province: addressData.province || ''
                    },
                    image: data.image || ''
                };
                
                setUserData(formattedUserData);
                setOriginalData(formattedUserData);
                setLoading(false);
                console.log("Fetched user data:", formattedUserData);
                console.log("Fetched image URL:", formattedUserData.image);
            } catch (err) {
                console.error('Error fetching user data:', err);
                setError('Failed to load profile data. Please try again later.');
                setLoading(false);
            }
        };
        
        fetchUserData();
    }, [navigate]);;

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;

        // Function to capitalize first letter of each word
        const capitalizeWords = (str) => {
            return str.replace(/\b\w/g, char => char.toUpperCase());
        };
        const formattedValue = ["fname", "lname","address.number", "address.city", "address.street"].includes(name) 
        ? capitalizeWords(value)
        : value;
        
        if (name.includes('address.')) {
            const addressField = name.split('.')[1];
            setUserData(prev => ({
                ...prev,
                address: {
                    ...prev.address,
                    [addressField]: formattedValue
                }
            }));
        } else {
            setUserData(prev => ({
                ...prev,
                [name]: formattedValue
            }));
        }
    };

    // Handle image upload
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            setLoading(true);
            setError(null);
            if (file.size > 2 * 1024 * 1024) {
                throw new Error("File size exceeds 2MB limit");
            }
            
            const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
            const filePath = `profiles/${fileName}`;
            
            const { data, error: uploadError } = await supabase.storage
                .from('dinuvi1')
                .upload(filePath, file, {
                    upsert: true,
                    cacheControl: "no-cache",
                    contentType: file.type
                });
                
            if (uploadError) {
                throw new Error(uploadError.message);
            }
            
            const { data: publicUrlData } = supabase.storage
                .from('dinuvi1')
                .getPublicUrl(filePath);

            // timestamp to force browser to load new image
            publicUrlData.publicUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;    
            setUserData(prev => ({
                ...prev,
                image: publicUrlData.publicUrl
            }));
            //update server
            const token = localStorage.getItem('token');
            if (token) {
                const response = await axios.put('http://localhost:3000/user/updateProfile', 
                    { image: publicUrlData.publicUrl },
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                // Get a new token to update user data
                if (response.data?.token) {
                    localStorage.setItem('token', response.data.token);
                    console.log('JWT token updated with new image URL');
                }
            }

            // Update localStorage 
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                user.image = publicUrlData.publicUrl;
                localStorage.setItem('user', JSON.stringify(user));
                console.log('localStorage updated with image URL:', publicUrlData.publicUrl);
            }
            // Update currentUser in App.jsx
            if (setCurrentUser) {
                setCurrentUser(prev => ({
                    ...prev,
                    image: publicUrlData.publicUrl,
                    fname: prev.fname,
                    lname: prev.lname,
                    email: prev.email,
                    role: prev.role,
                    phone: prev.phone,
                    address: prev.address
                }));
                console.log('currentUser updated with image URL:', publicUrlData.publicUrl);
            }
            
            setLoading(false);
        } catch (err) {
            console.error('Error uploading image:', err);
            setError(`Failed to upload image: ${err.message}`);
            setLoading(false);
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);
        
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                navigate('/login', { state: { from: '/profile' } });
                return;
            }
            
            // Validate form data
            if (!userData.fname || !userData.lname || !userData.email ||
                !userData.address.number || !userData.address.city ||
                !userData.address.district || !userData.address.province) {
                throw new Error('Please fill in all required fields');
            }
            
            // Update user profile
            const response = await axios.put('http://localhost:3000/user/updateProfile', userData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            // Update the parent component state with new user data
            if (setCurrentUser) {
                const updatedUser = response.data?.user || userData;
                
                setCurrentUser(prev => ({
                    ...prev,
                    fname: updatedUser.fname,
                    lname: updatedUser.lname,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    phone: updatedUser.phone,
                    address: updatedUser.address,
                    image: updatedUser.image 
                }));
                
                // Also update localStorage 
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    parsedUser.fname = updatedUser.fname;
                    parsedUser.lname = updatedUser.lname;
                    parsedUser.email = updatedUser.email;
                    parsedUser.role = updatedUser.role;
                    parsedUser.phone = updatedUser.phone;
                    parsedUser.address = updatedUser.address;
                    parsedUser.image = updatedUser.image;
                    localStorage.setItem('user', JSON.stringify(parsedUser));
                }
            }
            
            setSuccess('Profile updated successfully');
            console.log('Profile updated successfully');
            setOriginalData(userData);
            setIsEditing(false);
            
            setTimeout(() => {
                setSuccess(null);
            }, 3000);
        } catch (err) {
            console.error('Error updating profile:', err);
            setError(err.response?.data?.message || err.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    // Cancel editing and revert changes
    const handleCancel = () => {
        setUserData(originalData);
        setIsEditing(false);
        setError(null);
    };

    // Display loading state
    if (loading) {
        return (
            <div className="profile-container loading-container">
                <div className="loading-spinner"></div>
                <p>Loading profile data...</p>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <h1>My Profile</h1>
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <div className="profile-content">
                <div className="profile-image-section">
                    <div className="profile-image-container">
                        <img 
                            src={`${userData.image || 'https://avatar.iran.liara.run/public/boy?username=Ash'}?${Date.now()}`}
                            alt={`${userData.fname} ${userData.lname}`}
                            className="profile-image"
                            key={`profile-image${Date.now()}`}
                        />
                        {isEditing && (
                            <div className="image-upload-overlay">
                                <input 
                                    type="file" 
                                    id="profile-image-upload" 
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="image-upload-input"
                                />
                                <label htmlFor="profile-image-upload" className="image-upload-label">
                                    Change Photo
                                </label>
                            </div>
                        )}
                    </div>
                    
                    <div className="profile-role-badge">
                        {userData.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : 'User'}
                    </div>
                    
                    {!isEditing && (
                        <button 
                            className="edit-profile-btn"
                            onClick={() => setIsEditing(true)}
                        >
                            Edit Profile
                        </button>
                    )}
                </div>
                
                <div className="profile-details-section">
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="fname">First Name</label>
                                <input 
                                    type="text"
                                    id="fname"
                                    name="fname"
                                    value={userData.fname}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="lname">Last Name</label>
                                <input 
                                    type="text"
                                    id="lname"
                                    name="lname"
                                    value={userData.lname}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    required
                                />
                            </div>
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group full-width">
                                <label htmlFor="email">Email</label>
                                <input 
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={userData.email}
                                    disabled={true} 
                                    required
                                />
                                <small>Email cannot be changed</small>
                            </div>
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group full-width">
                                <label htmlFor="phone">Phone Number</label>
                                <input 
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={userData.phone || ''}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    placeholder="Enter your phone number"
                                />
                            </div>
                        </div>
                        
                        <h3>Address</h3>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="address.number">House/Building Number</label>
                                <input 
                                    type="text"
                                    id="address.number"
                                    name="address.number"
                                    value={userData.address.number}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="address.street">Street (Optional)</label>
                                <input 
                                    type="text"
                                    id="address.street"
                                    name="address.street"
                                    value={userData.address.street || ''}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                />
                            </div>
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="address.province">Province</label>
                                <select
                                    id="address.province"
                                    name="address.province"
                                    value={userData.address.province}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    required
                                >
                                    <option value="">{userData.address.province}</option>
                                    {sriLankaProvinces.map(province => (
                                        <option key={province} value={province}>
                                            {province}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="address.district">District</label>
                                <select
                                    id="address.district"
                                    name="address.district"
                                    value={userData.address.district}
                                    onChange={handleChange}
                                    disabled={!isEditing || !userData.address.province}
                                    required
                                >
                                    <option value="">{userData.address.district}</option>
                                    {userData.address.province && 
                                        districtsByProvince[userData.address.province]?.map(district => (
                                            <option key={district} value={district}>
                                                {district}
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group full-width">
                                <label htmlFor="address.city">City</label>
                                <input 
                                    type="text"
                                    id="address.city"
                                    name="address.city"
                                    value={userData.address.city}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    required
                                />
                            </div>
                        </div>
                        
                        {isEditing && (
                            <div className="form-actions">
                                <button 
                                    type="button" 
                                    className="cancel-btn"
                                    onClick={handleCancel}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="save-btn"
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        )}
                    </form>
                    
                    {!isEditing && userData.role === 'customer' && (
                        <div className="role-change-section">
                            <h3>Would you like to offer services or materials?</h3>
                            <div className="role-buttons">
                                <button 
                                    className="role-btn professional-btn"
                                    onClick={() => navigate('/createProfessioonalgig')}
                                >
                                    Become a Professional
                                </button>
                                <button 
                                    className="role-btn supplier-btn"
                                    onClick={() => navigate('/createSuppliergig')}
                                >
                                    Become a Supplier
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
