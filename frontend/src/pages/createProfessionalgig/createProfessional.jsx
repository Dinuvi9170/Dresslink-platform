import React, {useState, useEffect} from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit'; 
import './createProfessional.css';

const CreateProfessional = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [uploadStatus, setUploadStatus] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        shorttitle: '',
        description: '',
        shortdesc: '',
        price: '',
        category: 'tailoring',
        cover: null,
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

    //check authentication
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login', { state: { from: '/createProfessioonalgig' } });
            return;
        }

        // Make a test request to verify the token is valid
        const verifyToken = async () => {
            try {
                await axios.get('http://localhost:3000/gigs', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                // If successful, set loading to false
                setLoading(false);
            } catch (err) {
                console.error('Token verification failed:', err);
                // If token is invalid, redirect to login
                navigate('/login', { state: { from: '/createProfessioonalgig' } });
            }
        };
        verifyToken();
    }, [navigate]);

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    // upload images
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
          
          // Special handling for shopImages field to support multiple images
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
        setUploadStatus('Uploading...');
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('You must be logged in to create a gig');
            }

            // Check for required fields
            if (!formData.title || !formData.shorttitle || !formData.description || 
                !formData.shortdesc || !formData.price || !formData.cover) {
                throw new Error('Please fill in all required fields and upload a cover image');
            }

            setUploadStatus('Creating gig...');
            
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
            console.log("Submitting data:", gigData);
            // Send request to backend
            const response = await axios.post(
                'http://localhost:3000/gigs/creategig',
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
            alert('Gig created successfully!');
            navigate('/professionals'); 
            
        } catch (err) {
            console.error('Error creating gig:', err);
            setError(err.response?.data?.message || err.response?.data?.error || 'Failed to create gig. Please try again.');
        } finally {
            setLoading(false);
            setUploadStatus('');
        }
    };

    return (
        <div className="create-gig-container">
          <h1>Create Your Professional Gig</h1>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit} className="create-gig-form">
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
            
            <label>Cover Image(Max 2MB):</label>
            <input type="file" name="cover" accept="image/*" required onChange={(e) => handleImageUpload(e, 'covers')} />
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
            <button type="submit" >Submit Gig</button>
          </form>
        </div>
    );
}

export default CreateProfessional;
