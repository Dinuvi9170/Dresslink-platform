import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import './editprof.css';

const EditProf = () => {
    const params = useParams();
    const { profileId } = params;
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [fetchingGig, setFetchingGig] = useState(true);
    const [error, setError] = useState(null);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        shorttitle: '',
        description: '',
        shortdesc: '',
        price: '',
        category: 'tailoring',
        cover: '',
        images: [],
    });

    // Initialize TipTap editor
    const editor = useEditor({
        extensions: [
            StarterKit,
        ],
        content: formData.description,
        onUpdate: ({ editor }) => {
            setFormData(prev => ({
                ...prev,
                description: editor.getHTML()
            }));
        },
    });

    // Update editor content when formData changes
    useEffect(() => {
        if (editor && formData.description && !fetchingGig) {
            editor.commands.setContent(formData.description);
        }
    }, [editor, formData.description, fetchingGig]);

    // Check authentication and fetch gig data
    useEffect(() => {
        console.log("Gig ID from params:",profileId);
        
        //if no ID is provided skip
        if (!profileId) {
            console.error("No gig ID provided in URL");
            navigate('/manageGigs', { 
                state: { error: "No gig ID was provided. Please select a gig to edit." } 
            });
            return;
        }
        
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login', { state: { from: `/editProfessionalGig/${profileId}` } });
            return;
        }

        // Fetch the gig data
        const fetchGig = async () => {
            try {
                setFetchingGig(true);
                console.log(`Fetching professional gig data for ID: ${profileId}`);
                
                const response = await axios.get(`http://localhost:3000/gigs/${profileId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                // Format data
                const gig = response.data;
                console.log("Gig data received:", gig);
                
                setFormData({
                    title: gig.title || '',
                    shorttitle: gig.shorttitle || '',
                    description: gig.description || '',
                    shortdesc: gig.shortdesc || '',
                    price: gig.price || '',
                    category: gig.category || 'tailoring',
                    cover: gig.cover || '',
                    images: gig.images || [],
                });
                
                setFetchingGig(false);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching gig:', err);
                
                if (err.response?.status === 401 || err.response?.status === 403) {
                    localStorage.removeItem('token');
                    navigate('/login', { state: { from: `/editProfessionalGig/${profileId}` } });
                    return;
                }
                
                setError(err.response?.data?.message || 'Failed to load gig data');
                setFetchingGig(false);
                setLoading(false);
            }
        };

        fetchGig();
    }, [profileId, navigate]);

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Upload images
    const handleImageUpload = async (e, field) => {
        const file = e.target.files[0];
        if (!file) return;
    
        try {
            setUploadStatus(`Uploading ${field} image...`);
            
            if (file.size > 2 * 1024 * 1024) {
                throw new Error("File size exceeds 2MB limit. Please choose a smaller file.");
            }
            
            const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
            const filePath = `gigs/${field}/${fileName}`;
            
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

            const statefield = field === 'covers' ? 'cover' : 'images';
            
            // Special handling for images field to support multiple images
            if (statefield === 'images') {
                setFormData((prev) => {
                    const updatedFormData = {
                        ...prev,
                        images: [...prev.images, publicUrl.publicUrl],
                    };
                    console.log("Updated gallery images state:", updatedFormData.images);
                    return updatedFormData;
                });
            } else {
                setFormData((prev) => ({
                    ...prev,
                    cover: publicUrl.publicUrl,
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

    // Remove images
    const handleRemoveImage = (field, index) => {
        if (field === 'images') {
            setFormData((prev) => ({
                ...prev,
                images: prev.images.filter((_, i) => i !== index)
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [field]: null
            }));
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setUploadStatus('Updating...');
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('You must be logged in to update a gig');
            }

            // Check for required fields
            if (!formData.title || !formData.shorttitle || !formData.description || 
                !formData.shortdesc || !formData.price || !formData.cover) {
                throw new Error('Please fill in all required fields and upload a cover image');
            }

            setUploadStatus('Updating gig...');
            
            // Create data object for API
            const gigData = {
                title: formData.title,
                shorttitle: formData.shorttitle,
                shortdesc: formData.shortdesc,
                description: formData.description,
                price: Number(formData.price),
                category: formData.category,
                cover: formData.cover,
                images: formData.images || []
            };
            
            console.log("Submitting updated data:", gigData);
            
            // Send request to backend
            const response = await axios.put(
                `http://localhost:3000/gigs/${profileId}`,
                gigData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            // Handle success
            console.log('Response from backend:', response.data);
            setUploadStatus('Gig updated successfully!');
            
            // Navigate to manage gigs page 
            setTimeout(() => {
                navigate('/manageGigs');
            }, 1500);
            
        } catch (err) {
            console.error('Error updating gig:', err);
            setError(err.response?.data?.message || err.response?.data?.error || 'Failed to update gig. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading && fetchingGig) {
        return <div className="loading">Loading gig data...</div>;
    }

    return (
        <div className="edit-gig-container">
            <h1>Edit Professional Gig</h1>
            {error && <div className="error-message">{error}</div>}
            {uploadStatus && <div className="upload-status">{uploadStatus}</div>}
            
            <form onSubmit={handleSubmit} className="edit-gig-form">
                <label>Gig Title:</label>
                <input type="text" name="title" placeholder="Full Gig Title" required value={formData.title} onChange={handleChange} />
                
                <label>Short Title:</label>
                <input type="text" name="shorttitle" placeholder="Short Title" required value={formData.shorttitle} onChange={handleChange}  />
                
                <label>Short Description:</label>
                <textarea name="shortdesc" placeholder="Short Description" required value={formData.shortdesc} onChange={handleChange}></textarea>
                
                <label>Detailed Description:</label>
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
                
                <label>Starting Price:</label>
                <input type="number" name="price" placeholder="Starting Price (LKR)" required value={formData.price} onChange={handleChange} />
                
                <label>Select Category</label>
                <select name="category" required value={formData.category} onChange={handleChange}>
                    <option value="tailoring">Tailoring</option>
                    <option value="designing">Designing</option>
                </select>
                
                <label>Cover Image (Max 2MB):</label>
                <input type="file" name="cover" accept="image/*" onChange={(e) => handleImageUpload(e, 'covers')} />
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
                
                <label>Gallery Images (you can select multiple, Max 2MB each):</label>
                <input type="file" name="images" accept="image/*" multiple onChange={(e) => handleImageUpload(e, 'gallery')} />
                <div className="image-previews-container">
                    {formData.images && formData.images.map((imageUrl, index) => (
                        <div key={index} className="image-preview">
                            <button 
                                type="button" 
                                className="remove-image-btn" 
                                onClick={() => handleRemoveImage('images', index)}
                            >
                                x
                            </button>
                            <img src={imageUrl} alt={`Gallery ${index + 1}`} width="120" />
                        </div>
                    ))}
                </div>
                
                <div className="form-actions">
                    <button type="button" className="cancel-btn" onClick={() => navigate('/manageGigs')}>
                        Cancel
                    </button>
                    <button type="submit" className="save-btn">
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditProf;
