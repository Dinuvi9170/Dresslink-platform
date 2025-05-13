import os
import numpy as np
import cv2
import logging
import pandas as pd
from typing import Dict, List, Tuple, Optional, Union
import json
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

# Import the measurement processor
from data_preprocessing.body_measurements import BodyMeasurementsProcessor

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class BodyModel:
    """
    Enhanced 2D body model for virtual fitting room applications.
    Creates a customizable body silhouette with distinct shapes based on measurements.
    Integrates with preprocessed measurement dataset.
    """
    
    def __init__(self, measurements_path: Optional[str] = None):
        """
        Initialize the body model with default values.
        
        Args:
            measurements_path: Optional path to the preprocessed measurements dataset
        """
        # Default measurements
        self.measurements = {
            'height': 170.0,  # cm
            'bust': 90.0,     # cm
            'waist': 70.0,    # cm
            'hips': 95.0,     # cm
            'shoulder_width': 40.0,  # cm
            'arm_length': 60.0,      # cm
            'leg_length': 80.0       # cm
        }
        
        # Body representation
        self.body_segments = {}
        self.body_shape = None
        self.size = None
        
        # Rendering settings
        self.canvas_size = (600, 800)  # width, height
        self.body_color = (255, 230, 210)  # Skin tone
        self.outline_color = (120, 80, 60)  # Darker outline
        
        # Initialize measurements processor with dataset
        self.measurements_processor = None
        if measurements_path:
            self.load_measurements_dataset(measurements_path)
        else:
            # Try to locate the default measurements dataset
            default_paths = [
                "../data/processed/body_measurements.csv",
                "./data/processed/body_measurements.csv",
                "e:/Induvidual project/Dresslink-platform/backend/data/processed/body_measurements.csv"
            ]
            for path in default_paths:
                if os.path.exists(path):
                    self.load_measurements_dataset(path)
                    break
    
    def load_measurements_dataset(self, dataset_path: str):
        """
        Load and initialize with the preprocessed measurements dataset.
        
        Args:
            dataset_path: Path to the preprocessed measurements dataset
        """
        try:
            # Initialize the measurements processor
            self.measurements_processor = BodyMeasurementsProcessor(dataset_path)
            logger.info(f"Successfully loaded measurements dataset from {dataset_path}")
        except Exception as e:
            logger.error(f"Failed to load measurements dataset: {str(e)}")
    
    def update_measurements(self, measurements: Dict[str, float]):
        """
        Update body measurements and process them using the dataset if available.
        
        Args:
            measurements: Dictionary of body measurements
        """
        # Update only provided measurements
        for key, value in measurements.items():
            if key in self.measurements:
                self.measurements[key] = value
        
        # If measurements processor is available, use it to enhance measurements
        if self.measurements_processor:
            try:
                # Get body shape from the processor
                proportions = self.measurements_processor.get_body_proportions(self.measurements)
                self.body_shape = proportions.get('body_shape')
                
                # Get size recommendation from the processor
                self.size = self.measurements_processor.get_size_recommendation(self.measurements)
                
                # Get enhanced measurements if available
                try:
                    # Try to call enhance_measurements if available
                    if hasattr(self.measurements_processor, 'enhance_measurements'):
                        enhanced_measurements = self.measurements_processor.enhance_measurements(self.measurements)
                    else:
                        # Fallback if method doesn't exist
                        enhanced_measurements = {}
                        logger.info("enhance_measurements method not available in BodyMeasurementsProcessor")
                except Exception as e:
                        logger.error(f"Error enhancing measurements: {str(e)}")
                        enhanced_measurements = {}
                        
                if enhanced_measurements:
                    # Update any missing measurements from enhanced data
                    for key, value in enhanced_measurements.items():
                        if key not in self.measurements or self.measurements[key] == 0:
                            self.measurements[key] = value
                
                logger.info(f"Measurements enhanced with dataset. Shape: {self.body_shape}, Size: {self.size}")
            except Exception as e:
                logger.error(f"Error processing measurements with dataset: {str(e)}")
                # Fallback to simple calculation
                self._determine_body_shape()
        else:
            # Fallback to simple calculation if no dataset
            self._determine_body_shape()
        
        # Recalculate body segments
        self._calculate_body_segments()
    
    def _determine_body_shape(self):
        """Determine body shape based on current measurements."""
        # Extract measurements
        bust = self.measurements['bust']
        waist = self.measurements['waist']
        hips = self.measurements['hips']
        
        # Calculate key ratios
        bust_to_waist = bust / waist if waist > 0 else 0
        hips_to_waist = hips / waist if waist > 0 else 0
        bust_to_hips = bust / hips if hips > 0 else 0
        
        # Determine body shape based on ratios
        if abs(bust - hips) <= 5 and (bust - waist) >= 15 and (hips - waist) >= 15:
            self.body_shape = 'hourglass'
        elif bust_to_hips > 1.05:
            self.body_shape = 'apple'
        elif bust_to_hips < 0.95:
            self.body_shape = 'pear'
        else:
            self.body_shape = 'rectangle'
        
        # Determine size (simplified approach)
        if bust < 82:
            self.size = 'XS'
        elif bust < 87:
            self.size = 'S'
        elif bust < 92:
            self.size = 'M'
        elif bust < 97:
            self.size = 'L'
        elif bust < 102:
            self.size = 'XL'
        else:
            self.size = 'XXL'
    
    def _calculate_body_segments(self):
        """Calculate body segments based on current measurements and body shape."""
        # Canvas center and scaling
        center_x = self.canvas_size[0] // 2
        height = self.measurements['height']
        
        # Scale factor to fit body in canvas
        scale_factor = (self.canvas_size[1] * 0.85) / height
        
        # Base measurements
        bust = self.measurements['bust'] * scale_factor
        waist = self.measurements['waist'] * scale_factor
        hips = self.measurements['hips'] * scale_factor
        shoulder_width = self.measurements.get('shoulder_width', self.measurements['bust'] * 1.1) * scale_factor
        
        # Apply shape-specific modifications
        if self.body_shape == 'hourglass':
            # Hourglass: emphasized bust and hips, narrow waist
            shoulder_width_factor = 1.05
            bust_width_factor = 1.0
            waist_width_factor = 0.95
            hips_width_factor = 1.0
            waist_position_factor = 1.0
            
        elif self.body_shape == 'apple':
            # Apple: wider upper body, less defined waist
            shoulder_width_factor = 1.1
            bust_width_factor = 1.15
            waist_width_factor = 1.1
            hips_width_factor = 0.95
            waist_position_factor = 0.9  # Higher waist
            
        elif self.body_shape == 'pear':
            # Pear: narrower shoulders, wider hips
            shoulder_width_factor = 0.95
            bust_width_factor = 0.9
            waist_width_factor = 0.95
            hips_width_factor = 1.1
            waist_position_factor = 1.05  # Lower waist
            
        else:  # rectangle
            # Rectangle: balanced proportions
            shoulder_width_factor = 1.0
            bust_width_factor = 1.0
            waist_width_factor = 1.05  # Less defined waist
            hips_width_factor = 1.0
            waist_position_factor = 1.0
        
        # Apply factors to measurements
        shoulder_width *= shoulder_width_factor
        bust_width = bust * bust_width_factor
        waist_width = waist * waist_width_factor
        hips_width = hips * hips_width_factor
        
        # Vertical spacing
        shoulder_y = self.canvas_size[1] * 0.15
        bust_y = shoulder_y + height * 0.12 * scale_factor
        waist_y = bust_y + height * 0.15 * scale_factor * waist_position_factor
        hips_y = waist_y + height * 0.15 * scale_factor
        
        # Store segments with shape-specific adjustments
        self.body_segments = {
            'shoulders': {
                'x': center_x,
                'y': shoulder_y,
                'width': shoulder_width,
                'height': height * 0.05 * scale_factor
            },
            'bust': {
                'x': center_x,
                'y': bust_y,
                'width': bust_width,
                'height': height * 0.08 * scale_factor
            },
            'waist': {
                'x': center_x,
                'y': waist_y,
                'width': waist_width,
                'height': height * 0.05 * scale_factor
            },
            'hips': {
                'x': center_x,
                'y': hips_y,
                'width': hips_width,
                'height': height * 0.08 * scale_factor
            },
            'arms': {
                'length': self.measurements.get('arm_length', 60.0) * scale_factor,
                'width': self.measurements['bust'] * 0.18 * scale_factor * 
                         (1.1 if self.body_shape == 'apple' else 0.9 if self.body_shape == 'pear' else 1.0)
            },
            'legs': {
                'length': self.measurements.get('leg_length', 80.0) * scale_factor,
                'width': self.measurements['hips'] * 0.25 * scale_factor * 
                         (1.1 if self.body_shape == 'pear' else 0.95 if self.body_shape == 'apple' else 1.0),
                'thigh_factor': 1.2 if self.body_shape == 'pear' else 0.9 if self.body_shape == 'apple' else 1.0
            }
        }
    
    def render(self, output_path: Optional[str] = None) -> np.ndarray:
        """
        Render the body model as an image.
        
        Args:
            output_path: Optional path to save the rendered image
            
        Returns:
            np.ndarray: The rendered body model image
        """
        # Ensure body segments are calculated
        if not self.body_segments:
            self._calculate_body_segments()
        
        # Create transparent canvas
        canvas = np.ones((self.canvas_size[1], self.canvas_size[0], 4), dtype=np.uint8) * 255
        canvas[:, :, 3] = 0  # Transparent background
        
        # Draw body
        self._draw_body(canvas)
        
        # Add annotations if needed
        if self.body_shape and self.size:
            font = cv2.FONT_HERSHEY_SIMPLEX
            text = f"Shape: {self.body_shape.capitalize()}, Size: {self.size}"
            text_size = cv2.getTextSize(text, font, 0.6, 2)[0]
            text_x = (self.canvas_size[0] - text_size[0]) // 2
            text_y = int(self.canvas_size[1] * 0.95)
            cv2.putText(canvas, text, (text_x, text_y), font, 0.6, (0, 0, 0, 255), 2)
        
        # Save if needed
        if output_path:
            cv2.imwrite(output_path, cv2.cvtColor(canvas, cv2.COLOR_RGBA2BGRA))
            logger.info(f"Body model saved to {output_path}")
        
        return canvas
    
    def _draw_body(self, canvas):
        """Draw the body on the canvas with shape-specific adjustments."""
        # Extract body segments
        shoulders = self.body_segments['shoulders']
        bust = self.body_segments['bust']
        waist = self.body_segments['waist']
        hips = self.body_segments['hips']
        arms = self.body_segments['arms']
        legs = self.body_segments['legs']
        
        # Draw head (simple circle)
        head_radius = int(shoulders['width'] * 0.2)
        head_center = (int(shoulders['x']), int(shoulders['y'] - head_radius * 1.2))
        cv2.circle(canvas, head_center, head_radius, self.body_color + (255,), -1)
        cv2.circle(canvas, head_center, head_radius, self.outline_color + (255,), 2)
        
        # Draw torso with shape-specific characteristics
        torso_points = self._generate_torso_contour(shoulders, bust, waist, hips)
        
        # Draw filled torso with outline
        torso_contour = np.array(torso_points, dtype=np.int32)
        cv2.drawContours(canvas, [torso_contour], 0, self.body_color + (255,), -1)
        cv2.drawContours(canvas, [torso_contour], 0, self.outline_color + (255,), 2)
        
        # Draw arms
        self._draw_arm(canvas, 
                     (int(shoulders['x'] - shoulders['width'] / 2), int(shoulders['y'])),
                     arms, side='left')
        self._draw_arm(canvas, 
                     (int(shoulders['x'] + shoulders['width'] / 2), int(shoulders['y'])),
                     arms, side='right')
        
        # Draw legs
        self._draw_leg(canvas, 
                     (int(hips['x'] - hips['width'] / 4), int(hips['y'] + hips['height'] / 2)),
                     legs, side='left')
        self._draw_leg(canvas, 
                     (int(hips['x'] + hips['width'] / 4), int(hips['y'] + hips['height'] / 2)),
                     legs, side='right')
        
        # Add bust circles for female body shapes with appropriate size based on body shape
        if True:  # You can condition this if needed
            bust_circle_radius = int(bust['width'] / 6)
            if self.body_shape == 'hourglass' or self.body_shape == 'apple':
                bust_circle_radius = int(bust_circle_radius * 1.2)
            
            # Left bust circle
            cv2.circle(
                canvas,
                (int(bust['x'] - bust['width'] / 4), int(bust['y'])),
                bust_circle_radius,
                self.outline_color + (255,),
                2
            )
            
            # Right bust circle
            cv2.circle(
                canvas,
                (int(bust['x'] + bust['width'] / 4), int(bust['y'])),
                bust_circle_radius,
                self.outline_color + (255,),
                2
            )
    
    def _generate_torso_contour(self, shoulders, bust, waist, hips):
        """Generate torso contour points with shape-specific adjustments."""
        # Base points
        shoulder_left = (int(shoulders['x'] - shoulders['width'] / 2), int(shoulders['y']))
        shoulder_right = (int(shoulders['x'] + shoulders['width'] / 2), int(shoulders['y']))
        
        bust_left = (int(bust['x'] - bust['width'] / 2), int(bust['y']))
        bust_right = (int(bust['x'] + bust['width'] / 2), int(bust['y']))
        
        waist_left = (int(waist['x'] - waist['width'] / 2), int(waist['y']))
        waist_right = (int(waist['x'] + waist['width'] / 2), int(waist['y']))
        
        hip_left = (int(hips['x'] - hips['width'] / 2), int(hips['y']))
        hip_right = (int(hips['x'] + hips['width'] / 2), int(hips['y']))
        
        hip_bottom = (int(hips['x']), int(hips['y'] + hips['height'] / 2))
        neck_top = (int(shoulders['x']), int(shoulders['y'] - shoulders['height']))
        
        # Create smoother curves based on body shape
        torso_points = []
        
        # Add extra control points for smoother curves
        # Left side (shoulder to hip)
        torso_points.append(shoulder_left)
        
        # Add intermediate points with shape-specific adjustments
        if self.body_shape == 'apple':
            # Apple: fuller upper body
            bust_control_left = (
                int(shoulder_left[0] + (bust_left[0] - shoulder_left[0]) * 0.3),
                int(shoulder_left[1] + (bust_left[1] - shoulder_left[1]) * 0.7)
            )
            torso_points.append(bust_control_left)
        
        torso_points.append(bust_left)
        
        if self.body_shape == 'hourglass':
            # Hourglass: more pronounced waist curve
            waist_control_left = (
                int(bust_left[0] - 5),
                int(bust_left[1] + (waist_left[1] - bust_left[1]) * 0.6)
            )
            torso_points.append(waist_control_left)
        
        torso_points.append(waist_left)
        
        if self.body_shape == 'pear':
            # Pear: more pronounced hip curve
            hip_control_left = (
                int(waist_left[0] - 8),
                int(waist_left[1] + (hip_left[1] - waist_left[1]) * 0.6)
            )
            torso_points.append(hip_control_left)
        
        torso_points.append(hip_left)
        
        # Bottom of torso
        torso_points.append(hip_bottom)
        
        # Right side (hip to shoulder)
        torso_points.append(hip_right)
        
        if self.body_shape == 'pear':
            # Pear: more pronounced hip curve
            hip_control_right = (
                int(hip_right[0] + 8),
                int(hip_right[1] - (hip_right[1] - waist_right[1]) * 0.4)
            )
            torso_points.append(hip_control_right)
        
        torso_points.append(waist_right)
        
        if self.body_shape == 'hourglass':
            # Hourglass: more pronounced waist curve
            waist_control_right = (
                int(waist_right[0] + 5),
                int(waist_right[1] - (waist_right[1] - bust_right[1]) * 0.4)
            )
            torso_points.append(waist_control_right)
        
        torso_points.append(bust_right)
        
        if self.body_shape == 'apple':
            # Apple: fuller upper body
            bust_control_right = (
                int(bust_right[0] + (shoulder_right[0] - bust_right[0]) * 0.7),
                int(bust_right[1] - (bust_right[1] - shoulder_right[1]) * 0.3)
            )
            torso_points.append(bust_control_right)
        
        torso_points.append(shoulder_right)
        
        # Connect to neck
        torso_points.append(neck_top)
        torso_points.append(shoulder_left)
        
        return torso_points
    
    def _draw_arm(self, canvas, shoulder_point, arms, side='left'):
        """Draw an arm starting from shoulder point."""
        # Determine arm angle
        angle = 30 if side == 'left' else -30
        angle_rad = np.radians(angle)
        
        # End point
        end_x = int(shoulder_point[0] + arms['length'] * np.sin(angle_rad))
        end_y = int(shoulder_point[1] + arms['length'] * np.cos(angle_rad))
        
        # Arm width - adjust based on body shape
        width = int(arms['width'])
        
        # Create arm contour
        arm_points = []
        
        # Add points along arm with varying width
        for t in np.linspace(0, 1, 10):
            # Position along arm
            x = int(shoulder_point[0] * (1-t) + end_x * t)
            y = int(shoulder_point[1] * (1-t) + end_y * t)
            
            # Width at this point (thinner at wrist)
            # Apply body-shape specific adjustments
            if self.body_shape == 'apple':
                # Wider arms for apple shape, especially upper arm
                pt_width = int(width * (1.2 - t * 0.7))
            else:
                pt_width = int(width * (1 - t * 0.5))
            
            # Calculate perpendicular direction
            perp_x = np.cos(angle_rad) if side == 'left' else -np.cos(angle_rad)
            perp_y = -np.sin(angle_rad) if side == 'left' else np.sin(angle_rad)
            
            # Add points perpendicular to arm direction
            arm_points.append((int(x + perp_x * pt_width), int(y + perp_y * pt_width)))
        
        # Add points for other side of arm (in reverse)
        for t in np.linspace(1, 0, 10):
            x = int(shoulder_point[0] * (1-t) + end_x * t)
            y = int(shoulder_point[1] * (1-t) + end_y * t)
            
            if self.body_shape == 'apple':
                pt_width = int(width * (1.2 - t * 0.7))
            else:
                pt_width = int(width * (1 - t * 0.5))
            
            perp_x = -np.cos(angle_rad) if side == 'left' else np.cos(angle_rad)
            perp_y = np.sin(angle_rad) if side == 'left' else -np.sin(angle_rad)
            
            arm_points.append((int(x + perp_x * pt_width), int(y + perp_y * pt_width)))
        
        # Draw arm
        arm_contour = np.array(arm_points, dtype=np.int32)
        cv2.drawContours(canvas, [arm_contour], 0, self.body_color + (255,), -1)
        cv2.drawContours(canvas, [arm_contour], 0, self.outline_color + (255,), 2)
        
        # Draw hand (simple circle)
        hand_radius = int(width * 0.7)
        cv2.circle(canvas, (end_x, end_y), hand_radius, self.body_color + (255,), -1)
        cv2.circle(canvas, (end_x, end_y), hand_radius, self.outline_color + (255,), 2)
    
    def _draw_leg(self, canvas, hip_point, legs, side='left'):
        """Draw a leg starting from hip point with shape-specific adjustments."""
        # Leg dimensions
        length = legs['length']
        width = legs['width']
        thigh_factor = legs.get('thigh_factor', 1.0)
        
        # Leg angle (slight angle for natural stance)
        angle = 5 if side == 'left' else -5
        angle_rad = np.radians(angle)
        
        # End point (foot)
        end_x = int(hip_point[0] + length * np.sin(angle_rad))
        end_y = int(hip_point[1] + length * np.cos(angle_rad))
        
        # Create leg contour
        leg_points = []
        
        # Add points along leg with varying width
        for t in np.linspace(0, 1, 15):
            # Position along leg
            x = int(hip_point[0] * (1-t) + end_x * t)
            y = int(hip_point[1] * (1-t) + end_y * t)
            
            # Width at this point (thinner at ankle)
            # Shape-specific adjustments
            if t < 0.4:  # Thigh
                # Apply thigh factor based on body shape
                pt_width = width * thigh_factor * (1 - t * 0.25)
            elif t < 0.9:  # Calf
                pt_width = width * (0.88 - t * 0.4)
            else:  # Ankle
                pt_width = width * 0.5
            
            # Calculate perpendicular direction
            perp_x = np.cos(angle_rad) if side == 'left' else -np.cos(angle_rad)
            perp_y = -np.sin(angle_rad) if side == 'left' else np.sin(angle_rad)
            
            # Add points perpendicular to leg direction
            leg_points.append((int(x + perp_x * pt_width), int(y + perp_y * pt_width)))
        
        # Add foot
        foot_length = width * 1.2
        foot_width = width * 0.8
        
        if side == 'left':
            foot_points = [
                (int(end_x + perp_x * foot_width), int(end_y + perp_y * foot_width)),
                (int(end_x + perp_x * foot_width - foot_length), int(end_y + perp_y * foot_width)),
                (int(end_x - perp_x * foot_width - foot_length), int(end_y - perp_y * foot_width)),
            ]
        else:
            foot_points = [
                (int(end_x + perp_x * foot_width), int(end_y + perp_y * foot_width)),
                (int(end_x + perp_x * foot_width + foot_length), int(end_y + perp_y * foot_width)),
                (int(end_x - perp_x * foot_width + foot_length), int(end_y - perp_y * foot_width)),
            ]
        
        leg_points.extend(foot_points)
        
        # Add points for other side of leg (in reverse)
        for t in np.linspace(1, 0, 15):
            x = int(hip_point[0] * (1-t) + end_x * t)
            y = int(hip_point[1] * (1-t) + end_y * t)
            
            if t < 0.4:  # Thigh
                pt_width = width * thigh_factor * (1 - t * 0.25)
            elif t < 0.9:  # Calf
                pt_width = width * (0.88 - t * 0.4)
            else:  # Ankle
                pt_width = width * 0.5
            
            perp_x = -np.cos(angle_rad) if side == 'left' else np.cos(angle_rad)
            perp_y = np.sin(angle_rad) if side == 'left' else -np.sin(angle_rad)
            
            leg_points.append((int(x + perp_x * pt_width), int(y + perp_y * pt_width)))
        
        # Draw leg
        leg_contour = np.array(leg_points, dtype=np.int32)
        cv2.drawContours(canvas, [leg_contour], 0, self.body_color + (255,), -1)
        cv2.drawContours(canvas, [leg_contour], 0, self.outline_color + (255,), 2)
    
    def apply_clothing(self, dress_image: np.ndarray) -> np.ndarray:
        """
        Apply clothing (dress image) to the body model.
        
        Args:
            dress_image: RGBA image of the dress to apply
            
        Returns:
            np.ndarray: Body model with clothing applied
        """
        # Ensure body is rendered
        body_canvas = self.render()
        
        # Resize dress to fit the body
        shoulders = self.body_segments['shoulders']
        hips = self.body_segments['hips']
        
        # Dress dimensions based on body
        dress_height = int((hips['y'] + hips['height'] - shoulders['y']) * 1.2)
        dress_width = int(dress_image.shape[1] * (dress_height / dress_image.shape[0]))
        
        # Resize dress
        resized_dress = cv2.resize(dress_image, (dress_width, dress_height), interpolation=cv2.INTER_AREA)
        
        # Position dress on body
        x_offset = (self.canvas_size[0] - dress_width) // 2
        y_offset = int(shoulders['y'] - shoulders['height'])
        
        # Create result canvas
        result = np.copy(body_canvas)
        
        # Alpha blend the dress onto the body
        for y in range(dress_height):
            if y_offset + y >= self.canvas_size[1]:
                break
                
            for x in range(dress_width):
                if (y_offset + y) < 0 or (x_offset + x) < 0 or (x_offset + x) >= self.canvas_size[0]:
                    continue
                    
                # Only apply dress pixels with alpha > 0
                if resized_dress.shape[2] > 3 and resized_dress[y, x, 3] > 0:
                    alpha = resized_dress[y, x, 3] / 255.0
                    
                    # Alpha blend
                    for c in range(3):  # RGB channels
                        result[y_offset + y, x_offset + x, c] = int(
                            alpha * resized_dress[y, x, c] + 
                            (1 - alpha) * body_canvas[y_offset + y, x_offset + x, c]
                        )
                    
                    # Set alpha channel
                    result[y_offset + y, x_offset + x, 3] = 255
        
        return result
    
    def get_size_recommendation(self, dress_measurements=None):
        """
        Get clothing size recommendation based on body and dress measurements.
        
        Args:
            dress_measurements: Optional dress measurements to match against
            
        Returns:
            str: Recommended size
        """
        if self.measurements_processor and dress_measurements:
            try:
                # Use the processor to get appropriate size
                return self.measurements_processor.get_clothing_fit(
                    self.measurements, dress_measurements
                )
            except Exception as e:
                logger.error(f"Error getting size recommendation: {str(e)}")
                return self.size
        else:
            return self.size
    
    def save_to_json(self, filepath: str):
        """
        Save body model data to JSON for web applications.
        
        Args:
            filepath: Path to save the JSON file
        """
        model_data = {
            'measurements': self.measurements,
            'body_segments': self.body_segments,
            'body_shape': self.body_shape,
            'size': self.size,
            'canvas_size': self.canvas_size
        }
        
        with open(filepath, 'w') as f:
            json.dump(model_data, f, indent=2)
            
        logger.info(f"Body model saved to JSON: {filepath}")
    
    @classmethod
    def load_from_json(cls, filepath: str) -> 'BodyModel':
        """
        Load body model from JSON file.
        
        Args:
            filepath: Path to the JSON file
            
        Returns:
            BodyModel: Loaded body model
        """
        with open(filepath, 'r') as f:
            data = json.load(f)
        
        model = cls()
        
        if 'measurements' in data:
            model.measurements = data['measurements']
        
        if 'body_segments' in data:
            model.body_segments = data['body_segments']
        
        if 'body_shape' in data:
            model.body_shape = data['body_shape']
        
        if 'size' in data:
            model.size = data['size']
        
        if 'canvas_size' in data:
            model.canvas_size = data['canvas_size']
        
        logger.info(f"Body model loaded from JSON: {filepath}")
        return model

