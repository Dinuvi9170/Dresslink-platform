import React, {useState, useEffect} from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient'; 
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

    // Handle file input changes
    const handleFileChange = (e) => {
        const { name, files } = e.target;
        
        if (name === 'cover') {
            setFormData(prev => ({
                ...prev,
                [name]: files[0]
            }));
        } else if (name === 'images') {
            setFormData(prev => ({
                ...prev,
                [name]: Array.from(files)
            }));
        }
    };

    // Upload a single image to Supabase
    const uploadImageToSupabase = async (file, folder) => {
        try {
            if (file.size > 2 * 1024 * 1024) {
                throw new Error("File size exceeds 2MB limit. Please choose a smaller file.");
            }
            
            const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
            const filepath = `${folder}/${fileName}`;
            
            // Upload the file to Supabase storage
            const { data, error } = await supabase.storage
                .from("dinuvi1")
                .upload(filepath, file, {
                    upsert: true,
                    cacheControl: "3600",
                    contentType: file.type
                });
            
            if (error) {
                console.error("Error uploading file:", error.message);
                throw new Error(error.message);
            }
            
            // Get public URL
            const { data: urlData } = supabase.storage
                .from("dinuvi1")
                .getPublicUrl(filepath);
                
            console.log("File uploaded successfully:", urlData.publicUrl);
            return urlData.publicUrl;
        } catch (error) {
            console.error("Error in upload:", error);
            throw error;
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

            // Upload cover image
            let coverUrl = null;
            if (formData.cover) {
                setUploadStatus('Uploading cover image...');
                coverUrl = await uploadImageToSupabase(formData.cover, 'gigs/covers');
            }

            // Upload gallery images
            let imageUrls = [];
            if (formData.images && formData.images.length > 0) {
                setUploadStatus('Uploading gallery images...');
                for (const image of formData.images) {
                    const url = await uploadImageToSupabase(image, 'gigs/gallery');
                    imageUrls.push(url);
                }
            }
            setUploadStatus('Creating gig...');
            
            // Create data object for API
            const gigData = {
                ...formData,
                price: Number(formData.price),
                cover: coverUrl,
                images: imageUrls, 
                description: formData.description.replace(/\n/g, '\\n'),
            };

            // Add the URLs
            if (coverUrl) gigData.coverUrl = coverUrl;
            if (imageUrls.length > 0) gigData.imageUrls = imageUrls;
            
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
            <input type="text" name="title" placeholder="Full Gig Title" required value={formData.title} onChange={handleChange} />
            <input type="text" name="shorttitle" placeholder="Short Title" required value={formData.shorttitle} onChange={handleChange}  />
            <textarea name="description" placeholder="Detailed Description" required value={formData.description} className="preserve-newlines" onChange={handleChange}></textarea>
            <textarea name="shortdesc" placeholder="Short Description" required value={formData.shortdesc} onChange={handleChange}></textarea>
            <input type="number" name="price" placeholder="Starting Price (LKR)" required value={formData.price} onChange={handleChange} />
            <select name="category" required value={formData.category} onChange={handleChange}>
              <option value="tailoring">Tailoring</option>
              <option value="designing">Designing</option>
            </select>
            <label>Cover Image(Max 2MB):</label>
            <input type="file" name="cover" accept="image/*" required onChange={handleFileChange} />
            {formData.cover && (
              <div className="preview">
                <p>Selected cover: {formData.cover.name}</p>
              </div>
            )}
            <label>Gallery Images (you can select multiple, Max 2MB each):</label>
            <input type="file" name="images" accept="image/*" multiple onChange={handleFileChange} />
            {formData.images.length > 0 && (
              <div className="preview">
                <p>Selected {formData.images.length} images</p>
              </div>
            )}
            <button type="submit" >Submit Gig</button>
          </form>
        </div>
    );
}

export default CreateProfessional;