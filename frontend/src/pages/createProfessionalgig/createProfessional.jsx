import React, {useState, useEffect} from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './createProfessional.css';

const CreateProfessional = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
        }
    }, [navigate]);

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('You must be logged in to create a gig');
            }
            
            // Create data object for API
            const gigData = {
                ...formData,
                price: Number(formData.price) 
            };
            
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
        }
    };

    return (
        <div className="create-gig-container">
          <h1>Create Your Professional Gig</h1>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit} className="create-gig-form">
            <input type="text" name="title" placeholder="Full Gig Title" required value={formData.title} onChange={handleChange} />
            <input type="text" name="shorttitle" placeholder="Short Title" required value={formData.shorttitle} onChange={handleChange}  />
            <textarea name="description" placeholder="Detailed Description" required value={formData.description} onChange={handleChange}></textarea>
            <textarea name="shortdesc" placeholder="Short Description" required value={formData.shortdesc} onChange={handleChange}></textarea>
            <input type="number" name="price" placeholder="Starting Price (LKR)" required value={formData.price} onChange={handleChange} />
            <select name="category" required value={formData.category} onChange={handleChange}>
              <option value="tailoring">Tailoring</option>
              <option value="designing">Designing</option>
            </select>
            <label>Cover Image:</label>
            <input type="file" name="cover" accept="image/*"  />
            <label>Gallery Images (you can select multiple):</label>
            <input type="file" name="images" accept="image/*" multiple  />
            <button type="submit" >Submit Gig</button>
          </form>
        </div>
    );
}

export default CreateProfessional;