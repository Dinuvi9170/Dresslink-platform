import React, { useState, useEffect } from "react";
import "./fitmodel.css";

const FitModel = ({ image, measurements }) => {
  const { bust, waist, hips, height } = measurements;
  const [imageLoaded, setImageLoaded] = useState(false);
  const [processedImage, setProcessedImage] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Convert measurements to numbers with defaults
  const bustSize = parseInt(bust) || 36;
  const waistSize = parseInt(waist) || 28;
  const hipSize = parseInt(hips) || 38;
  const heightSize = parseInt(height) || 64;
  
  // Calculate size adjustments based on measurements
  const bustScale = bustSize / 36; // Using 36 as a baseline
  const waistScale = waistSize / 28; // Using 28 as a baseline
  const hipScale = hipSize / 38; // Using 38 as a baseline
  const heightScale = heightSize / 64; // Using 64" (5'4") as baseline
  
  // Calculate overall dress width based on largest measurement
  const widthScale = Math.max(bustScale, waistScale * 1.1, hipScale * 1.05);
  
  // Calculate visual adjustments for the dress points
  const bustPoint = 22; // % from top
  const waistPoint = 38; // % from top
  const hipPoint = 55; // % from top
  
  // Visual transformation based on measurements
  const transformValue = `scale(${widthScale}, ${heightScale})`;

  // Process the image to remove background (simulated)
  useEffect(() => {
    if (image) {
      setProcessing(true);
      
      // Create a new image object to load the original image
      const img = new Image();
      img.crossOrigin = "Anonymous"; // Enable CORS if image is from another domain
      
      img.onload = () => {
        try {
          // Create a canvas to manipulate the image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Set canvas dimensions to match image
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw the original image
          ctx.drawImage(img, 0, 0);
          
          // Get image data for manipulation
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Simple background removal - detect edges and apply transparency
          // This is a simplified approach and won't work perfectly for all images
          const threshold = 20; // Adjust for better edge detection
          
          // Process the image (simplified algorithm)
          // In a real app, you would use a more sophisticated algorithm or API
          for (let i = 0; i < data.length; i += 4) {
            // Check if pixel is near the edge by comparing with neighbors
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Simple edge detection (check if this is a background pixel)
            // This is just a simulation - in real apps use ML-based services
            const x = (i / 4) % canvas.width;
            const y = Math.floor((i / 4) / canvas.width);
            
            // Check if pixel is near edges of the image - likely background
            const isEdge = x < 5 || y < 5 || x > canvas.width - 5 || y > canvas.height - 5;
            
            // If likely a background pixel (edges or very light color)
            if (isEdge || (r > 240 && g > 240 && b > 240)) {
              // Make it transparent
              data[i + 3] = 0;
            }
          }
          
          // Put the processed image data back on the canvas
          ctx.putImageData(imageData, 0, 0);
          
          // Convert to data URL
          const processedDataUrl = canvas.toDataURL("image/png");
          setProcessedImage(processedDataUrl);
          setImageLoaded(true);
          setProcessing(false);
        } catch (error) {
          console.error("Error processing image:", error);
          // Fallback to original image if processing fails
          setProcessedImage(image);
          setImageLoaded(true);
          setProcessing(false);
        }
      };
      
      img.onerror = () => {
        console.error("Error loading image");
        setProcessedImage(image);
        setImageLoaded(true);
        setProcessing(false);
      };
      
      img.src = image;
    }
  }, [image]);

  return (
    <div className="fit-model-container">
      {/* Show dress with background removal effect */}
      {imageLoaded && (
        <div className="dress-display">
          <div 
            className="dress-wrapper"
            style={{
              transform: transformValue,
              transformOrigin: 'center center'
            }}
          >
            {/* Use the processed image instead of original */}
            <img 
              src={processedImage || image} 
              alt="Dress preview" 
              className="dress-image"
              style={{
                width: 'auto',
                height: '100%', 
                maxHeight: '500px',
                objectFit: 'contain',
                display: 'block',
                margin: '0 auto',
                filter: 'drop-shadow(0px 0px 10px rgba(0,0,0,0.2))'
              }}
            />
            
            {/* Dynamic adjustment points that reflect measurement changes */}
            <div className="adjustment-points">
              <div 
                className="adjustment-point bust" 
                style={{ 
                  top: `${bustPoint}%`,
                  transform: `scaleX(${bustScale})` 
                }}
              ></div>
              <div 
                className="adjustment-point waist" 
                style={{ 
                  top: `${waistPoint}%`,
                  transform: `scaleX(${waistScale})` 
                }}
              ></div>
              <div 
                className="adjustment-point hip" 
                style={{ 
                  top: `${hipPoint}%`,
                  transform: `scaleX(${hipScale})` 
                }}
              ></div>
            </div>
          </div>
          
          {/* Measurement indicators */}
          <div className="measurement-indicators">
            <div className="bust-indicator" style={{ top: `${bustPoint}%` }}>
              <span className="measurement-label">Bust: {bust}"</span>
            </div>
            <div className="waist-indicator" style={{ top: `${waistPoint}%` }}>
              <span className="measurement-label">Waist: {waist}"</span>
            </div>
            <div className="hip-indicator" style={{ top: `${hipPoint}%` }}>
              <span className="measurement-label">Hips: {hips}"</span>
            </div>
            <div className="height-indicator" style={{ bottom: '5%', left: '5%' }}>
              <span className="measurement-label">Height: {height}"</span>
            </div>
          </div>
        </div>
      )}

      {/* Show loading indicator during image processing */}
      {(!imageLoaded || processing) && image && (
        <div className="loading-overlay">
          <span>Processing image...</span>
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default FitModel;