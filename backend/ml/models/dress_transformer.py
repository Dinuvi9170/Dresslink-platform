import os
import numpy as np
import cv2
import logging
import pandas as pd
from typing import Dict, List, Tuple, Optional, Union
import json
from pathlib import Path
import sys

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

# Import the body model
from models.body_model import BodyModel
from data_preprocessing.dress_images import DressImageProcessor

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def ensure_test_files_exist():
    """Create necessary test files if they don't exist."""
    # Create directories
    catalog_dir = "e:/Induvidual project/Dresslink-platform/backend/data/processed/"
    sample_dir = "e:/Induvidual project/Dresslink-platform/backend/data/sample_dresses/"
    
    os.makedirs(catalog_dir, exist_ok=True)
    os.makedirs(sample_dir, exist_ok=True)
    
    # Create catalog file if it doesn't exist
    catalog_path = os.path.join(catalog_dir, "dress_catalog.csv")
    if not os.path.exists(catalog_path):
        print(f"Creating sample dress catalog at {catalog_path}")
        with open(catalog_path, 'w') as f:
            f.write("id,name,type,style,image_path,size\n")
            f.write("dress001,Summer Dress,full,casual,dress1.png,M\n")
            f.write("dress002,Evening Gown,full,formal,dress2.png,S\n")
            f.write("dress003,T-Shirt,top,casual,top1.png,L\n")
            f.write("dress004,Skirt,bottom,casual,skirt1.png,M\n")
        print(f"Created sample catalog")
    
    # Create sample dress image if it doesn't exist
    sample_dress_path = os.path.join(sample_dir, "dress1.png")
    if not os.path.exists(sample_dress_path):
        print(f"Creating sample dress image at {sample_dress_path}")
        # Create a simple dress silhouette
        width, height = 300, 500
        img = np.ones((height, width, 4), dtype=np.uint8) * 255
        img[:, :, 3] = 0  # Transparent background
        
        # Draw a simple dress shape - blue dress
        cv2.rectangle(img, (100, 50), (200, 100), (0, 0, 255, 255), -1)  # Top
        # Draw a trapezoid for the skirt
        pts = np.array([[100, 100], [200, 100], [250, 400], [50, 400]], np.int32)
        pts = pts.reshape((-1, 1, 2))
        cv2.fillPoly(img, [pts], (0, 0, 255, 255))
        
        # Save the image
        cv2.imwrite(sample_dress_path, img)
        print(f"Created sample dress image")
    
    return catalog_path, sample_dir

