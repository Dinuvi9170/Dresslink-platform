import os
import logging
import cv2
import numpy as np
from pathlib import Path
import sys

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

logger = logging.getLogger(__name__)

class ImageProcessor:
    """
    Processes images for the virtual fitting room, including background removal,
    body detection, and measurement estimation.
    """
    
    def __init__(self):
        """Initialize the image processor"""
        # Initialize face detector
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
    def preprocess_user_image(self, image_path):
        """
        Preprocess user image for virtual try-on.
        
        Args:
            image_path: Path to user image
            
        Returns:
            Preprocessed image
        """
        # Load image
        img = cv2.imread(image_path)
        
        if img is None:
            raise ValueError(f"Could not load image from {image_path}")
        
        # Resize to standard height while maintaining aspect ratio
        target_height = 800
        aspect_ratio = img.shape[1] / img.shape[0]
        target_width = int(target_height * aspect_ratio)
        img_resized = cv2.resize(img, (target_width, target_height))
        
        # Detect face to determine orientation and scale
        faces = self.face_cascade.detectMultiScale(cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY), 1.1, 4)
        
        if len(faces) > 0:
            # Get the largest face
            face = max(faces, key=lambda x: x[2] * x[3])
            x, y, w, h = face
            
            # Estimate body position based on face position
            body_top = y + h
            body_height = target_height - body_top
            
            # Crop to focus on body
            body_img = img_resized[body_top:, :]
        else:
            # If no face detected, use the whole image
            body_img = img_resized
        
        # Remove background (simple method - in a real app use a better segmentation model)
        mask = self._create_simple_body_mask(body_img)
        
        # Apply mask to remove background
        body_no_bg = cv2.bitwise_and(body_img, body_img, mask=mask)
        
        # Add white background
        white_bg = np.ones_like(body_img) * 255
        body_with_white_bg = cv2.bitwise_and(white_bg, white_bg, mask=cv2.bitwise_not(mask))
        processed_img = cv2.add(body_no_bg, body_with_white_bg)
        
        return processed_img
    
    def extract_dress(self, image_path):
        """
        Extract dress from image by removing background.
        
        Args:
            image_path: Path to dress image
            
        Returns:
            Processed dress image
        """
        # Load image
        img = cv2.imread(image_path)
        
        if img is None:
            raise ValueError(f"Could not load image from {image_path}")
        
        # Resize to standard height while maintaining aspect ratio
        target_height = 800
        aspect_ratio = img.shape[1] / img.shape[0]
        target_width = int(target_height * aspect_ratio)
        img_resized = cv2.resize(img, (target_width, target_height))
        
        # Create mask to separate dress from background
        hsv = cv2.cvtColor(img_resized, cv2.COLOR_BGR2HSV)
        
        # Assume background is significantly different from dress
        # This is a simplified approach - in a real app use a better segmentation model
        
        # Detect dominant color (assume it's background)
        hist = cv2.calcHist([hsv], [0, 1], None, [180, 256], [0, 180, 0, 256])
        max_idx = np.unravel_index(hist.argmax(), hist.shape)
        bg_h, bg_s = max_idx
        
        # Create mask by thresholding
        mask = cv2.inRange(hsv, (bg_h-10, bg_s-40, 0), (bg_h+10, bg_s+40, 255))
        mask = cv2.bitwise_not(mask)  # Invert to get dress
        
        # Clean up mask
        kernel = np.ones((5, 5), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        
        # Apply mask to original image
        dress_img = cv2.bitwise_and(img_resized, img_resized, mask=mask)
        
        # Create RGBA image with transparency
        b, g, r = cv2.split(dress_img)
        rgba = cv2.merge((b, g, r, mask))
        
        return rgba
    
    def estimate_measurements(self, image_path):
        """
        Estimate body measurements from user image.
        This is a simplified approach and would require a more sophisticated model in production.
        
        Args:
            image_path: Path to user image
            
        Returns:
            Dictionary of estimated measurements
        """
        # Load image
        img = cv2.imread(image_path)
        
        if img is None:
            raise ValueError(f"Could not load image from {image_path}")
        
        # Resize to standard height while maintaining aspect ratio
        target_height = 800
        aspect_ratio = img.shape[1] / img.shape[0]
        target_width = int(target_height * aspect_ratio)
        img_resized = cv2.resize(img, (target_width, target_height))
        
        # Detect face to determine scale
        faces = self.face_cascade.detectMultiScale(cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY), 1.1, 4)
        
        if len(faces) == 0:
            logger.warning("No face detected in image, cannot estimate measurements")
            return None
            
        # Get largest face
        face = max(faces, key=lambda x: x[2] * x[3])
        _, _, fw, fh = face
        
        # Estimate height based on face size (average face height is about 1/8 of total height)
        estimated_height_cm = (target_height / fh) * 20  # Assuming face is about 20cm
        
        # Create body mask
        body_mask = self._create_simple_body_mask(img_resized)
        
        # Find contours
        contours, _ = cv2.findContours(body_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            logger.warning("No body contour detected, cannot estimate measurements")
            return None
            
        # Get largest contour
        body_contour = max(contours, key=cv2.contourArea)
        
        # Get bounding box
        x, y, w, h = cv2.boundingRect(body_contour)
        
        # Estimate chest height (approximately 1/4 of the way down)
        chest_y = int(y + h * 0.25)
        
        # Estimate waist height (approximately 1/2 of the way down)
        waist_y = int(y + h * 0.5)
        
        # Estimate hip height (approximately 3/4 of the way down)
        hip_y = int(y + h * 0.75)
        
        # Calculate widths at these heights
        chest_pixels = np.sum(body_mask[chest_y, :] > 0)
        waist_pixels = np.sum(body_mask[waist_y, :] > 0)
        hip_pixels = np.sum(body_mask[hip_y, :] > 0)
        
        # Convert to cm using the scale calculated from face
        pixels_per_cm = estimated_height_cm / target_height
        
        # Estimates - these are rough approximations
        bust = chest_pixels * pixels_per_cm
        waist = waist_pixels * pixels_per_cm
        hips = hip_pixels * pixels_per_cm
        
        # Width to circumference estimation (circumference ≈ 2π × radius)
        # Assuming body is roughly elliptical with depth about 3/4 of width
        bust = bust * np.pi * 0.75
        waist = waist * np.pi * 0.75
        hips = hips * np.pi * 0.75
        
        return {
            "height": round(estimated_height_cm),
            "bust": round(bust),
            "waist": round(waist),
            "hips": round(hips)
        }
    
    def _create_simple_body_mask(self, img):
        """
        Create a simple mask for body segmentation.
        This is a simplified approach - in a real app use a proper segmentation model.
        
        Args:
            img: Input image
            
        Returns:
            Binary mask
        """
        # Convert to HSV
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        
        # Detect skin tones (simplified)
        lower_skin = np.array([0, 20, 70], dtype=np.uint8)
        upper_skin = np.array([20, 100, 255], dtype=np.uint8)
        mask1 = cv2.inRange(hsv, lower_skin, upper_skin)
        
        # Additional range for skin tones
        lower_skin2 = np.array([160, 20, 70], dtype=np.uint8)
        upper_skin2 = np.array([180, 100, 255], dtype=np.uint8)
        mask2 = cv2.inRange(hsv, lower_skin2, upper_skin2)
        
        # Combine masks
        skin_mask = cv2.bitwise_or(mask1, mask2)
        
        # Clean up mask
        kernel = np.ones((9, 9), np.uint8)
        skin_mask = cv2.dilate(skin_mask, kernel, iterations=3)
        skin_mask = cv2.GaussianBlur(skin_mask, (11, 11), 0)
        
        # Find contours
        contours, _ = cv2.findContours(skin_mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        
        # Create body mask
        body_mask = np.zeros_like(skin_mask)
        
        if contours:
            # Find largest contour (should be body)
            max_contour = max(contours, key=cv2.contourArea)
            
            # Fill contour
            cv2.drawContours(body_mask, [max_contour], 0, 255, -1)
        
        return body_mask