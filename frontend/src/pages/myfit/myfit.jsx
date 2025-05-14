import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "./myfit.css";

const FitModel = ({ imageUrl }) => {
  return (
    <div className="fit-model">
      <img src={imageUrl} alt="Virtual try-on result" />
    </div>
  );
};

const Myfit = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [dressImage, setDressImage] = useState(null);
  const [measurements, setMeasurements] = useState({
    bust: '',
    waist: '',
    hips: '',
    height: '',
  });
  const [loading, setLoading] = useState(false);
  const [bodyShape, setBodyShape] = useState(null);
  const [silhouettePath, setSilhouettePath] = useState(null);
  const [tryOnResult, setTryOnResult] = useState(null);
  const [error, setError] = useState(null);
  const [adjustments, setAdjustments] = useState({
    tightness: 0,
    length: 0,
    shoulder_width: 0
  });
  
  // Backend API base URL - ensure it matches your server
  const API_BASE_URL = 'http://localhost:5000';//model
  const NODE_API_URL = 'http://localhost:3000';//authentication

  // Check authentication when component mounts
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setIsAuthenticated(false);
          return;
        }
        
        const response = await fetch(`${NODE_API_URL}/myfit/api/auth-check`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, [NODE_API_URL]);

  const handleDressImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDressImage({
        file,
        preview: URL.createObjectURL(file)
      });
    }
  };

  const handleInputChange = (e) => {
    // Check if user is authenticated 
    if (isAuthenticated === false) {
      navigate('/login');
      return;
    }
    setMeasurements({ ...measurements, [e.target.name]: e.target.value });
  };

  const handleAdjustmentChange = (e) => {
    // Check if user is authenticated
    if (isAuthenticated === false) {
      navigate('/login');
      return;
    }
    setAdjustments({
      ...adjustments,
      [e.target.name]: parseInt(e.target.value, 10)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Check if user is authenticated
    if (isAuthenticated === false) {
      navigate('/login');
      return;
    }
    if (!dressImage?.file) {
      setError('Please upload a dress image');
      return;
    }
    
    // Validate measurements
    const requiredMeasurements = ['bust', 'waist', 'hips', 'height'];
    for (const measure of requiredMeasurements) {
      if (!measurements[measure]) {
        setError(`Please enter your ${measure} measurement`);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // 1. First classify body shape from measurements
      console.log('Calling body-shape API');
      const bodyShapeResponse = await fetch(`${API_BASE_URL}/api/body-shape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          measurements: {
            bust: parseFloat(measurements.bust),
            waist: parseFloat(measurements.waist),
            hips: parseFloat(measurements.hips),
            height: parseFloat(measurements.height)
          }
        }),
      });

      console.log('Body shape API response status:', bodyShapeResponse.status);
      if (!bodyShapeResponse.ok) {
        const errorText = await bodyShapeResponse.text();
        console.error('Body shape API error:', errorText);
        throw new Error('Failed to classify body shape');
      }

      const bodyShapeData = await bodyShapeResponse.json();
      console.log('Body shape data:', bodyShapeData);
      setBodyShape(bodyShapeData);
      
      // 2. Generate a silhouette from measurements
      const silhouetteResponse = await fetch(`${API_BASE_URL}/api/generate-silhouette`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          measurements: {
            bust: parseFloat(measurements.bust),
            waist: parseFloat(measurements.waist),
            hips: parseFloat(measurements.hips),
            height: parseFloat(measurements.height)
          },
          body_shape: bodyShapeData.body_shape
        }),
      });

      if (!silhouetteResponse.ok) {
        throw new Error('Failed to generate body silhouette');
      }

      const silhouetteData = await silhouetteResponse.json();
      setSilhouettePath(silhouetteData.silhouette_path);
      
      // 3. Upload dress image
      const dressFormData = new FormData();
      dressFormData.append('file', dressImage.file);
      dressFormData.append('dress_id', 'custom-dress');

      const dressResponse = await fetch(`${API_BASE_URL}/api/upload-dress-image`, {
        method: 'POST',
        body: dressFormData,
      });

      if (!dressResponse.ok) {
        throw new Error('Failed to upload dress image');
      }

      const dressData = await dressResponse.json();

      // 4. Perform virtual try-on using silhouette and dress
      const tryOnResponse = await fetch(`${API_BASE_URL}/api/virtual-try-on`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          silhouette_path: silhouetteData.silhouette_path,
          dress_image: dressData.processed_path,
          body_shape: bodyShapeData.body_shape,
          measurements: {
            bust: parseFloat(measurements.bust),
            waist: parseFloat(measurements.waist),
            hips: parseFloat(measurements.hips),
            height: parseFloat(measurements.height)
          }
        }),
      });

      if (!tryOnResponse.ok) {
        throw new Error('Failed to perform virtual try-on');
      }

      const tryOnData = await tryOnResponse.json();
      setTryOnResult(tryOnData);
      
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'An error occurred during virtual try-on');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustFit = async () => {
    // Check if user is authenticated
    if (isAuthenticated === false) {
      navigate('/login');
      return;
    }
    if (!tryOnResult?.result_image) {
      setError('No try-on result to adjust');
      return;
    }

    setLoading(true);
    setError(null);

    try {

      const imagePath = tryOnResult.result_image;

      let filePath = imagePath;
      if (imagePath.startsWith('/api/get-image/results/')) {
        filePath = `e:/Induvidual project/Dresslink-platform/backend/data/results/${imagePath.split('/').pop()}`;
      }

      const response = await fetch(`${API_BASE_URL}/adjust-fit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          previous_result: tryOnResult.result_image,
          tightness: adjustments.tightness,
          length: adjustments.length,
          shoulder_width: adjustments.shoulder_width
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to adjust fit');
      }

      const data = await response.json();
      setTryOnResult({
        ...tryOnResult,
        result_image: data.result_image.startsWith('/api/') 
          ? data.result_image 
          : data.result_image.startsWith('/') 
            ? data.result_image 
            : `/${data.result_image}`
      });
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'An error occurred while adjusting fit');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDressImage(null);
    setMeasurements({ bust: '', waist: '', hips: '', height: '' });
    setBodyShape(null);
    setSilhouettePath(null);
    setTryOnResult(null);
    setError(null);
    setAdjustments({
      tightness: 0,
      length: 0,
      shoulder_width: 0
    });
  };

  const getResultImageUrl = (path) => {
    if (!path) return null;
  
    // Handle API paths that start with /api/get-image
    if (path.startsWith('/api/get-image/')) {
      return `${API_BASE_URL}${path}`;
    }
  
    // Handle paths that start with /
    if (path.startsWith('/')) {
      return `${API_BASE_URL}${path}`;
    }
  
    // Handle full URLs
    if (path.startsWith('http')) {
      return path;
    }
  
    // For try_on_ or silhouette_ filenames
    if (path.includes('try_on_') || path.includes('silhouette_')) {
      const filename = path.split(/[\\/]/).pop();
      return `${API_BASE_URL}/${filename}`;
    }
  
    // For other paths containing data
    if (path.includes('data')) {
      const relativePath = path.replace(/^.*[\\\/]data[\\\/]/, '');
      return `${API_BASE_URL}/api/get-image/${relativePath.replace(/\\/g, '/')}`;
    }
  
    // Default case
    return `${API_BASE_URL}/${path}`;
  };

  // Cleanup URL objects when component unmounts
  React.useEffect(() => {
    return () => {
      if (dressImage?.preview) URL.revokeObjectURL(dressImage.preview);
    };
  }, [dressImage]);

  return (
    <div className="myfit">
      <div className="myfit-img"></div>
      <h1>Style It, Fit It, Love It</h1>
      <p>Enter your measurements and upload a dress to see how it will fit your body shape.</p>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className='preview-container'>
        <div className="left-panel">
          <form onSubmit={handleSubmit} className="fit-form">
            <div className="measurements-section">
              <h3>Your Body Measurements</h3>
              <p>Enter your measurements in centimeters</p>
              
              <div className="measurements-grid">
                <div className="measurement-input">
                  <label htmlFor="height">Height</label>
                  <input
                    type="number"
                    id="height"
                    name="height"
                    value={measurements.height}
                    onChange={handleInputChange}
                    onClick={()=>{
                      if(isAuthenticated === false) {
                        navigate('/login');
                      }
                    }}
                    placeholder="cm"
                    min="120"
                    max="220"
                    required
                  />
                </div>
                
                <div className="measurement-input">
                  <label htmlFor="bust">Bust</label>
                  <input
                    type="number"
                    id="bust"
                    name="bust"
                    value={measurements.bust}
                    onChange={handleInputChange}
                    onClick={()=>{
                      if(isAuthenticated === false) {
                        navigate('/login');
                      }
                    }}
                    placeholder="cm"
                    min="60"
                    max="150"
                    required
                  />
                </div>
                
                <div className="measurement-input">
                  <label htmlFor="waist">Waist</label>
                  <input
                    type="number"
                    id="waist"
                    name="waist"
                    value={measurements.waist}
                    onChange={handleInputChange}
                    onClick={()=>{
                      if(isAuthenticated === false) {
                        navigate('/login');
                      }
                    }}
                    placeholder="cm"
                    min="50"
                    max="140"
                    required
                  />
                </div>
                
                <div className="measurement-input">
                  <label htmlFor="hips">Hips</label>
                  <input
                    type="number"
                    id="hips"
                    name="hips"
                    value={measurements.hips}
                    onChange={handleInputChange}
                    onClick={()=>{
                      if(isAuthenticated === false) {
                        navigate('/login');
                      }
                    }}
                    placeholder="cm"
                    min="70"
                    max="160"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="dress-upload-section">
              <h3>Upload Dress Photo</h3>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleDressImageChange}
                onClick={(e)=>{
                  if(isAuthenticated === false) {
                    e.preventDefault();
                    navigate('/login');
                  }
                }}
                required 
                id="dress-upload"
                className="file-input"
              />
              <label htmlFor="dress-upload" className="file-label">
                Choose a dress image
              </label>
              
              {dressImage?.preview && (
                <div className="preview-image">
                  <img src={dressImage.preview} alt="Uploaded dress" />
                </div>
              )}
            </div>
            
            <div className="form-buttons">
              <button type="submit" 
                disabled={loading} 
                onClick={(e)=>{
                  if(isAuthenticated === false) {
                    navigate('/login');
                  }
                }} 
                className="primary-button"
              >
                {loading ? 'Processing...' : 'Generate 2D Fit Preview'}
              </button>
              <button type="button" onClick={handleReset} className="secondary-button">
                Reset
              </button>
            </div>
            
            {bodyShape && tryOnResult && (
              <div className="fit-adjustments">
                <h3>Adjust Your Fit</h3>
                <div className="slider-controls">
                  <label>
                    <span className="slider-label">Tightness:</span>
                    <input
                      type="range"
                      name="tightness"
                      min="-10"
                      max="10"
                      value={adjustments.tightness}
                      onChange={handleAdjustmentChange}
                    />
                    <span className="slider-value">{adjustments.tightness > 0 ? `+${adjustments.tightness}` : adjustments.tightness}</span>
                  </label>
                  
                  <label>
                    <span className="slider-label">Length:</span>
                    <input
                      type="range"
                      name="length"
                      min="-10"
                      max="10"
                      value={adjustments.length}
                      onChange={handleAdjustmentChange}
                    />
                    <span className="slider-value">{adjustments.length > 0 ? `+${adjustments.length}` : adjustments.length}</span>
                  </label>
                  
                  <label>
                    <span className="slider-label">Shoulder Width:</span>
                    <input
                      type="range"
                      name="shoulder_width"
                      min="-10"
                      max="10"
                      value={adjustments.shoulder_width}
                      onChange={handleAdjustmentChange}
                    />
                    <span className="slider-value">{adjustments.shoulder_width > 0 ? `+${adjustments.shoulder_width}` : adjustments.shoulder_width}</span>
                  </label>
                </div>
                
                <button 
                  type="button" 
                  onClick={handleAdjustFit} 
                  disabled={loading}
                  className="adjust-button"
                >
                  {loading ? 'Adjusting...' : 'Apply Adjustments'}
                </button>
              </div>
            )}
          </form>
        </div>
        
        <div className="right-panel">
          {!tryOnResult && (
            <div className="placeholder">
              <h3>2D Fit Preview</h3>
              <p>Enter your measurements and upload a dress to see how it would look on your body shape.</p>
            </div>
          )}
          
          {tryOnResult && (
            <div className="fit-result">
              <h3>Your 2D Fit Preview</h3>
              {bodyShape && (
                <div className="body-shape-info">
                  <p><strong>Your Body Shape:</strong> <span className="body-shape-type">{bodyShape.body_shape}</span></p>
                </div>
              )}
              
              <div className="model-preview">
                <FitModel imageUrl={getResultImageUrl(tryOnResult.result_image)} />
                <p className="preview-note">This 2D preview shows how the dress fits your body shape based on your measurements.</p>
              </div>
              
              <div className="fit-recommendation">
                <h4>Fit Analysis:</h4>
                <p>Based on your body shape and measurements, this dress appears to be a {bodyShape && tryOnResult ? getFitDescription(bodyShape.body_shape, measurements) : "good"} fit for you.</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="loading-overlay">
              <div className="spinner"></div>
              <p>Generating your 2D fit preview...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to generate fit description based on body shape
const getFitDescription = (bodyShape, measurements) => {
  const bust = parseFloat(measurements.bust);
  const waist = parseFloat(measurements.waist);
  const hips = parseFloat(measurements.hips);
  
  switch(bodyShape.toLowerCase()) {
    case 'hourglass':
      return "flattering";
    case 'apple':
      return waist > 80 ? "comfortable" : "slightly fitted";
    case 'pear':
      return hips > 100 ? "relaxed around hips" : "well-balanced";
    case 'rectangle':
      return "streamlined";
    default:
      return "good";
  }
};

export default Myfit;