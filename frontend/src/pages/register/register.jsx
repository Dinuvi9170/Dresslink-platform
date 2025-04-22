import React, { useState } from "react";
import axios from "axios";
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
    image: ""
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
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, image: reader.result }));
    };
    if (file) {
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    if (formData.roles.length === 0) {
      alert("Please select at least one role");
      return;
    }
    try {
      await axios.post("http://localhost:3000/user/register", formData);
      alert("Registration successful!");
    } catch (err) {
      console.error("Registration failed:", err);
      alert("Registration failed");
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