# Example usage
if __name__ == "__main__":
    # Create body model with measurements dataset
    measurements_dataset_path = "e:/Induvidual project/Dresslink-platform/backend/data/processed/body_measurements.csv"
    
    body_model = BodyModel(measurements_dataset_path)
    print(f"Loaded measurements dataset: {body_model.measurements_processor is not None}")
    
    # Update with example measurements
    body_model.update_measurements({
        'height': 165,    # cm
        'bust': 88,       # cm
        'waist': 70,      # cm
        'hips': 95,       # cm
        'shoulder_width': 38,  # cm
        'arm_length': 60       # cm
    })
    
    # Generate and save body model
    body_image = body_model.render("body_model.png")
    print(f"Body model generated. Shape: {body_model.body_shape}, Size: {body_model.size}")
    
    # Save model to JSON
    body_model.save_to_json("body_model.json")
    
    # Generate different body shapes for comparison
    body_shapes = {
        "hourglass": {"bust": 90, "waist": 65, "hips": 90},
        "pear": {"bust": 85, "waist": 70, "hips": 100},
        "apple": {"bust": 95, "waist": 80, "hips": 90},
        "rectangle": {"bust": 85, "waist": 75, "hips": 85}
    }
    
    for shape_name, measurements in body_shapes.items():
        print(f"Generating {shape_name} body shape...")
        model = BodyModel(measurements_dataset_path)
        model.update_measurements(measurements)
        model.render(f"body_shape_{shape_name}.png")