import React, {useState} from 'react';
import axios from 'axios';
import './createProfessional.css';

const CreateProfessional = () => {
    const [formData, setFormData] = useState({
        title: '',
        shorttitle: '',
        description: '',
        shortdesc: '',
        price: '',
        category: 'tailoring',
        cover: '',
        images: []
      });
    
      const handleChange = (e) => {
        const { name, value, files } = e.target;
    
        if (name === 'images') {
          const fileArray = Array.from(files);
          setFormData((prev) => ({ ...prev, images: fileArray }));
        } else if (name === 'cover') {
          setFormData((prev) => ({ ...prev, cover: files[0] }));
        } else {
          setFormData((prev) => ({ ...prev, [name]: value }));
        }
      };
    
      const handleSubmit = async (e) => {
        e.preventDefault();
    
        try {
          const gigData = new FormData();
          for (const key in formData) {
            if (key === 'images') {
              formData.images.forEach((img) => gigData.append('images', img));
            } else {
              gigData.append(key, formData[key]);
            }
          }
    
          const res = await axios.post('/api/gigs/professional', gigData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
    
          alert('Gig created successfully!');
          console.log(res.data);
        } catch (error) {
          console.error('Error creating gig:', error);
          alert('Failed to create gig.');
        }
      };
    
      return (
        <div className="create-gig-container">
          <h1>Create Your Professional Gig</h1>
          <form onSubmit={handleSubmit} className="create-gig-form">
            <input type="text" name="title" placeholder="Full Gig Title" required onChange={handleChange} />
            <input type="text" name="shorttitle" placeholder="Short Title" required onChange={handleChange} />
            <textarea name="description" placeholder="Detailed Description" required onChange={handleChange}></textarea>
            <textarea name="shortdesc" placeholder="Short Description" required onChange={handleChange}></textarea>
            <input type="number" name="price" placeholder="Starting Price (LKR)" required onChange={handleChange} />
            <select name="category" required onChange={handleChange}>
              <option value="tailoring">Tailoring</option>
              <option value="designing">Designing</option>
            </select>
            <label>Cover Image:</label>
            <input type="file" name="cover" accept="image/*" required onChange={handleChange} />
            <label>Gallery Images (you can select multiple):</label>
            <input type="file" name="images" accept="image/*" multiple onChange={handleChange} />
            <button type="submit">Submit Gig</button>
          </form>
        </div>
      );
}

export default CreateProfessional;