import React, { useState } from 'react';
import "./myfit.css";

const Myfit = () => {
  const [image, setImage] = useState(null);
  const [measurements, setMeasurements] = useState({
    bust: '',
    waist: '',
    hips: '',
    height: '',
  });
  const [showModel, setShowModel] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

  const handleInputChange = (e) => {
    setMeasurements({ ...measurements, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowModel(true);
  };

  const handleReset = () => {
    setImage(null);
    setMeasurements({ bust: '', waist: '', hips: '', height: '' });
    setShowModel(false);
  };

  return (
    <div className="myfit">
      <div className="myfit-img"></div>
      <h1>Preview My Fit</h1>
      <p>Upload your design and get a preview of how it will look on you.</p>
      <div className='preview-container'>
        <div className="left-panel">
          <form onSubmit={handleSubmit} className="fit-form">
            <label>Upload Dress Photo</label>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {image && (
              <div className="preview-image">
                <img src={image} alt="Uploaded" />
              </div>
            )}

            <label>Enter Your Body Measurements (in inches)</label>
            <input
              type="number"
              name="bust"
              placeholder="Bust"
              value={measurements.bust}
              onChange={handleInputChange}
              required
            />
            <input
              type="number"
              name="waist"
              placeholder="Waist"
              value={measurements.waist}
              onChange={handleInputChange}
              required
            />
            <input
              type="number"
              name="hips"
              placeholder="Hips"
              value={measurements.hips}
              onChange={handleInputChange}
              required
            />
            <input
              type="number"
              name="height"
              placeholder="Height"
              value={measurements.height}
              onChange={handleInputChange}
              required
            />

            <div className="form-buttons">
              <button type="submit">Generate 2D Fit Model</button>
              <button type="button" onClick={handleReset}>Reset</button>
            </div>
          </form>
        </div>
        <div className="right-panel">
          <p>Display here your 2D Fit Preview</p>
          {showModel && (
            <div className="fit-result">
              <h3>Your 2D Fit Preview</h3>
              <div className="model-preview">
                <p> Simulated 2D model generated based on your inputs.</p>
                <div className="fake-2d-model">[2D Model Here]</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Myfit;
