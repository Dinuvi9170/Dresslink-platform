import logging
from flask import request, jsonify, send_file, send_from_directory
import os

# Import controllers
from controllers import (
    health_controller,
    body_shape_controller,
    recommendation_controller,
    upload_controller,
    try_on_controller,
    visualization_controller,
    silhouette_controller
)

logger = logging.getLogger(__name__)

def register_routes(app):
    """Register all routes for the application"""

    # Add CORS headers to all responses
    @app.after_request
    def add_cors_headers(response):
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response
    
    # Handle OPTIONS requests globally
    @app.route('/', defaults={'path': ''}, methods=['OPTIONS'])
    @app.route('/<path:path>', methods=['OPTIONS'])
    def options_handler(path):
        return app.make_default_options_response()
    
    @app.route('/api/health', methods=['GET'])
    def health_check():
        """Health check endpoint"""
        return health_controller.check_health(
            app.config['MODEL'],
            app.config['DRESS_CATALOG']
        )

    @app.route('/api/body-shape', methods=['POST'])
    def classify_body_shape():
        """Endpoint to classify body shape from measurements"""
        if not request.json:
            return jsonify({"error": "No JSON data provided"}), 400
            
        try:
            data = request.json

            if 'measurements' in data:
                # Handle the case where measurements are nested
                measurements_data = data['measurements']
            else:
                # Original case where measurements are at the top level
                measurements_data = data

            # Get measurements from request
            measurements = {
                "bust": float(measurements_data.get('bust', 0)),
                "waist": float(measurements_data.get('waist', 0)),
                "hips": float(measurements_data.get('hips', 0)),
                "height": float(measurements_data.get('height', 0))
            }
            
            # Optional parameters
            use_ml = request.json.get('use_ml', True)
            
            # Validate measurements
            if measurements["bust"] <= 0 or measurements["waist"] <= 0 or measurements["hips"] <= 0:
                return jsonify({"error": "Invalid measurements provided"}), 400
            
            return body_shape_controller.get_body_shape(
                measurements, 
                use_ml, 
                app.config['MODEL'], 
                app.config['SCALER']
            )        
        except Exception as e:
            logger.error(f"Error classifying body shape: {str(e)}")
            return jsonify({"error": f"Error processing request: {str(e)}"}), 500
        
    @app.route('/body-shape', methods=['POST', 'OPTIONS'])
    def body_shape_direct():
        """Direct endpoint for body shape classification"""
        # Handle OPTIONS request
        if request.method == 'OPTIONS':
            response = app.make_default_options_response()
            return response
    
        return classify_body_shape()

    @app.route('/api/recommend-dresses', methods=['POST'])
    def recommend_dresses():
        """Endpoint to recommend suitable dresses based on body shape"""
        if not request.json:
            return jsonify({"error": "No JSON data provided"}), 400
            
        try:
            # Get measurements from request
            measurements = {
                "bust": float(request.json.get('bust', 0)),
                "waist": float(request.json.get('waist', 0)),
                "hips": float(request.json.get('hips', 0))
            }
            
            # Optional parameters
            use_ml = request.json.get('use_ml', True)
            limit = int(request.json.get('limit', 5))
            
            # Validate measurements
            if measurements["bust"] <= 0 or measurements["waist"] <= 0 or measurements["hips"] <= 0:
                return jsonify({"error": "Invalid measurements provided"}), 400
                
            return recommendation_controller.recommend_dresses(
                measurements,
                use_ml,
                limit,
                app.config['MODEL'],
                app.config['SCALER'],
                app.config['DRESS_CATALOG'],
                app.config['CATALOG_PATH']
            )
            
        except Exception as e:
            logger.error(f"Error recommending dresses: {str(e)}")
            return jsonify({"error": f"Error processing request: {str(e)}"}), 500

    @app.route('/api/generate-silhouette', methods=['POST'])
    def create_silhouette():
        """Generate a body silhouette from measurements"""
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400
        
        try:
            data = request.json
            return silhouette_controller.generate_silhouette(
                data,
                app.config['RESULTS_DIR']
            )
            
        except Exception as e:
            logger.error(f"Error generating silhouette: {str(e)}")
            return jsonify({"error": str(e)}), 500
        
    @app.route('/generate-silhouette', methods=['POST', 'OPTIONS'])
    def create_silhouette_direct():
        if request.method == 'OPTIONS':
            response = app.make_default_options_response()
            return response
        return create_silhouette()


    @app.route('/api/upload-dress-image', methods=['POST'])
    def upload_dress_image():
        """Endpoint to upload dress image for virtual try-on"""
        return upload_controller.upload_dress_image(
            request,
            app.config['UPLOAD_FOLDER'],
            app.config['ALLOWED_EXTENSIONS']
        )
    
    @app.route('/upload-dress-image', methods=['POST', 'OPTIONS'])
    def upload_dress_image_direct():
        if request.method == 'OPTIONS':
            response = app.make_default_options_response()
            return response
        return upload_dress_image()

    @app.route('/api/virtual-try-on', methods=['POST'])
    def virtual_try_on():
        """Perform virtual try-on with silhouette and dress"""
        if not request.is_json:
            return jsonify({"error": "Request must be JSON"}), 400
        
        try:
            data = request.json
            # Log the incoming data for debugging
            logger.info(f"Received virtual try-on request: {data}")
            
            return try_on_controller.virtual_try_on(
                data,
                None,  
                app.config['RESULTS_DIR']
            )
            
        except Exception as e:
            logger.error(f"Error in virtual try-on: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return jsonify({"error": str(e)}), 500
        
    @app.route('/virtual-try-on', methods=['POST', 'OPTIONS'])
    def virtual_try_on_direct():
        if request.method == 'OPTIONS':
            response = app.make_default_options_response()
            return response
        return virtual_try_on()

    @app.route('/api/adjust-fit', methods=['POST'])
    def adjust_fit():
        """Endpoint to adjust fit of a dress on user image"""
        if not request.json:
            return jsonify({"error": "No JSON data provided"}), 400
            
        try:
            return try_on_controller.adjust_dress_fit(
                request.json,
                app.config['TEMP_DIR']
            )
            
        except Exception as e:
            logger.error(f"Error adjusting fit: {str(e)}")
            return jsonify({"error": f"Error processing request: {str(e)}"}), 500

    @app.route('/api/get-image/<path:image_path>', methods=['GET'])
    def get_image(image_path):
        """Serve stored images"""
        try:
            # Sanitize the path to prevent directory traversal attacks
            image_path = os.path.normpath(image_path)
            if image_path.startswith('..'):
                return jsonify({"error": "Invalid path"}), 400
            
            # Build the full path
            full_path = os.path.join(app.config['DATA_DIR'], image_path)
            
            if not os.path.exists(full_path):
                return jsonify({"error": "Image not found"}), 404
                
            # Serve the image
            return send_file(full_path)
            
        except Exception as e:
            logger.error(f"Error serving image: {str(e)}")
            return jsonify({"error": str(e)}), 500
        
    
    @app.route('/adjust-fit', methods=['POST', 'OPTIONS'])
    def adjust_fit_direct():
        """Direct endpoint for adjusting fit"""
        if request.method == 'OPTIONS':
            response = app.make_default_options_response()
            return response
        return adjust_fit()
    
   
    @app.route('/<path:filename>', methods=['GET'])
    def serve_static_file(filename):
        """Serve static files from the results directory"""
        if filename.startswith('try_on_') or filename.startswith('silhouette_') or filename.startswith('adjusted_'):
            return send_from_directory(app.config['TEMP_DIR'], filename)
        return jsonify({"error": "File not found"}), 404
    
    # New route to catch /get-image/* URLs
    @app.route('/get-image/<path:image_path>', methods=['GET'])
    def get_image_direct(image_path):
        """Direct endpoint for serving images"""
        # Redirect to the API endpoint
        if image_path.startswith('results/'):
            filename = image_path.replace('results/', '')
            if filename.startswith('try_on_') or filename.startswith('silhouette_') or filename.startswith('adjusted_'):
                return send_from_directory(app.config['RESULTS_DIR'], filename)
    
        # Build the full path for other cases
        full_path = os.path.join(app.config['DATA_DIR'], image_path)
        if os.path.exists(full_path):
            return send_file(full_path)
    
        return jsonify({"error": "Image not found"}), 404

    @app.route('/api/visualize-body-shapes', methods=['GET'])
    def visualize_body_shapes():
        """Endpoint to get body shape visualizations"""
        try:
            return visualization_controller.visualize_body_shapes(
                app.config['TEMP_DIR'],
                app.config['RESULTS_DIR']
            )
            
        except Exception as e:
            logger.error(f"Error generating body shape visualizations: {str(e)}")
            return jsonify({"error": f"Error processing request: {str(e)}"}), 500

    logger.info("Routes registered successfully")

    return app
