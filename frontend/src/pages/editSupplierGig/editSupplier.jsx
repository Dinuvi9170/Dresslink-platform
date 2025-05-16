import React, { useState, useEffect, use } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './editSupplier.css';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { supabase } from '../../utils/supabaseClient';

const EditSupplier = () => {
    const params = useParams();
    const { profileId } = params;
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [fetchingGig, setFetchingGig] = useState(true);
    const [error, setError] = useState(null);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [formData, setFormData] = useState({
        ShopName: '',
        shopDescription: '',
        materialOffered: [],
        materials: [{ type: '', unit: '', price: '' }],
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

    // Update editor content when formData changes
    useEffect(() => {
        if (editor && formData.shopDescription && !fetchingGig) {
            editor.commands.setContent(formData.shopDescription);
        }
    }, [editor, formData.shopDescription, fetchingGig]);

    // Check authentication and fetch gig data
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login', { state: { from: `/editSupplierGig/${profileId}` } });
            return;
        }

        // Fetch the gig data
        const fetchGig = async () => {
            try {
                setFetchingGig(true);
                const response = await axios.get(`http://localhost:3000/suppliers/${profileId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                // Format materials array
                const gig = response.data;
                
                setFormData({
                    ShopName: gig.ShopName || '',
                    shopDescription: gig.shopDescription || '',
                    materialOffered: gig.materialOffered || [],
                    materials: gig.materials && gig.materials.length > 0 ? gig.materials : [{ type: '', unit: '', price: '' }],
                    cover: gig.cover || '',
                    contactInfo: {
                        mobile: gig.contactInfo?.mobile || '',
                        email: gig.contactInfo?.email || '',
                        whatsapp: gig.contactInfo?.whatsapp || '',
                    },
                    title: gig.title || '',
                    shopImages: gig.shopImages || [],
                });
                
                setFetchingGig(false);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching gig:', err);
                
                if (err.response?.status === 401 || err.response?.status === 403) {
                    localStorage.removeItem('token');
                    navigate('/login', { state: { from: `/editSupplierGig/${ProfileId}` } });
                    return;
                }
                
                setError(err.response?.data?.message || 'Failed to load gig data');
                setFetchingGig(false);
                setLoading(false);
            }
        };

        fetchGig();
    }, [profileId, navigate]);

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
            const field = name.split('.')[1];
            setFormData((prev) => ({
                ...prev,
                contactInfo: { ...prev.contactInfo, [field]: value },
            }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
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
            materials: [...prev.materials, { type: '', unit: '', price: '' }],
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
                setError('Image size should be less than 2MB');
                setUploadStatus(null);
                return;
            }
            
            const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
            const filePath = `suppliers/${field}/${fileName}`;
            
            const { data, error: uploadError } = await supabase.storage
                .from('dinuvi1')
                .upload(filePath, file, {
                    upsert: true,
                    cacheControl: "3600",
                    contentType: file.type
                });

            if (uploadError) {
                setError(`Error uploading image: ${uploadError.message}`);
                setUploadStatus(null);
                return;
            }
            
            const { data: publicUrl } = supabase.storage
                .from('dinuvi1')
                .getPublicUrl(filePath);
            
            // Special handling for shopImages field to support multiple images
            if (field === 'shopImages') {
                setFormData(prev => ({
                    ...prev,
                    shopImages: [...prev.shopImages, publicUrl.publicUrl]
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    [field]: publicUrl.publicUrl
                }));
            }
            
            setUploadStatus(null);
        } catch (error) {
            console.error('Image upload error:', error);
            setError(`Error uploading image: ${error.message}`);
            setUploadStatus(null);
        }
    };

    const handleRemoveImage = (field, index) => {
        if (field === 'shopImages') {
            const updatedImages = [...formData.shopImages];
            updatedImages.splice(index, 1);
            setFormData(prev => ({
                ...prev,
                shopImages: updatedImages
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setUploadStatus('Updating supplier profile...'); 

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login', { state: { from: `/editSupplierGig/${profileId}` } });
                return;
            }

            // Validate form data
            if (!formData.ShopName || !formData.title || !formData.cover || 
                !formData.contactInfo.mobile || !formData.contactInfo.email) {
                setError('Please fill in all required fields');
                setLoading(false);
                setUploadStatus(null);
                return;
            }

            // Check that all materials have type, unit, and price
            const invalidMaterials = formData.materials.some(
                mat => !mat.type || !mat.unit || mat.price === ''
            );
            if (invalidMaterials) {
                setError('Please complete all material details (type, unit, price)');
                setLoading(false);
                setUploadStatus(null);
                return;
            }

            // Submit the updated gig
            const response = await axios.put(
                `http://localhost:3000/suppliers/${profileId}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            setLoading(false);
            setUploadStatus('Supplier profile updated successfully!');
            
            // Navigate to manage gigs page after a short delay
            setTimeout(() => {
                navigate('/manageSupplierGigs');
            }, 1500);
            
        } catch (err) {
            console.error('Error updating supplier profile:', err);
            setError(err.response?.data?.message || 'Failed to update supplier profile');
            setLoading(false);
            setUploadStatus(null);
        }
    };

    if (fetchingGig) {
        return <div className="loading">Loading gig data...</div>;
    }

    return (
        <form onSubmit={handleSubmit} className="supplier-form">
            <h2>Edit Supplier Profile</h2>
            
            {error && <div className="error-message">{error}</div>}
            {uploadStatus && <div className="upload-status">{uploadStatus}</div>}
            
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
            <button type="button" className="add-material-btn" onClick={handleAddMaterial}>+ Add Material</button>

            <label>Cover Image</label>
            {formData.cover ? (
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
            ) : (
                <input type="file" accept="image/*" className='coverimage' onChange={(e) => handleImageUpload(e, 'cover')} />
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

            <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => navigate('/manageSupplierGigs')}>
                    Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Profile'}
                </button>
            </div>
        </form>
    );
};

export default EditSupplier;
