import os
import sys
import logging
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

# Import routes module
from routes import register_routes

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuration
DATA_DIR = os.environ.get('DATA_DIR', 'e:/Induvidual project/Dresslink-platform/backend/data')
UPLOAD_FOLDER = os.path.join(DATA_DIR, 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
MODEL_PATH = os.path.join(DATA_DIR, 'models/body_shape_classifier.pkl')
CATALOG_PATH = os.path.join(DATA_DIR, 'processed/dress_catalog.csv')
RESULTS_DIR = os.path.join(DATA_DIR, 'results')
TEMP_DIR = os.path.join(DATA_DIR, 'temp')

# Create necessary directories
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(os.path.join(UPLOAD_FOLDER, 'dresses'), exist_ok=True)

def create_app():
    """Create and configure Flask application"""
    app = Flask(__name__)
    
    # Configure CORS to allow all origins
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

    # Setup configuration
    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload size
    app.config['DATA_DIR'] = DATA_DIR
    app.config['MODEL_PATH'] = MODEL_PATH
    app.config['CATALOG_PATH'] = CATALOG_PATH
    app.config['RESULTS_DIR'] = RESULTS_DIR
    app.config['TEMP_DIR'] = TEMP_DIR
    app.config['ALLOWED_EXTENSIONS'] = ALLOWED_EXTENSIONS
    
    # Initialize components and store in app config
    try:
        # Load body shape classifier if it exists
        if os.path.exists(MODEL_PATH):
            import pickle
            with open(MODEL_PATH, 'rb') as f:
                model_data = pickle.load(f)
                app.config['MODEL'] = model_data.get('model')
                app.config['SCALER'] = model_data.get('scaler')
                logger.info(f"Loaded body shape classifier from {MODEL_PATH}")
        else:
            logger.warning(f"Body shape classifier not found at {MODEL_PATH}")
            app.config['MODEL'] = None
            app.config['SCALER'] = None
        
        # Load dress catalog if it exists
        if os.path.exists(CATALOG_PATH):
            import pandas as pd
            dress_catalog = pd.read_csv(CATALOG_PATH)
            app.config['DRESS_CATALOG'] = dress_catalog
            logger.info(f"Loaded dress catalog with {len(dress_catalog)} items")
        else:
            logger.warning(f"Dress catalog not found at {CATALOG_PATH}")
            app.config['DRESS_CATALOG'] = None
        
    except Exception as e:
        logger.error(f"Error initializing components: {str(e)}")
        app.config['MODEL'] = None
        app.config['SCALER'] = None
        app.config['DRESS_CATALOG'] = None
    
    # Add helper function to check allowed files
    def allowed_file(filename):
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
    
    app.config['allowed_file'] = allowed_file
    
    # Register routes
    register_routes(app)
    
    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'False').lower() in ('true', '1', 't')
    logger.info(f"Starting DressLink API server on port {port}, debug={debug}")
    app.run(host='0.0.0.0', port=port, debug=debug)