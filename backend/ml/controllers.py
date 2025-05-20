import os
import logging
import numpy as np
import time
import cv2
from flask import jsonify
from werkzeug.utils import secure_filename

# Import custom modules
from models.body_model import BodyModel
from models.dress_transformer import DressTransformer
from utils.visualization import DressLinkVisualizer
from fittingroom.virtual_try_on import VirtualFittingRoom
from fittingroom.image_processor import ImageProcessor
from fittingroom.body_allignment import BodyAligner

# Initialize components
virtual_fitting_room = VirtualFittingRoom()
image_processor = ImageProcessor()
body_aligner = BodyAligner()
visualizer = DressLinkVisualizer()

logger = logging.getLogger(__name__)

# Health controller
class health_controller:
    @staticmethod
    def check_health(model, catalog):
        """Check system health"""
        return jsonify({
            "status": "healthy",
            "model_loaded": model is not None,
            "catalog_loaded": catalog is not None
        })

class body_shape_controller:
    @staticmethod
    def get_body_shape(measurements, use_ml=True, model=None, scaler=None):
        """Determine body shape from measurements"""
        try:
            # Extract measurements
            bust = float(measurements.get('bust', 0))
            waist = float(measurements.get('waist', 0))
            hips = float(measurements.get('hips', 0))
            height = float(measurements.get('height', 0))
            
            # Calculate ratios
            bust_to_waist = bust / waist if waist > 0 else 0
            waist_to_hip = waist / hips if hips > 0 else 0
            bust_to_hip = bust / hips if hips > 0 else 0
            
            # Add measurements and ratios to feature set
            features = {
                'bust': bust,
                'waist': waist,
                'hips': hips,
                'height': height,
                'bust_to_waist': bust_to_waist,
                'waist_to_hip': waist_to_hip,
                'bust_to_hip': bust_to_hip
            }
            
            if use_ml and model is not None and scaler is not None:
                # Use ML model for classification
                body_shape = body_shape_controller.classify_body_shape(
                    features, use_ml, model, scaler
                )
            else:
                # Use rule-based classification
                body_shape = body_shape_controller.classify_body_shape(
                    features, False, None, None
                )
            
            return {
                'body_shape': body_shape,
                'measurements': features
            }
            
        except Exception as e:
            logger.error(f"Error determining body shape: {str(e)}")
            raise
    
    @staticmethod
    def classify_body_shape(measurements, use_ml, model, scaler):
        """Classify body shape using ML model or rules"""
        if use_ml and model is not None and scaler is not None:
            try:
                # Extract features in correct order
                features = [
                    measurements['bust'], 
                    measurements['waist'], 
                    measurements['hips'],
                    measurements['bust_to_waist'],
                    measurements['waist_to_hip'],
                    measurements['bust_to_hip']
                ]
                
                # Scale features
                scaled_features = scaler.transform([features])
                
                # Predict body shape
                predicted_shape = model.predict(scaled_features)[0]
                
                # Return body shape
                return predicted_shape
                
            except Exception as e:
                logger.error(f"Error in ML classification: {str(e)}")
                logger.info("Falling back to rule-based classification")
                # Fall back to rule-based classification
        
        # Rule-based classification
        bust = measurements['bust']
        waist = measurements['waist']
        hips = measurements['hips']
        
        bust_to_waist = measurements['bust_to_waist']
        waist_to_hip = measurements['waist_to_hip']
        
        # Simple rule-based classification
        if bust_to_waist > 1.1 and waist_to_hip < 0.9:
            return "hourglass"
        elif bust_to_waist > 1.05 and waist_to_hip > 0.8:
            return "apple"
        elif bust_to_waist < 1.05 and waist_to_hip < 0.8:
            return "pear"
        else:
            return "rectangle"

# Dress recommendation controller
class recommendation_controller:
    @staticmethod
    def recommend_dresses(measurements, use_ml, limit, model, scaler, dress_catalog, catalog_path):
        """Process dress recommendation request"""
        # Check if dress catalog is available
        if dress_catalog is None:
            return jsonify({"error": "Dress catalog not available"}), 503
            
        # Get body shape and model
        body_shape, body_model = body_shape_controller.get_body_shape(
            measurements, use_ml, model, scaler
        )
        
        # Create dress transformer
        dress_transformer = DressTransformer(body_model, catalog_path)
        
        # Get dress recommendations
        recommendations = dress_transformer.get_recommendations(limit)
        
        # Return response
        response = {
            "body_shape": body_shape,
            "size": body_model.size if hasattr(body_model, 'size') else "Unknown",
            "recommendations": recommendations
        }
        
        return jsonify(response)

