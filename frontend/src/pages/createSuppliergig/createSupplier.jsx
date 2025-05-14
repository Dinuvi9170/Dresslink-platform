import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient'; 
import axios from 'axios';
import './createSupplier.css';

const CreateSupplier = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [formData, setFormData] = useState({
        ShopName: '',
        shopDescription: '',
        materialOffered: [],
        materials: [{ type: '', price: '' }],
        cover: '',
        contactInfo: {
            mobile: '',
            email: '',
            whatsapp: '',
        },
        title: '',
        shopImages: '',
    });

    // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { state: { from: '/createSuppliergig' } });
      return;
    }

    // Make a test request to verify the token is valid
    const verifyToken = async () => {
      try {
        await axios.get('http://localhost:3000/suppliers', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (err) {
        console.error('Token verification failed:', err);
        // If token is invalid, redirect to login
        navigate('/login', { state: { from: '/createSuppliergig' } });
      }
    };
    verifyToken();
  }, [navigate]);


  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes('contactInfo.')) {
      const key = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        contactInfo: { ...prev.contactInfo, [key]: value },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleMaterialChange = (index, field, value) => {
    const updated = [...formData.materials];
    updated[index][field] = field === 'price' ? Number(value) : value;
    setFormData((prev) => ({ ...prev, materials: updated }));
  };

  const handleAddMaterial = () => {
    setFormData((prev) => ({
      ...prev,
      materials: [...prev.materials, { type: '', price: '' }],
    }));
  };

  const handleRemoveMaterial = (index) => {
    if (formData.materials.length > 1) {
      const updated = [...formData.materials];
      updated.splice(index, 1);
      setFormData((prev) => ({ ...prev, materials: updated }));
    }
  };

  const handleImageUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadStatus(`Uploading ${field} image...`);
      
      if (file.size > 2 * 1024 * 1024) {
        throw new Error("File size exceeds 2MB limit. Please choose a smaller file.");
      }
      
      const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const filePath = `suppliers/${field}/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('dinuvi1') 
        .upload(filePath, file, {
          upsert: true,
          cacheControl: "3600",
          contentType: file.type
        });

      if (error) {
        throw new Error(error.message);
      }
      
      const { data: publicUrl } = supabase.storage
        .from('dinuvi1')
        .getPublicUrl(filePath);
      
      setFormData((prev) => ({
        ...prev,
        [field]: publicUrl.publicUrl,
      }));
      
      setUploadStatus(`${field} image uploaded successfully!`);
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (error) {
      console.error('Image upload failed:', error.message);
      setError(`Failed to upload image: ${error.message}`);
      setTimeout(() => setError(null), 5000);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUploadStatus('Creating supplier profile...'); 

    try {
        // Get authentication token
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('You must be logged in to create a supplier profile');
        }
        
        // Validate form data
        if (!formData.cover) {
          throw new Error('Cover image is required');
        }
        
        if (formData.materials.some(m => !m.type || !m.price)) {
          throw new Error('All materials must have both type and price');
        }
        
        // Convert materialOffered to array if it's a string
        const materialOffered = Array.isArray(formData.materialOffered) 
          ? formData.materialOffered 
          : formData.materialOffered.split(',').map(item => item.trim());
        
        // Create data object for API
        const supplierData = {
          ...formData,
          materialOffered,
          materials: formData.materials.map(m => ({
            type: m.type,
            price: Number(m.price)
          }))
        };
        
        // Send request to backend
        const response = await axios.post(
          'http://localhost:3000/suppliers/creategig',
          supplierData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        // Handle success
        setUploadStatus('Profile created successfully!');
        alert('Supplier profile created successfully!');
        navigate('/fabrics'); 
        
      } catch (err) {
        console.error('Error creating supplier profile:', err);
        if (err.response?.status === 401) {
          // Clear token and redirect to login
          localStorage.removeItem('token');
          navigate('/login', { state: { from: '/createSuppliergig' } });
          return;
        }
        setError(err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to create supplier profile. Please try again.');
      } finally {
        setLoading(false);
        setUploadStatus(null);
      }
    };

  return (
    <form onSubmit={handleSubmit} className="supplier-form">
      <h2>Create Supplier Profile</h2>

      <label>Shop Name</label>
      <input type="text" name="ShopName" className='ShopName' value={formData.ShopName} onChange={handleChange} required />

      <label>Shop Title</label>
      <input type="text" name="title" className='shoptitle' value={formData.title} onChange={handleChange} required />

      <label>Shop Description</label>
      <textarea name="shopDescription" className='shopDescription' value={formData.shopDescription} onChange={handleChange} />

      <label>Materials (comma-separated)</label>
      <input
        type="text"
        name="materialOffered"
        className='materialOffered'
        value={formData.materialOffered.join(', ')}
        onChange={(e) =>
          setFormData((prev) => ({
            ...prev,
            materialOffered: e.target.value.split(',').map((s) => s.trim()),
          }))
        }
        required
      />

      <label>Materials & Prices</label>
      {formData.materials.map((mat, index) => (
        <div key={index} className="material-row">
          <input
            type="text"
            placeholder="Material Type"
            value={mat.type}
            onChange={(e) => handleMaterialChange(index, 'type', e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Price"
            value={mat.price}
            onChange={(e) => handleMaterialChange(index, 'price', e.target.value)}
            required
          />
          <button 
            type="button" 
            className="remove-material-btn" 
            onClick={() => handleRemoveMaterial(index)}
          >
            X
          </button>
        </div>
      ))}
      <button type="button" onClick={handleAddMaterial}>+ Add Material</button>

      <label>Cover Image</label>
      <input type="file" accept="image/*" className='coverimage' onChange={(e) => handleImageUpload(e, 'cover')} />
      {formData.cover && <img src={formData.cover} alt="Cover" width="120" style={{ marginTop: '10px' }} />}

      <label>Shop Image</label>
      <input type="file" accept="image/*" className='images' onChange={(e) => handleImageUpload(e, 'shopImages')} />
      {formData.shopImages && <img src={formData.shopImages} alt="Shop" width="120" style={{ marginTop: '10px' }} />}

      <h3>Contact Info</h3>

      <label>Mobile</label>
      <input type="text" name="contactInfo.mobile" value={formData.contactInfo.mobile} onChange={handleChange} required />

      <label>Email</label>
      <input type="email" name="contactInfo.email" value={formData.contactInfo.email} onChange={handleChange} required />

      <label>WhatsApp</label>
      <input type="text" name="contactInfo.whatsapp" value={formData.contactInfo.whatsapp} onChange={handleChange} />

      <button type="submit" className="submit-btn">Submit</button>
    </form>
  );
};

export default CreateSupplier;
