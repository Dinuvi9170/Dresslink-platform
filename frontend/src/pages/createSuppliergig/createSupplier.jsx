import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient'; 
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
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
        materials: [{ type: '',unit:'', price: '' }],
        cover: '',
        contactInfo: {
            mobile: '',
            email: '',
            whatsapp: '',
        },
        title: '',
        shopImages: [],
    });

    // Initialize TipTap editor
    const editor = useEditor({
      extensions: [
        StarterKit,
      ],
      content: formData.shopDescription,
      onUpdate: ({ editor }) => {
        setFormData(prev => ({
          ...prev,
          shopDescription: editor.getHTML()
        }));
      },
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

    if (name === 'contactInfo.mobile') {
      // Only allow numeric input and limit to 10 digits
      const numericValue = value.replace(/\D/g, '');
      const limitedValue = numericValue.slice(0, 10);
    
      setFormData((prev) => ({
        ...prev,
        contactInfo: { ...prev.contactInfo, mobile: limitedValue },
      }));
    } else if (name.includes('contactInfo.')) {
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
    if (field === 'price') {
    // Only convert to Number if the value is not empty
      updated[index][field] = value === '' ? '' : Number(value);
    } else {
      updated[index][field] = value;
    }
    setFormData((prev) => ({ ...prev, materials: updated }));
  };

  const handleAddMaterial = () => {
    setFormData((prev) => ({
      ...prev,
      materials: [...prev.materials, { type: '',unit:'', price: '' }],
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
      
      if (file.size > 5 * 1024 * 1024) {
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
      
      // Special handling for shopImages field to support multiple images
      if (field === 'shopImages') {
        setFormData((prev) => {
          const updatedFormData={
            ...prev,
            shopImages: [...prev.shopImages, publicUrl.publicUrl],
          };
          console.log("Updated shopImages state:", updatedFormData.shopImages);
          return updatedFormData;
        });
      } else {
        setFormData((prev) => ({
          ...prev,
          [field]: publicUrl.publicUrl,
        }));
      }
      
      setUploadStatus(`${field} image uploaded successfully!`);
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (error) {
      console.error('Image upload failed:', error.message);
      setError(`Failed to upload image: ${error.message}`);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleRemoveImage = (field, index) => {
    if (field === 'shopImages') {
      setFormData((prev) => ({
        ...prev,
        shopImages: prev.shopImages.filter((_, i) => i !== index)
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: ''
      }));
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
          shopImages: formData.shopImages,
          materials: formData.materials.map(m => ({
            type: m.type,
            unit:m.unit,
            price: Number(m.price)
          }))
        };
        console.log('Form data shopImages before sending:', formData.shopImages);
        console.log('Sending data to backend:', supplierData);
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
        console.log('Response from backend:', response.data);
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
      <div className="rich-text-editor">
        {editor && (
          <>
            <div className="editor-menu">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
              >
              H1
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
              >
              H2
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
              >
              H3
              </button>
              <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive('bold') ? 'is-active' : ''}
              >
              Bold
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive('italic') ? 'is-active' : ''}
              >
              Italic
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive('bulletList') ? 'is-active' : ''}
              >
              • List
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={editor.isActive('orderedList') ? 'is-active' : ''}
              >
              1. List
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().setParagraph().run()}
                className={editor.isActive('paragraph') ? 'is-active' : ''}
              >
              Paragraph
              </button>
            </div>
            <EditorContent editor={editor} />
          </>
        )}
      </div>

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
      <div className="material-labels-row">
        <label className='mat-label'>Material Type</label>
        <label className='mat-label'>Quantity Type</label>
        <label className='mat-label'>Unit Price</label>
      </div>
      {formData.materials.map((mat, index) => (
        <div key={index} className="material-row">
          <input
            type="text"
            placeholder="ex: Cotton Fabric (Blue)"
            value={mat.type}
            onChange={(e) => handleMaterialChange(index, 'type', e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="ex: Per meter"
            value={mat.unit}
            onChange={(e) => handleMaterialChange(index, 'unit', e.target.value)}
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
      <button className='add' type="button" onClick={handleAddMaterial}>+ Add Material</button>

      <label>Cover Image</label>
      <input type="file" accept="image/*" className='coverimage' onChange={(e) => handleImageUpload(e, 'cover')} />
      {formData.cover && (
        <div className="image-preview">
          <button 
            type="button" 
            className="remove-image-btn" 
            onClick={() => handleRemoveImage('cover')}
          >
            x
          </button>
          <img src={formData.cover} alt="Cover" width="120" />
        </div>
      )}

      <label>Shop Images</label>
      <input type="file" accept="image/*" className='images' onChange={(e) => handleImageUpload(e, 'shopImages')} />
      <div className="image-previews-container">
        {formData.shopImages && formData.shopImages.map((imageUrl, index) => (
          <div key={index} className="image-preview">
            <button 
              type="button" 
              className="remove-image-btn" 
              onClick={() => handleRemoveImage('shopImages', index)}
            >
              x
            </button>
            <img src={imageUrl} alt={`Shop ${index + 1}`} width="120" />
          </div>
        ))}
      </div>

      <h3>Contact Info</h3>

      <label>Mobile</label>
      <input 
        type="tel" 
        name="contactInfo.mobile" 
        value={formData.contactInfo.mobile} 
        onChange={handleChange} 
        required 
        pattern="[0-9]{10}" 
        maxLength="10" 
        placeholder="10-digit mobile number"
        
        
      />

      <label>Email</label>
      <input 
        type="email" 
        name="contactInfo.email" 
        value={formData.contactInfo.email} 
        onChange={handleChange} 
        required 
        placeholder="Enter your email"
      />

      <label>WhatsApp</label>
      <input 
        type="tel" 
        name="contactInfo.whatsapp" 
        value={formData.contactInfo.whatsapp} 
        onChange={handleChange} 
        pattern="[0-9]{10}" 
        maxLength="10" 
        placeholder="10-digit mobile number"
        
      />

      <button type="submit" className="submit-btn">Submit</button>
    </form>
  );
};

export default CreateSupplier;