# Upload controller
class upload_controller:
    @staticmethod
    def allowed_file(filename, allowed_extensions):
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions
        
    @staticmethod
    def upload_dress_image(request, upload_folder, allowed_extensions):
        """Handle dress image upload for virtual try-on"""
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
            
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
            
        if file and upload_controller.allowed_file(file.filename, allowed_extensions):
            try:
                # Secure the filename
                filename = secure_filename(file.filename)
                dress_id = request.form.get('dress_id', 'custom-dress')
                
                # Create dress directory if not exists
                dress_dir = os.path.join(upload_folder, 'dresses')
                os.makedirs(dress_dir, exist_ok=True)
                
                # Save the uploaded file
                file_path = os.path.join(dress_dir, f"{dress_id}_{filename}")
                file.save(file_path)
                
                # Process image (remove background if needed)
                try:
                    # This is a placeholder - in a real implementation you'd have an image processor
                    processed_path = file_path
                except:
                    processed_path = file_path
                
                return jsonify({
                    "success": True,
                    "message": f"Dress image uploaded successfully",
                    "original_path": file_path,
                    "processed_path": processed_path
                })
                
            except Exception as e:
                logger.error(f"Error processing uploaded dress image: {str(e)}")
                return jsonify({"error": f"Error processing image: {str(e)}"}), 500
        
        return jsonify({"error": "File type not allowed"}), 400
    
