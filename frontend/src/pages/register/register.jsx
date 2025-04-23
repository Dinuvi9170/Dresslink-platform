import React, { useState } from "react";
import axios from "axios";
import {supabase} from "../../utils/supabaseClient"; 
import "./register.css";

const rolesList = ["customer", "professional", "supplier"];

const Register = () => {
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    email: "",
    password: "",
    confirmPassword: "",
    roles: [],
    image: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      roles: checked
        ? [...prev.roles, value]
        : prev.roles.filter((role) => role !== value),
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
       console.log("Selected file:", file); 
      setFormData((prev) => ({ ...prev, image: file }));
    }
  };
  const uploadImageToSupabase = async (file) => {
    try {
      if (file.size > 2 * 1024 * 1024) {
        alert("File size exceeds 2MB limit. Please choose a smaller file.");
        return null;
      }
  
      const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const filepath = `profiles/${fileName}`;
      
      // Upload the file to supabase storage
      const { data, error } = await supabase.storage
        .from("dinuvi1")
        .upload(filepath, file, {
          upsert: true,
          cacheControl: "3600",
          contentType: file.type
        });
  
      if (error) {
        console.error("Error uploading file:", error.message);
        
        // If it's a permissions issue, provide clearer feedback
        if (error.message.includes("security policy")) {
          alert("Permission denied to upload files. Please contact admin to update storage permissions.");
        } else {
          alert("Failed to upload image: " + error.message);
        }
        return null;
      }
  
      // Get public URL only if upload was successful
      const { data: urlData } = supabase.storage
        .from("dinuvi1")
        .getPublicUrl(filepath);
        
      console.log("File uploaded successfully:", urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("An unexpected error occurred during image upload.");
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    
    if (formData.roles.length === 0) {
      alert("Please select at least one role");
      return;
    }
    
    try {
      // Set default image URL
      let imageUrl = "https://avatar.iran.liara.run/public/boy?username=Ash"; // Default image
      
      // Try to upload image if provided
      if (formData.image) {
        const uploadedUrl = await uploadImageToSupabase(formData.image);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
        // If upload fails, we'll use the default image
      }
  
      // Create user data with image URL (either uploaded or default)
      const userData = {
        fname: formData.fname,
        lname: formData.lname,
        email: formData.email,
        password: formData.password,
        role: formData.roles[0], // Backend expects single role, not array
        image: imageUrl,
      };
  
      // Submit to backend
      const response = await axios.post("http://localhost:3000/user/register", userData);
      
      if (response.status === 201) {
        alert("Registration successful!");
        // Reset form or redirect user
      } else {
        alert("Registration failed. Please try again.");
      }
    } catch (err) {
      console.error("Registration failed:", err);
      alert("Registration failed: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="register-container">
      <h2>Create a New Account</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>First Name</label><span className="required">*</span>
          <input name="fname" type="text" value={formData.fname} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Last Name</label><span className="required">*</span>
          <input name="lname" type="text" value={formData.lname} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Email</label><span className="required">*</span>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Roles</label><span className="required">*</span>
          <div className="checkbox-group">
            {rolesList.map((role) => (
              <label key={role}>
                <input
                  type="checkbox"
                  value={role}
                  checked={formData.roles.includes(role)}
                  onChange={handleRoleChange}
                />
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Password</label><span className="required">*</span>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Confirm Password</label><span className="required">*</span>
          <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Profile Image</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </div>

        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;