class DressTransformer:
    """
    Class for transforming dress/clothing images to fit on a body model.
    Handles background removal, resizing, warping, and proper alignment of clothing.
    Integrates with preprocessed dress catalog dataset.
    """
    
    def __init__(self, 
                body_model: Optional[BodyModel] = None, 
                dress_catalog_path: Optional[str] = None):
        """
        Initialize the dress transformer.
        
        Args:
            body_model: BodyModel instance to use for transformations
            dress_catalog_path: Path to the preprocessed dress catalog dataset
        """
        self.body_model = body_model
        
        # Default background removal settings
        self.background_threshold = 240 
        self.use_alpha_mask = True
        
        # Transformation settings
        self.resize_method = cv2.INTER_AREA
        self.padding = 20  
        
        # Initialize dress catalog processor
        self.dress_catalog = None
        self.dress_images = {}  
        
        if dress_catalog_path:
            self.load_dress_catalog(dress_catalog_path)
        else:
            # Try to locate the default dress catalog
            default_paths = [
                "../data/processed/dress_catalog.csv",
                "./data/processed/dress_catalog.csv",
                "e:/Induvidual project/Dresslink-platform/backend/data/processed/dress_catalog.csv"
            ]
            for path in default_paths:
                if os.path.exists(path):
                    self.load_dress_catalog(path)
                    break
    
    def load_dress_catalog(self, catalog_path: str):
        """
        Load the preprocessed dress catalog dataset.
        
        Args:
            catalog_path: Path to the dress catalog dataset
        """
        try:
            self.dress_catalog = DressImageProcessor(catalog_path)
            self.catalog_path = catalog_path
            logger.info(f"Successfully loaded dress catalog from {catalog_path}")
            
            # Load the catalog into a dataframe for direct access
            try:
                self.catalog_df = pd.read_csv(catalog_path)
                # Create a lookup dictionary for fast access by ID
                self.dress_lookup = {
                    str(row['id']): row.to_dict() 
                    for _, row in self.catalog_df.iterrows()
                }
            except Exception as e:
                logger.warning(f"Could not create lookup table from catalog CSV: {str(e)}")
                self.catalog_df = None
                self.dress_lookup = {}
                
        except Exception as e:
            logger.error(f"Failed to load dress catalog: {str(e)}")
    
    def set_body_model(self, body_model: BodyModel):
        """
        Set or update the body model used for transformations.
        
        Args:
            body_model: BodyModel instance 
        """
        self.body_model = body_model
    
    def get_dress_by_id(self, dress_id: str) -> Dict:
        """
        Get dress information by ID from the catalog.
        
        Args:
            dress_id: ID of the dress in the catalog
            
        Returns:
            Dict: Dress information
        """
        if not self.dress_catalog:
            raise ValueError("Dress catalog not loaded. Call load_dress_catalog() first.")
        
        # First try using the dress_lookup dictionary
        if hasattr(self, 'dress_lookup') and dress_id in self.dress_lookup:
            return self.dress_lookup[dress_id]
            
        # If the DressImageProcessor has this method, use it
        if hasattr(self.dress_catalog, 'get_dress_by_id'):
            dress_info = self.dress_catalog.get_dress_by_id(dress_id)
            if dress_info:
                return dress_info
                
        # Fallback: try to find the dress in the catalog dataframe
        if hasattr(self, 'catalog_df') and self.catalog_df is not None:
            dress = self.catalog_df[self.catalog_df['id'] == dress_id]
            if not dress.empty:
                return dress.iloc[0].to_dict()
        
        raise ValueError(f"Dress with ID {dress_id} not found in catalog.")
    
    def get_compatible_dresses(self, body_measurements: Dict[str, float]) -> List[Dict]:
        """
        Get dresses from the catalog compatible with the given body measurements.
        
        Args:
            body_measurements: Body measurements
            
        Returns:
            List[Dict]: List of compatible dresses
        """
        if not self.dress_catalog:
            raise ValueError("Dress catalog not loaded. Call load_dress_catalog() first.")
        
        # If the DressImageProcessor has this method, use it
        if hasattr(self.dress_catalog, 'get_compatible_dresses'):
            return self.dress_catalog.get_compatible_dresses(body_measurements)
            
        # Fallback implementation - simple size matching
        if not hasattr(self, 'catalog_df') or self.catalog_df is None:
            return []
            
        compatible_dresses = []
        
        # Extract key measurements
        bust = body_measurements.get('bust', 0)
        waist = body_measurements.get('waist', 0)
        hips = body_measurements.get('hips', 0)
        
        # Find compatible dresses based on measurements
        for _, dress in self.catalog_df.iterrows():
            # Skip if dress doesn't have measurements
            if 'measurements' not in dress:
                continue
                
            dress_measurements = dress['measurements']
            
            # Calculate fit scores
            fit_scores = {}
            if 'bust' in dress_measurements and bust > 0:
                bust_ratio = bust / dress_measurements['bust']
                fit_scores['bust'] = self._calculate_fit_score(bust_ratio, 0.9, 1.1)
                
            if 'waist' in dress_measurements and waist > 0:
                waist_ratio = waist / dress_measurements['waist']
                fit_scores['waist'] = self._calculate_fit_score(waist_ratio, 0.85, 1.15)
                
            if 'hips' in dress_measurements and hips > 0:
                hips_ratio = hips / dress_measurements['hips']
                fit_scores['hips'] = self._calculate_fit_score(hips_ratio, 0.9, 1.1)
            
            # Calculate overall fit score
            if fit_scores:
                overall_fit = sum(fit_scores.values()) / len(fit_scores)
                
                # If dress has decent fit, add to compatible list
                if overall_fit >= 0.7:
                    dress_info = dress.to_dict()
                    dress_info['fit_score'] = overall_fit
                    compatible_dresses.append(dress_info)
        
        # Sort by fit score
        compatible_dresses.sort(key=lambda d: d.get('fit_score', 0), reverse=True)
        return compatible_dresses
    
    def get_dress_recommendations(self, 
                               body_measurements: Dict[str, float], 
                               style_preferences: Optional[Dict] = None,
                               limit: int = 5) -> List[Dict]:
        """
        Get dress recommendations based on body measurements and style preferences.
        
        Args:
            body_measurements: Body measurements
            style_preferences: Style preferences (optional)
            limit: Maximum number of recommendations
            
        Returns:
            List[Dict]: List of recommended dresses
        """
        if not self.dress_catalog:
            raise ValueError("Dress catalog not loaded. Call load_dress_catalog() first.")
        
        # If the DressImageProcessor has this method, use it
        if hasattr(self.dress_catalog, 'get_recommendations'):
            return self.dress_catalog.get_recommendations(
                body_measurements, style_preferences, limit
            )
            
        # Fallback to get_compatible_dresses with filtering
        compatible_dresses = self.get_compatible_dresses(body_measurements)
        
        # Apply style preferences filtering if provided
        if style_preferences and compatible_dresses:
            filtered_dresses = []
            for dress in compatible_dresses:
                # Check if dress matches style preferences
                style_match = True
                for key, value in style_preferences.items():
                    if key in dress and dress[key] != value:
                        style_match = False
                        break
                
                if style_match:
                    filtered_dresses.append(dress)
            
            # If we found dresses matching style, use them
            if filtered_dresses:
                recommendations = filtered_dresses
            else:
                # Fall back to compatible dresses if no style matches
                recommendations = compatible_dresses
        else:
            recommendations = compatible_dresses
            
        # Limit results
        return recommendations[:limit]
    
    def preprocess_dress_image(self, image_path: str) -> np.ndarray:
        """
        Load and preprocess the dress image.
        
        Args:
            image_path: Path to the dress image file
            
        Returns:
            np.ndarray: Preprocessed RGBA image
        """
        # Check if file exists
        if not os.path.exists(image_path):
            # Try searching in common directories for the dress image
            image_filename = os.path.basename(image_path)
            search_directories = [
                os.path.join(os.path.dirname(self.catalog_path), "images") if hasattr(self, 'catalog_path') else None,
                os.path.join(os.path.dirname(self.catalog_path), "dresses") if hasattr(self, 'catalog_path') else None,
                os.path.dirname(self.catalog_path) if hasattr(self, 'catalog_path') else None,
                "e:/Induvidual project/Dresslink-platform/backend/data/sample_dresses"
            ]
            
            for directory in search_directories:
                if directory is None:
                    continue
                full_path = os.path.join(directory, image_filename)
                if os.path.exists(full_path):
                    image_path = full_path
                    logger.info(f"Found dress image at {image_path}")
                    break
            
            if not os.path.exists(image_path):
                raise FileNotFoundError(f"Image not found: {image_path}")
        
        try:
            # Load image with alpha channel if available
            img = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
            
            # Convert BGR to RGB
            if img.shape[2] == 3:  # No alpha channel
                img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                # Add alpha channel
                alpha = self._create_alpha_mask(img)
                img = np.dstack((img, alpha))
            elif img.shape[2] == 4:  # With alpha channel
                img = cv2.cvtColor(img, cv2.COLOR_BGRA2RGBA)
            
            logger.info(f"Loaded dress image: {image_path}, shape: {img.shape}")
            return img
            
        except Exception as e:
            logger.error(f"Error loading image {image_path}: {str(e)}")
            raise
    
    def _create_alpha_mask(self, img: np.ndarray) -> np.ndarray:
        """
        Create an alpha mask by removing background.
        
        Args:
            img: RGB image
            
        Returns:
            np.ndarray: Alpha channel mask
        """
        # Convert to grayscale for processing
        gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
        
        # Method 1: Simple threshold for white/light backgrounds
        _, mask_threshold = cv2.threshold(
            gray, self.background_threshold, 255, cv2.THRESH_BINARY_INV
        )
        
        # Method 2: Use GrabCut for more complex backgrounds
        if np.sum(mask_threshold) / 255 < img.shape[0] * img.shape[1] * 0.01:
            # If threshold method gave almost empty mask, try GrabCut
            mask = np.zeros(img.shape[:2], np.uint8)
            bgd_model = np.zeros((1, 65), np.float64)
            fgd_model = np.zeros((1, 65), np.float64)
            
            # Assume the center portion is the foreground
            rect = (
                img.shape[1] // 4, 
                img.shape[0] // 4,
                img.shape[1] // 2, 
                img.shape[0] // 2
            )
            
            try:
                cv2.grabCut(
                    img, mask, rect, bgd_model, fgd_model, 5, cv2.GC_INIT_WITH_RECT
                )
                mask = np.where((mask == 2) | (mask == 0), 0, 255).astype('uint8')
            except:
                # Fallback to threshold method if GrabCut fails
                logger.warning("GrabCut failed, falling back to threshold method")
                mask = mask_threshold
        else:
            mask = mask_threshold
        
        # Apply morphological operations to clean up the mask
        kernel = np.ones((5, 5), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        
        return mask
    
    def determine_dress_type(self, dress_img: np.ndarray, dress_info: Optional[Dict] = None) -> str:
        """
        Determine the type of dress/clothing based on its shape or catalog info.
        
        Args:
            dress_img: RGBA dress image
            dress_info: Optional dress information from catalog
            
        Returns:
            str: Clothing type - "full", "top", or "bottom"
        """
        # If dress info is provided and contains type, use that
        if dress_info and 'type' in dress_info:
            return dress_info['type']
       
        # Extract alpha channel
        alpha = dress_img[:, :, 3]
        
        # Find non-zero pixels (clothing)
        non_zero = np.where(alpha > 0)
        
        if len(non_zero[0]) == 0:
            return "unknown"
            
        # Get the bounding box
        min_y = np.min(non_zero[0])
        max_y = np.max(non_zero[0])
        height = dress_img.shape[0]
        
        # Determine type based on vertical coverage
        top_ratio = min_y / height
        bottom_ratio = max_y / height
        
        if top_ratio < 0.2 and bottom_ratio > 0.8:
            return "full"  
        elif top_ratio < 0.2 and bottom_ratio < 0.7:
            return "top"  
        elif top_ratio > 0.3 and bottom_ratio > 0.8:
            return "bottom" 
        else:
            return "full"
    
    def resize_dress_for_body(self, 
                             dress_img: np.ndarray, 
                             dress_type: str = "full",
                             dress_info: Optional[Dict] = None) -> np.ndarray:
        """
        Resize dress to fit the body model.
        
        Args:
            dress_img: RGBA dress image
            dress_type: Type of clothing ("full", "top", or "bottom")
            dress_info: Optional dress information
            
        Returns:
            np.ndarray: Resized dress image
        """
        if self.body_model is None:
            raise ValueError("Body model not set. Call set_body_model() first.")
        
        # Get body segments for reference
        segments = self.body_model.body_segments
        shoulders = segments['shoulders']
        bust = segments['bust'] 
        hips = segments['hips']
        
        canvas_size = self.body_model.canvas_size
        
        # Calculate target dimensions based on dress type and body
        if dress_type == "full":
            # Full dress covers from shoulders to below hips
            target_height = int((hips['y'] + hips['height'] - shoulders['y']) * 1.2)
            width_reference = shoulders['width'] * 1.5
        elif dress_type == "top":
            # Top covers from shoulders to waist
            waist = segments['waist']
            target_height = int(waist['y'] - shoulders['y'] + waist['height'])
            width_reference = shoulders['width'] * 1.3
        elif dress_type == "bottom":
            # Bottom covers from waist to below hips
            waist = segments['waist']
            target_height = int((hips['y'] + hips['height'] - waist['y']) * 1.1)
            width_reference = hips['width'] * 1.2
        else:
            # Default to full dress
            target_height = int((hips['y'] + hips['height'] - shoulders['y']) * 1.2)
            width_reference = shoulders['width'] * 1.5
        
        # Calculate width while preserving aspect ratio
        aspect_ratio = dress_img.shape[1] / dress_img.shape[0]
        target_width = int(target_height * aspect_ratio)
        
        # Ensure the width isn't too wide or too narrow for the body
        max_width = int(width_reference * 2)
        min_width = int(width_reference * 0.8)
        
        if target_width > max_width:
            target_width = max_width
            target_height = int(target_width / aspect_ratio)
        elif target_width < min_width:
            target_width = min_width
            target_height = int(target_width / aspect_ratio)
        
        # Resize the dress
        resized_dress = cv2.resize(
            dress_img, (target_width, target_height), interpolation=self.resize_method
        )
        
        logger.info(f"Resized dress to {target_width}x{target_height} for {dress_type} type")
        return resized_dress
    
    def warp_dress_to_body_shape(self, 
                               dress_img: np.ndarray, 
                               dress_type: str = "full") -> np.ndarray:
        """
        Warp the dress to match the body shape.
        
        Args:
            dress_img: RGBA dress image
            dress_type: Type of clothing ("full", "top", or "bottom")
            
        Returns:
            np.ndarray: Warped dress image to fit the body shape
        """
        if self.body_model is None:
            raise ValueError("Body model not set. Call set_body_model() first.")
            
        # Get body segments and shape
        segments = self.body_model.body_segments
        body_shape = self.body_model.body_shape
        
        # Create a copy of the image to avoid modifying the original
        warped_dress = np.copy(dress_img)
        
        
        if body_shape == "rectangle" or \
           dress_img.shape[0] < 100 or dress_img.shape[1] < 50:
            return warped_dress
        
        # Parameters for warping based on body shape
        if body_shape == "hourglass":
            waist_factor = 0.85 
            hip_factor = 1.05 if dress_type in ["full", "bottom"] else 1.0 
        elif body_shape == "apple":
            waist_factor = 1.15 
            hip_factor = 0.95 if dress_type in ["full", "bottom"] else 1.0 
        elif body_shape == "pear":
            waist_factor = 0.9 
            hip_factor = 1.15 if dress_type in ["full", "bottom"] else 1.0 
        else:
            return warped_dress 
        
        # Calculate vertical reference points
        height = dress_img.shape[0]
        width = dress_img.shape[1]
        
        # Split the image into three parts vertically: top, middle (waist), bottom
        if dress_type == "full":
            waist_y = int(height * 0.45)  
            hip_y = int(height * 0.7)   
        elif dress_type == "top":
            waist_y = int(height * 0.7)
            hip_y = height               
        elif dress_type == "bottom":
            waist_y = int(height * 0.2)  
            hip_y = int(height * 0.5)   
        
       
        if dress_type == "top" and body_shape == "pear":
            # No warping needed for tops on pear-shaped bodies
            return warped_dress
            
        if dress_type == "bottom" and body_shape == "apple":
            # No warping needed for bottoms on apple-shaped bodies
            return warped_dress
        
     
        # Create a map of how much to shift each pixel
        map_x = np.zeros((height, width), np.float32)
        map_y = np.zeros((height, width), np.float32)
        
        center_x = width // 2
        
        for y in range(height):
            for x in range(width):
                # Calculate normalized horizontal distance from center
                dist_from_center = (x - center_x) / (width / 2)
                
                # No vertical shift
                map_y[y, x] = y
                
                # Calculate horizontal shift based on vertical position
                if y < waist_y:
                    # Top portion - minimal warping
                    shift_factor = 1.0 + (waist_factor - 1.0) * (y / waist_y) * 0.5
                elif dress_type == "top" or y < hip_y:
                    # Waist portion - apply waist factor
                    shift_factor = waist_factor
                else:
                    # Hip portion - apply hip factor
                    hip_progress = (y - hip_y) / (height - hip_y)
                    shift_factor = waist_factor + (hip_factor - waist_factor) * hip_progress
                
                # Calculate new x position
                new_x = center_x + dist_from_center * (width / 2) * shift_factor
                map_x[y, x] = new_x
        
        # Apply the transformation
        warped_dress = cv2.remap(dress_img, map_x, map_y, cv2.INTER_LINEAR)
        
        logger.info(f"Warped dress to match {body_shape} body shape")
        return warped_dress
    
    def apply_dress_to_body(self, 
                          dress_img: np.ndarray, 
                          dress_type: Optional[str] = None,
                          dress_info: Optional[Dict] = None) -> np.ndarray:
        """
        Apply the dress to the body model.
        
        Args:
            dress_img: RGBA dress image
            dress_type: Optional dress type, will be auto-detected if None
            dress_info: Optional dress information from catalog
            
        Returns:
            np.ndarray: Body model with the dress applied
        """
        if self.body_model is None:
            raise ValueError("Body model not set. Call set_body_model() first.")
        
        # Detect dress type if not provided
        if dress_type is None:
            dress_type = self.determine_dress_type(dress_img, dress_info)
            logger.info(f"Detected dress type: {dress_type}")
        
        # Resize dress to fit body
        resized_dress = self.resize_dress_for_body(dress_img, dress_type, dress_info)
        
        # Warp dress to match body shape
        warped_dress = self.warp_dress_to_body_shape(resized_dress, dress_type)
        
        # Render the body model
        body_canvas = self.body_model.render()
        
        # Calculate position to place the dress
        segments = self.body_model.body_segments
        canvas_size = self.body_model.canvas_size
        
        # Position at appropriate body segment
        if dress_type == "full":
            # Position at shoulders
            y_offset = int(segments['shoulders']['y'] - segments['shoulders']['height'])
        elif dress_type == "top":
            # Position at shoulders
            y_offset = int(segments['shoulders']['y'] - segments['shoulders']['height'])
        elif dress_type == "bottom":
            # Position at waist
            y_offset = int(segments['waist']['y'] - segments['waist']['height'] / 2)
        else:
            # Default to shoulders
            y_offset = int(segments['shoulders']['y'] - segments['shoulders']['height'])
        
        # Center horizontally
        x_offset = (canvas_size[0] - warped_dress.shape[1]) // 2
        
        # Create result canvas
        result = np.copy(body_canvas)
        
        # Alpha blend the dress onto the body
        for y in range(warped_dress.shape[0]):
            if y_offset + y >= canvas_size[1]:
                break
                
            for x in range(warped_dress.shape[1]):
                if (y_offset + y) < 0 or (x_offset + x) < 0 or (x_offset + x) >= canvas_size[0]:
                    continue
                    
                # Only apply dress pixels with alpha > 0
                if warped_dress[y, x, 3] > 0:
                    alpha = warped_dress[y, x, 3] / 255.0
                    
                    # Alpha blend
                    for c in range(3):  
                        result[y_offset + y, x_offset + x, c] = int(
                            alpha * warped_dress[y, x, c] + 
                            (1 - alpha) * body_canvas[y_offset + y, x_offset + x, c]
                        )
                    
                    # Set alpha channel
                    result[y_offset + y, x_offset + x, 3] = 255
        
        logger.info(f"Applied {dress_type} dress to body model")
        return result
    
    def process_and_apply(self, 
                         image_path: str, 
                         dress_type: Optional[str] = None,
                         dress_info: Optional[Dict] = None) -> np.ndarray:
        """
        Process a dress image and apply it to the body model in one step.
        
        Args:
            image_path: Path to the dress image
            dress_type: Optional dress type, will be auto-detected if None
            dress_info: Optional dress information
            
        Returns:
            np.ndarray: Body model with the dress applied
        """
        if self.body_model is None:
            raise ValueError("Body model not set. Call set_body_model() first.")
        
        # Load and preprocess the dress image
        dress_img = self.preprocess_dress_image(image_path)
        
        # Apply to the body model
        result = self.apply_dress_to_body(dress_img, dress_type, dress_info)
        
        return result
    
    def save_result(self, result_img: np.ndarray, output_path: str):
        """
        Save the resulting image.
        
        Args:
            result_img: Image to save
            output_path: Path to save the image
        """
        # Convert RGBA to BGRA for OpenCV
        bgra_img = cv2.cvtColor(result_img, cv2.COLOR_RGBA2BGRA)
        
        # Save the image
        cv2.imwrite(output_path, bgra_img)
        logger.info(f"Saved result to {output_path}")
        
    def _calculate_fit_score(self, ratio: float, min_good: float, max_good: float) -> float:
        """
        Calculate fit score for a measurement ratio.
        
        Args:
            ratio: Ratio of body to dress measurement
            min_good: Minimum ratio for good fit
            max_good: Maximum ratio for good fit
            
        Returns:
            float: Fit score from 0 to 1
        """
        if ratio < min_good:
            # Too tight
            return max(0, 1.0 - (min_good - ratio) * 5)
        elif ratio > max_good:
            # Too loose
            return max(0, 1.0 - (ratio - max_good) * 5)
        else:
            # Good fit
            return 1.0


if __name__ == "__main__":
    # Ensure test files exist
    catalog_path, sample_dir = ensure_test_files_exist()
    
    # Create a body model
    measurements_dataset = "e:/Induvidual project/Dresslink-platform/backend/data/processed/body_measurements.csv"
    
    body_model = BodyModel(measurements_dataset)
    
    # Update with example measurements - try different body shapes
    body_model.update_measurements({"bust": 85, "waist": 70, "hips": 100})  # Pear
    
    # Create a dress transformer with catalog
    dress_transformer = DressTransformer(body_model, catalog_path)
    
    # Verify catalog was loaded
    print(f"Loaded dress catalog: {dress_transformer.dress_catalog is not None}")
    
    # Generate sample dress paths
    sample_dress_paths = [
        os.path.join(sample_dir, "dress1.png"),
        os.path.join(sample_dir, "dress2.png"),
        "e:/Induvidual project/Dresslink-platform/backend/data/dresses/sample_dress.png"
    ]
    
    # Try to find an existing dress image
    dress_found = False
    for dress_path in sample_dress_paths:
        if os.path.exists(dress_path):
            dress_found = True
            print(f"Using dress image: {dress_path}")
            
            # Save the body model without dress for comparison
            body_img = body_model.render("body_model_only.png")
            print(f"Body shape: {body_model.body_shape}, Size: {body_model.size}")
            
            # Process and apply the dress to the body model
            result = dress_transformer.process_and_apply(dress_path)
            
            # Save the result
            dress_transformer.save_result(result, "dressed_body_model.png")
            print(f"Body model with dress applied saved to dressed_body_model.png")
            break
    
    if not dress_found:
        print("No sample dress images found. This shouldn't happen since we created one.")
    
    print("Completed dress transformer example")