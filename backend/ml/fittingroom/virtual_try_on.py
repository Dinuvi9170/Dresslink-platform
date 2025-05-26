import os
import logging
import cv2
import numpy as np
from pathlib import Path
import sys

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from models.body_model import BodyModel

logger = logging.getLogger(__name__)

class VirtualFittingRoom:
    """
    Virtual Fitting Room for 2D dress try-on visualization.
    This class handles the process of overlaying dress images onto user images.
    """
    
    def __init__(self, data_dir=None):
        """
        Initialize the virtual fitting room with necessary resources.
        
        Args:
            data_dir: Base directory containing resources and models
        """
        self.data_dir = data_dir or "e:/Induvidual project/Dresslink-platform/backend/data"
        self.templates_dir = os.path.join(self.data_dir, "templates")
        
        # Create directories if they don't exist
        os.makedirs(self.templates_dir, exist_ok=True)
        
        # Load body templates for each body shape 
        self.body_templates = {}
        for shape in ["hourglass", "apple", "pear", "rectangle"]:
            template_path = os.path.join(self.templates_dir, f"{shape}_template.png")
            if os.path.exists(template_path):
                self.body_templates[shape] = cv2.imread(template_path, cv2.IMREAD_UNCHANGED)
                logger.info(f"Loaded body template for {shape} shape")
            else:
                logger.warning(f"No body template found for {shape} shape at {template_path}")
    
    def try_on(self, silhouette_path, dress_image_path, body_shape=None,measurements=None, output_path=None, is_silhouette=False):
        """
        Perform virtual try-on by overlaying a dress on a user image.
        
        Args:
            user_image_path: Path to the user's image
            dress_image_path: Path to the dress image
            body_shape: User's body shape (hourglass, apple, pear, rectangle)
            output_path: Path to save the result
            
        Returns:
            The result image as a numpy array
        """
        logger.info(f"Performing virtual try-on with silhouette: {silhouette_path}, dress: {dress_image_path}")
        
        # Load images
        silhouette = cv2.imread(silhouette_path)
        dress_img = cv2.imread(dress_image_path, cv2.IMREAD_UNCHANGED)
        
        if silhouette is None:
            raise ValueError(f"Could not load silhouette from {silhouette_path}")
            
        if dress_img is None:
            raise ValueError(f"Could not load dress image from {dress_image_path}")
            
        # Use alpha channel if available, otherwise create a mask
        if dress_img.shape[2] == 4:
           
            dress_mask = dress_img[:,:,3]
            dress_img = dress_img[:,:,0:3]
        else:
            # Create mask using background removal
            dress_mask = self._extract_dress_mask(dress_img)
        
        # Scale dress based on measurements if provided
        if measurements:
            transformed_dress, transformed_mask = self._transform_dress_with_measurements(
                dress_img, 
                dress_mask, 
                body_shape, 
                measurements,
                silhouette.shape[0],  
                silhouette.shape[1]  
            )
        # Otherwise use body shape templates
        elif body_shape and body_shape in self.body_templates:
            
            transformed_dress, transformed_mask = self._transform_dress_for_body_shape(
                dress_img, dress_mask, body_shape
            )
        else:
            
            transformed_dress = cv2.resize(dress_img, (silhouette.shape[1], silhouette.shape[0]))
            transformed_mask = cv2.resize(dress_mask, (silhouette.shape[1], silhouette.shape[0]))
        
        # Position the dress on the silhouette
        result_img = self._overlay_dress(silhouette, transformed_dress, transformed_mask)
        
        # Save the result if output path provided
        if output_path:
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            cv2.imwrite(output_path, result_img)
            logger.info(f"Saved virtual try-on result to {output_path}")
        
        return result_img
    
    def _transform_dress_with_measurements(self, dress_img, dress_mask, body_shape, measurements, target_height, target_width):
        """
        Transform dress according to user's measurements
        
        Args:
            dress_img: Original dress image
            dress_mask: Mask for the dress
            body_shape: Body shape classification
            measurements: Dictionary with bust, waist, hips, height values
            target_height: Height of the target silhouette
            target_width: Width of the target silhouette
            
        Returns:
            Transformed dress image and mask
        """
        h_dress, w_dress = dress_img.shape[:2]
        
        # Extract measurements
        bust = measurements.get('bust', 90)  # cm
        waist = measurements.get('waist', 70)  # cm
        hips = measurements.get('hips', 95)  # cm
        height = measurements.get('height', 165)  # cm
        
        # Calculate proportions relative to standard measurements
        bust_ratio = bust / 90.0  
        waist_ratio = waist / 70.0  
        hip_ratio = hips / 95.0  
        
        # Create transformation mesh
        src_mesh = np.array([
            [0, 0], [w_dress, 0],
            [0, int(h_dress * 0.3)], [w_dress, int(h_dress * 0.3)], 
            [0, int(h_dress * 0.4)], [w_dress, int(h_dress * 0.4)],  
            [0, int(h_dress * 0.6)], [w_dress, int(h_dress * 0.6)], 
            [0, h_dress], [w_dress, h_dress]
        ], dtype=np.float32).reshape(-1, 2)
        
        # Calculate base width for dress at different points
        base_width = target_width * 0.7  
        
        # Width adjustments based on measurements and body shape
        shoulder_width = base_width * (1.0 + (bust_ratio - 1.0) * 0.5)
        bust_width = base_width * bust_ratio
        waist_width = base_width * waist_ratio
        hip_width = base_width * hip_ratio
        bottom_width = base_width * (1.0 + (hip_ratio - 1.0) * 0.7)  
        
        # Adjust for specific body shapes
        if body_shape == "hourglass":
            waist_width *= 0.95 
        elif body_shape == "apple":
            waist_width *= 1.05 
            hip_width *= 0.98  
        elif body_shape == "pear":
            waist_width *= 0.98  
            hip_width *= 1.05  
        elif body_shape == "rectangle":
            waist_width = (bust_width + hip_width) / 2  
        
        # Calculate horizontal offsets to center the dress
        shoulder_offset = (target_width - shoulder_width) / 2
        bust_offset = (target_width - bust_width) / 2
        waist_offset = (target_width - waist_width) / 2
        hip_offset = (target_width - hip_width) / 2
        bottom_offset = (target_width - bottom_width) / 2
        
        # Target mesh with measurements-specific adjustments
        dst_mesh = np.array([
            [shoulder_offset, 0], [shoulder_offset + shoulder_width, 0],  
            [bust_offset, int(target_height * 0.3)], [bust_offset + bust_width, int(target_height * 0.3)],  
            [waist_offset, int(target_height * 0.4)], [waist_offset + waist_width, int(target_height * 0.4)],  
            [hip_offset, int(target_height * 0.6)], [hip_offset + hip_width, int(target_height * 0.6)],  
            [bottom_offset, target_height], [bottom_offset + bottom_width, target_height] 
        ], dtype=np.float32).reshape(-1, 2)
        
        # Apply transformation using thin plate spline
        tps = cv2.createThinPlateSplineShapeTransformer()
        tps.estimateTransformation(dst_mesh.reshape(1, -1, 2), src_mesh.reshape(1, -1, 2), None)
        
        # Create output images
        transformed_dress = np.zeros((target_height, target_width, 3), dtype=np.uint8)
        transformed_mask = np.zeros((target_height, target_width), dtype=np.uint8)
        
        # Apply transformation to each point
        for y in range(target_height):
            for x in range(target_width):
                # Get transformed coordinates
                pt = np.array([[x, y]], dtype=np.float32).reshape(1, 1, 2)
                transformed_pt = tps.applyTransformation(pt)[0][0]
                tx, ty = int(transformed_pt[0]), int(transformed_pt[1])
                
                # Check if transformed point is within original dress bounds
                if 0 <= tx < w_dress and 0 <= ty < h_dress:
                    transformed_dress[y, x] = dress_img[ty, tx]
                    transformed_mask[y, x] = dress_mask[ty, tx]
        
        return transformed_dress, transformed_mask
    
    def adjust_fit(self, previous_result_path, tightness=0, length=0, shoulder_width=0, output_path=None):
        """
        Adjust the fit of a previously generated try-on result.
        
        Args:
            previous_result_path: Path to previous try-on result
            tightness: Adjustment factor for tightness (-10 to +10)
            length: Adjustment factor for length (-10 to +10)
            shoulder_width: Adjustment factor for shoulder width (-10 to +10)
            output_path: Path to save the result
            
        Returns:
            The adjusted result image as a numpy array
        """
        logger.info(f"Adjusting fit with tightness={tightness}, length={length}, shoulder_width={shoulder_width}")
        
        # Load previous result
        result_img = cv2.imread(previous_result_path)
        
        if result_img is None:
            raise ValueError(f"Could not load previous result from {previous_result_path}")
        
        h, w = result_img.shape[:2]
        
        # Apply transformations based on adjustment parameters
        
        # 1. Adjust tightness (width scaling)
        tightness_scale = 1 - (tightness / 50) 
        
        # 2. Adjust length
        length_change = int(h * (length / 100))  
        
        # 3. Adjust shoulder width
        shoulder_scale = 1 + (shoulder_width / 50) 
        
        # Create transformation matrix
        src_pts = np.array([[0, 0], [w, 0], [0, h], [w, h]], dtype=np.float32)
        
        # Calculate new points considering all transformations
        shoulder_width_change = int(w * (1 - shoulder_scale) / 2)
        waist_width_change = int(w * (1 - tightness_scale) / 2)
        
        dst_pts = np.array([
            [shoulder_width_change, 0], 
            [w - shoulder_width_change, 0], 
            [waist_width_change, h - length_change], 
            [w - waist_width_change, h - length_change] 
        ], dtype=np.float32)
        
        # Apply perspective transform
        transform_matrix = cv2.getPerspectiveTransform(src_pts, dst_pts)
        adjusted_img = cv2.warpPerspective(result_img, transform_matrix, (w, h))
        
        # Save the result if output path provided
        if output_path:
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            cv2.imwrite(output_path, adjusted_img)
            logger.info(f"Saved adjusted fit result to {output_path}")
        
        return adjusted_img
    
    def _extract_dress_mask(self, dress_img):
        """
        Extract mask from dress image (simple background removal).
        
        Args:
            dress_img: Dress image without alpha channel
        
        Returns:
            Binary mask for the dress
        """
        # Convert to grayscale
        gray = cv2.cvtColor(dress_img, cv2.COLOR_BGR2GRAY)
        
        # Threshold to get binary mask
        _, mask = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)
        
        # Apply morphological operations to clean up the mask
        kernel = np.ones((5, 5), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        
        return mask
    
    def _transform_dress_for_body_shape(self, dress_img, dress_mask, body_shape):
        """
        Transform dress image to match specific body shape.
        
        Args:
            dress_img: Original dress image
            dress_mask: Mask for the dress
            body_shape: Body shape to transform for
            
        Returns:
            Transformed dress image and mask
        """
        h_dress, w_dress = dress_img.shape[:2]
        
        # Get template for this body shape
        template = self.body_templates.get(body_shape)
        
        if template is None:
            # Fallback to simple resizing if no template
            logger.warning(f"No template available for {body_shape}, using simple resize")
            return cv2.resize(dress_img, (w_dress, h_dress)), cv2.resize(dress_mask, (w_dress, h_dress))
        
        h_template, w_template = template.shape[:2]
        
        # Calculate width at different heights based on template
        waist_height = int(h_template * 0.4) 
        hip_height = int(h_template * 0.6)  
        
        # Get template widths at different heights
        top_width = np.sum(template[int(h_template * 0.2), :, 3] > 0)
        waist_width = np.sum(template[waist_height, :, 3] > 0)
        hip_width = np.sum(template[hip_height, :, 3] > 0)
        
        # Create transformation mesh
        src_mesh = np.array([
            [0, 0], [w_dress, 0],  
            [0, int(h_dress * 0.4)], [w_dress, int(h_dress * 0.4)], 
            [0, int(h_dress * 0.6)], [w_dress, int(h_dress * 0.6)], 
            [0, h_dress], [w_dress, h_dress]  
        ], dtype=np.float32).reshape(-1, 2)
        
        # Calculate scaling factors
        top_scale = top_width / w_template
        waist_scale = waist_width / w_template
        hip_scale = hip_width / w_template
        
        # Target mesh with shape-specific adjustments
        width_adjustment = (w_dress * top_scale) / 2
        waist_adjustment = (w_dress * waist_scale) / 2
        hip_adjustment = (w_dress * hip_scale) / 2
        
        dst_mesh = np.array([
            [w_dress/2 - width_adjustment, 0], [w_dress/2 + width_adjustment, 0], 
            [w_dress/2 - waist_adjustment, int(h_dress * 0.4)], [w_dress/2 + waist_adjustment, int(h_dress * 0.4)], 
            [w_dress/2 - hip_adjustment, int(h_dress * 0.6)], [w_dress/2 + hip_adjustment, int(h_dress * 0.6)],  
            [w_dress/2 - width_adjustment, h_dress], [w_dress/2 + width_adjustment, h_dress] 
        ], dtype=np.float32).reshape(-1, 2)
        
        # Apply shape adjustments based on body shape
        if body_shape == "hourglass":
            # Accentuate waist
            dst_mesh[2][0] += waist_adjustment * 0.1
            dst_mesh[3][0] -= waist_adjustment * 0.1
        elif body_shape == "apple":
            # Wider waist
            dst_mesh[2][0] -= waist_adjustment * 0.1
            dst_mesh[3][0] += waist_adjustment * 0.1
            # Narrower hip
            dst_mesh[4][0] += hip_adjustment * 0.1
            dst_mesh[5][0] -= hip_adjustment * 0.1
        elif body_shape == "pear":
            # Narrower waist
            dst_mesh[2][0] += waist_adjustment * 0.05
            dst_mesh[3][0] -= waist_adjustment * 0.05
            # Wider hip
            dst_mesh[4][0] -= hip_adjustment * 0.1
            dst_mesh[5][0] += hip_adjustment * 0.1
        
        
        # Apply transformation using thin plate spline
        tps = cv2.createThinPlateSplineShapeTransformer()
        tps.estimateTransformation(dst_mesh.reshape(1, -1, 2), src_mesh.reshape(1, -1, 2), None)
        
        # Apply transformation
        transformed_dress = np.zeros_like(dress_img)
        transformed_mask = np.zeros_like(dress_mask)
        
        # Apply transformation to each point
        h, w = dress_img.shape[:2]
        for y in range(h):
            for x in range(w):
                # Get transformed coordinates
                pt = np.array([[x, y]], dtype=np.float32).reshape(1, 1, 2)
                transformed_pt = tps.applyTransformation(pt)[0][0]
                tx, ty = int(transformed_pt[0]), int(transformed_pt[1])
                
                # Check if transformed point is within bounds
                if 0 <= tx < w and 0 <= ty < h:
                    transformed_dress[y, x] = dress_img[ty, tx]
                    transformed_mask[y, x] = dress_mask[ty, tx]
        
        return transformed_dress, transformed_mask
    
    def _overlay_dress(self, user_img, dress_img, mask):
        """
        Overlay dress on user image using the mask.
        
        Args:
            user_img: User image
            dress_img: Transformed dress image
            mask: Binary mask for the dress
            
        Returns:
            Combined image with dress overlaid on user
        """
        # Ensure all images have the same dimensions
        h_user, w_user = user_img.shape[:2]
        h_dress, w_dress = dress_img.shape[:2]
        
        if h_user != h_dress or w_user != w_dress:
            dress_img = cv2.resize(dress_img, (w_user, h_user))
            mask = cv2.resize(mask, (w_user, h_user))
        
        # Create copy of user image
        result = user_img.copy()
        
        # Normalize mask to 0-1 range for alpha blending
        alpha = mask.astype(float) / 255.0
        alpha = alpha[:, :, np.newaxis] 
        
        # Apply alpha blending
        result = (1.0 - alpha) * result + alpha * dress_img
        
        return result.astype(np.uint8)