#generate silhouette 
class silhouette_controller:
    @staticmethod
    def generate_silhouette(request_data, output_dir):
        """Generate a silhouette from measurements"""
        try:
            # Extract data
            measurements = request_data.get('measurements', {})
            body_shape = request_data.get('body_shape', 'rectangle')
            
            if not measurements:
                return jsonify({"error": "No measurements provided"}), 400
            
            # Create silhouette image
            # In a real implementation, this would use a more sophisticated approach
            bust = float(measurements.get('bust', 90))
            waist = float(measurements.get('waist', 70))
            hips = float(measurements.get('hips', 95))
            height = float(measurements.get('height', 170))
            
            # Create a simple silhouette
            width = max(300, int(max(bust, hips) * 1.5))  # Ensure minimum width
            canvas_height = max(600, int(height * 3.5))   # Ensure minimum height
            
            # Create a white canvas
            silhouette = np.ones((canvas_height, width, 3), dtype=np.uint8) * 255
            
            # Draw head
            head_y = int(canvas_height * 0.1)
            head_radius = int(width * 0.1)
            cv2.circle(silhouette, (width // 2, head_y), head_radius, (200, 200, 200), -1)
            
            # Draw body
            shoulder_y = head_y + head_radius * 2
            shoulder_width = int(bust * 1.2)
            bust_y = int(shoulder_y + canvas_height * 0.1)
            waist_y = int(bust_y + canvas_height * 0.15)
            hip_y = int(waist_y + canvas_height * 0.15)
            
            # Scale dimensions based on body shape but maintain proportions
            if body_shape == 'hourglass':
                bust_width = int(bust * 1.1)
                waist_width = int(waist * 0.9)  # Narrower waist for hourglass
                hip_width = int(hips * 1.1)
            elif body_shape == 'apple':
                bust_width = int(bust * 1.1)
                waist_width = int(waist * 1.2)  # Wider waist for apple
                hip_width = int(hips * 1.0)
            elif body_shape == 'pear':
                bust_width = int(bust * 0.9)
                waist_width = int(waist * 1.0)  
                hip_width = int(hips * 1.2)  # Wider hips for pear
            else:  # rectangle
                bust_width = int(bust * 1.0)
                waist_width = int(waist * 1.0)
                hip_width = int(hips * 1.0)
            
            # Ensure all widths are within canvas bounds and at least 30% of width
            min_width = int(width * 0.3)
            bust_width = max(min_width, min(width - 20, bust_width))
            waist_width = max(min_width, min(width - 20, waist_width))
            hip_width = max(min_width, min(width - 20, hip_width))
            
            # Draw shoulders
            cv2.line(silhouette, 
                    (width // 2 - shoulder_width // 2, shoulder_y),
                    (width // 2 + shoulder_width // 2, shoulder_y),
                    (150, 150, 150), 3)
            
            # Draw body outline
            points = np.array([
                [width // 2 - shoulder_width // 2, shoulder_y],
                [width // 2 - bust_width // 2, bust_y],
                [width // 2 - waist_width // 2, waist_y],
                [width // 2 - hip_width // 2, hip_y],
                [width // 2 - hip_width // 3, canvas_height - 50],
                [width // 2 + hip_width // 3, canvas_height - 50],
                [width // 2 + hip_width // 2, hip_y],
                [width // 2 + waist_width // 2, waist_y],
                [width // 2 + bust_width // 2, bust_y],
                [width // 2 + shoulder_width // 2, shoulder_y]
            ], np.int32)
            
            cv2.fillPoly(silhouette, [points], (180, 180, 180))
            cv2.polylines(silhouette, [points], True, (120, 120, 120), 2)
            
            # Save silhouette image
            os.makedirs(output_dir, exist_ok=True)
            silhouette_filename = f"silhouette_{body_shape}_{int(time.time())}.png"
            silhouette_path = os.path.join(output_dir, silhouette_filename)
            cv2.imwrite(silhouette_path, silhouette)
            
            logger.info(f"Generated silhouette with dimensions: {silhouette.shape}")
            
            return jsonify({
                "success": True,
                "body_shape": body_shape,
                "silhouette_path": silhouette_path,
                "measurements": measurements
            })
            
        except Exception as e:
            logger.error(f"Error generating silhouette: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return jsonify({"error": str(e)}), 500
        
# Try-on controller
class try_on_controller:
    @staticmethod
    def virtual_try_on(request_data, fitting_room=None, results_dir=None):
        """Perform virtual try-on with silhouette and dress"""
        try:
            # Extract data
            silhouette_path = request_data.get('silhouette_path')
            dress_image = request_data.get('dress_image')
            body_shape = request_data.get('body_shape')
            measurements = request_data.get('measurements', {})
            
            if not silhouette_path or not dress_image:
                return jsonify({"error": "Silhouette and dress image are required"}), 400
            
            if not os.path.exists(silhouette_path):
                return jsonify({"error": f"Silhouette image not found at {silhouette_path}"}), 404
                
            if not os.path.exists(dress_image):
                return jsonify({"error": f"Dress image not found at {dress_image}"}), 404
                
            # Create results directory if not exists
            if results_dir is None:
                results_dir = "e:/Induvidual project/Dresslink-platform/backend/data/results"
            os.makedirs(results_dir, exist_ok=True)
            
            # Generate result filename
            result_filename = f"try_on_{body_shape}_{int(time.time())}.png"
            result_path = os.path.join(results_dir, result_filename)
            
            # Load images
            silhouette_img = cv2.imread(silhouette_path)
            dress_img = cv2.imread(dress_image)
            
            # Debug info
            logger.info(f"Silhouette image shape: {silhouette_img.shape if silhouette_img is not None else 'None'}")
            logger.info(f"Dress image shape: {dress_img.shape if dress_img is not None else 'None'}")
            
            if silhouette_img is None:
                return jsonify({"error": f"Failed to load silhouette image from {silhouette_path}"}), 500
                
            if dress_img is None:
                return jsonify({"error": f"Failed to load dress image from {dress_image}"}), 500
            
            # Simple overlay - in a real app this would be more sophisticated
            # Resize dress to match silhouette width
            silhouette_height, silhouette_width = silhouette_img.shape[:2]
            dress_height, dress_width = dress_img.shape[:2]
            
            # Calculate dress overlay dimensions that maintain aspect ratio
            dress_height_new = int(silhouette_height * 0.7)  # 70% of silhouette height
            dress_width_new = int(dress_width * (dress_height_new / dress_height))
            
            # Make sure the new dress width isn't wider than the silhouette
            if dress_width_new > silhouette_width:
                dress_width_new = silhouette_width
                dress_height_new = int(dress_height * (dress_width_new / dress_height))
            
            # Resize dress
            try:
                resized_dress = cv2.resize(dress_img, (dress_width_new, dress_height_new))
            except Exception as e:
                logger.error(f"Error resizing dress: {e}")
                return jsonify({"error": f"Error resizing dress: {e}"}), 500
            
            # Calculate position to center the dress
            x_offset = (silhouette_width - dress_width_new) // 2
            y_offset = silhouette_height // 4  # Place at 1/4 from top
            
            # Create a composite image with safe bounds checking
            result_img = silhouette_img.copy()
            
            # Calculate the region to place the dress
            roi_height = min(dress_height_new, silhouette_height - y_offset)
            roi_width = min(dress_width_new, silhouette_width - x_offset)
            
            if roi_height <= 0 or roi_width <= 0:
                return jsonify({"error": "Dress dimensions don't fit within silhouette"}), 500
            
            # Place dress onto silhouette with proper bounds checking
            try:
                result_img[y_offset:y_offset+roi_height, x_offset:x_offset+roi_width] = resized_dress[:roi_height, :roi_width]
            except ValueError as e:
                logger.error(f"Error during image overlay: {e}")
                logger.error(f"ROI dimensions: {roi_height}x{roi_width}")
                logger.error(f"Resized dress dimensions: {resized_dress.shape}")
                return jsonify({"error": f"Dimension mismatch during overlay: {e}"}), 500
            
            # Save the result
            cv2.imwrite(result_path, result_img)
            
            # Generate a fit description based on body shape and measurements
            fit_description = try_on_controller.get_fit_description(body_shape, measurements)
            
            return jsonify({
                "success": True,
                "body_shape": body_shape,
                "result_image": f"/api/get-image/results/{os.path.basename(result_path)}",
                "fit_description": fit_description
            })
            
        except Exception as e:
            logger.error(f"Error in virtual try-on: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return jsonify({"error": str(e)}), 500
    
    @staticmethod
    def get_fit_description(body_shape, measurements):
        """Generate a description of how the dress fits based on body shape"""
        bust = measurements.get('bust', 0)
        waist = measurements.get('waist', 0)
        hips = measurements.get('hips', 0)
        
        if body_shape == 'hourglass':
            return "This dress fits your hourglass figure beautifully, highlighting your balanced proportions."
        elif body_shape == 'apple':
            if waist > 80:
                return "This dress provides comfort around your waist while accentuating your bust."
            else:
                return "This dress has a slightly fitted silhouette that complements your apple shape."
        elif body_shape == 'pear':
            if hips > 100:
                return "This dress offers a relaxed fit around your hips while defining your waist."
            else:
                return "This dress creates a well-balanced silhouette for your pear-shaped figure."
        else:  # rectangle
            return "This dress creates a streamlined silhouette that complements your balanced proportions."
    
    
    @staticmethod
    def adjust_dress_fit(json_data, temp_dir):
        """Adjust fit of a previously generated try-on result"""
        try:
            # Extract parameters
            previous_result = json_data.get('previous_result')
            tightness = json_data.get('tightness', 0)  # -5 to 5
            length = json_data.get('length', 0)        # -5 to 5
            shoulder_width = json_data.get('shoulder_width', 0)  # -5 to 5
        
            if not previous_result:
                return jsonify({"error": "No previous result provided"}), 400
            
            logger.info(f"Received previous_result: {previous_result}")
            
            # Handle different path formats
            if previous_result.startswith('http://localhost:5000/api/get-image/'):
                # Extract relative path from full URL
                relative_path = previous_result.replace('http://localhost:5000/api/get-image/', '')
                full_path = os.path.join("e:/Induvidual project/Dresslink-platform/backend/data", relative_path)
            elif previous_result.startswith('/api/get-image/'):
                # Extract relative path from API URL
                relative_path = previous_result.replace('/api/get-image/', '')
                full_path = os.path.join("e:/Induvidual project/Dresslink-platform/backend/data", relative_path)
            else:
                # Assume it's already a full path or just a filename
                full_path = previous_result

            logger.info(f"Converted path: {full_path}")
        
            # Check if file exists, try alternative paths if not
            if not os.path.exists(full_path):
                # Try with and without results/ prefix
                basename = os.path.basename(full_path)
                alt_paths = [
                    os.path.join("e:/Induvidual project/Dresslink-platform/backend/data/results", basename),
                    os.path.join("e:/Induvidual project/Dresslink-platform/backend/data/temp", basename),
                    os.path.join(temp_dir, basename)
                ]
                
                for path in alt_paths:
                    if os.path.exists(path):
                        full_path = path
                        logger.info(f"Found image at alternative path: {full_path}")
                        break
                else:
                    # If none of the alternative paths worked, try extracting just the filename
                    if '/' in previous_result:
                        basename = previous_result.split('/')[-1]
                        result_path = os.path.join("e:/Induvidual project/Dresslink-platform/backend/data/results", basename)
                        if os.path.exists(result_path):
                            full_path = result_path
                            logger.info(f"Found image using basename: {full_path}")
                        else:
                            logger.error(f"Previous result not found at {full_path} or any alternative paths")
                            return jsonify({"error": f"Previous result not found. Please try again with a different image."}), 404
                    else:
                        logger.error(f"Previous result not found at {full_path} or any alternative paths")
                        return jsonify({"error": f"Previous result not found. Please try again with a different image."}), 404
        
            # Load the image
            img = cv2.imread(full_path)
            if img is None:
                return jsonify({"error": "Could not load previous result image"}), 500
        
            # Rest of the function remains the same
            h, w = img.shape[:2]

            # Convert to HSV for better color detection
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            # Define range for white/light gray color
            lower_white = np.array([0, 0, 180])  # Light colors with low saturation
            upper_white = np.array([180, 30, 255])  # Includes white and very light grays
            # Create a mask for background
            background_mask = cv2.inRange(hsv, lower_white, upper_white)
        
            # Create a modified image based on adjustments
            modified_img = img.copy()

            # Use the mask to change the background to white
            modified_img[background_mask > 0] = [255, 255, 255]
        
            # Apply tightness adjustment (horizontal scaling)
            if tightness != 0:
                # Calculate scaling factor based on tightness parameter
                scale_x = 1.0 - (tightness / 20.0)  # -5 to 5 maps to 1.25 to 0.75
                center_x = w // 2
                scale_matrix = np.array([
                    [scale_x, 0, center_x * (1 - scale_x)],
                    [0, 1, 0]
                ], dtype=np.float32)
                modified_img = cv2.warpAffine(modified_img, scale_matrix, (w, h),
                                            borderMode=cv2.BORDER_CONSTANT, 
                                            borderValue=(255, 255, 255))
        
            # Apply length adjustment (vertical scaling of bottom part)
            if length != 0:
                # Scale only the bottom half of the image
                mid_y = h // 2
                bottom_half = modified_img[mid_y:, :]
            
                # Calculate scaling factor based on length parameter
                scale_y = 1.0 + (length / 20.0)  # -5 to 5 maps to 0.75 to 1.25
            
                # Resize bottom half
                new_h = int(bottom_half.shape[0] * scale_y)
                resized_bottom = cv2.resize(bottom_half, (w, new_h))
            
                # Create new image with adjusted bottom half
                new_full_height = mid_y + new_h
                new_img = np.ones((new_full_height, w, 3), dtype=np.uint8) * 255
                new_img[:mid_y, :] = modified_img[:mid_y, :]
            
                # Copy as much of the resized bottom as fits
                copy_h = min(new_h, new_full_height - mid_y)
                new_img[mid_y:mid_y+copy_h, :] = resized_bottom[:copy_h, :]
            
                modified_img = new_img
        
            # Apply shoulder width adjustment
            if shoulder_width != 0:
                # This is a simplistic implementation - in a real app, you'd need more sophisticated warping
                shoulder_y = int(h * 0.2)  # Approximate shoulder position
                shoulder_height = int(h * 0.1)
            
                # Calculate scaling factor for shoulders
                scale_shoulders = 1.0 + (shoulder_width / 20.0)  # -5 to 5 maps to 0.75 to 1.25
            
                # Extract and scale shoulder region
                shoulder_region = modified_img[shoulder_y:shoulder_y+shoulder_height, :]
                scaled_width = int(w * scale_shoulders)
                scaled_shoulders = cv2.resize(shoulder_region, (scaled_width, shoulder_height))
            
                # Center the scaled shoulders
                x_offset = max(0, (w - scaled_width) // 2)
                if scaled_width <= w:
                    modified_img[shoulder_y:shoulder_y+shoulder_height, x_offset:x_offset+scaled_width] = scaled_shoulders
                else:
                    # If wider than image, take center portion
                    start_x = (scaled_width - w) // 2
                    modified_img[shoulder_y:shoulder_y+shoulder_height, :] = scaled_shoulders[:, start_x:start_x+w]
        
            # Save the modified image
            os.makedirs(temp_dir, exist_ok=True)
            result_filename = f"adjusted_{int(time.time())}.png"
            result_path = os.path.join(temp_dir, result_filename)
            cv2.imwrite(result_path, modified_img)
        
            # Generate a fit description based on adjustments
            fit_description = f"Dress fit adjusted with {tightness:+d} tightness, {length:+d} length, and {shoulder_width:+d} shoulder width."
        
            # Return both the filename and the full API path for flexibility
            return jsonify({
                "success": True,
                "result_image": f"/api/get-image/temp/{os.path.basename(result_path)}",
                "result_filename": os.path.basename(result_path),
                "fit_description": fit_description
            })
        
        except Exception as e:
            logger.error(f"Error adjusting fit: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return jsonify({"error": str(e)}), 500
        
# Visualization controller
class visualization_controller:
    @staticmethod
    def visualize_body_shapes(temp_dir, results_dir):
        """Generate body shape visualizations"""
        # Update visualizer results dir if needed
        if visualizer.results_dir != results_dir:
            visualizer.results_dir = results_dir
            
        # Generate body shape visualizations
        output_path = os.path.join(temp_dir, "body_shapes.png")
        visualizer.visualize_body_shapes(output_path)
        
        return jsonify({
            "success": True,
            "message": "Body shapes visualized",
            "visualization": output_path
        })
