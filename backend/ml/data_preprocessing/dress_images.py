import os
import cv2
import numpy as np
from typing import List, Dict, Tuple
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DressImageProcessor:
    """
    Simple and memory-efficient class for dress image preprocessing.
    """
    
    def __init__(self, data_path: str = None, output_path: str = None, 
                 image_size: Tuple[int, int] = (224, 224)):
        """
        Initialize the processor.
        """
        self.data_path = data_path
        self.output_path = output_path
        self.image_size = image_size
        
    def process_directory(self, batch_size: int = 10):
        """
        Process all images in a directory structure, one by one.
        """
        if not self.data_path:
            raise ValueError("No data path provided")
        if not self.output_path:
            raise ValueError("No output path provided")
            
        # Create output directory
        os.makedirs(self.output_path, exist_ok=True)
        
        # Store categories found
        categories = set()
        total_processed = 0
        
        # Walk through directory structure
        logger.info(f"Processing images from {self.data_path}")
        for root, _, files in os.walk(self.data_path):
            # Get only image files
            image_files = [f for f in files if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
            
            if not image_files:
                continue
                
            # Get category from directory name
            rel_path = os.path.relpath(root, self.data_path)
            if rel_path == '.':
                category = 'unknown'
            else:
                category = os.path.basename(root).lower()
            
            categories.add(category)
            
            # Create output category directory
            category_dir = os.path.join(self.output_path, category)
            os.makedirs(category_dir, exist_ok=True)
            
            logger.info(f"Processing {len(image_files)} images in '{category}' from {root}")
            
            # Process images in batches
            for i in range(0, len(image_files), batch_size):
                batch = image_files[i:i+batch_size]
                for img_file in batch:
                    try:
                        # Full file paths
                        img_path = os.path.join(root, img_file)
                        output_name = f"{os.path.splitext(img_file)[0]}.png"
                        output_path = os.path.join(category_dir, output_name)
                        
                        # Skip if already processed
                        if os.path.exists(output_path):
                            continue
                            
                        # Read image
                        img = cv2.imread(img_path)
                        if img is None:
                            logger.warning(f"Could not read image: {img_path}")
                            continue
                            
                        # Resize image
                        resized = cv2.resize(img, (self.image_size[1], self.image_size[0]))
                        
                        # Save processed image
                        cv2.imwrite(output_path, resized)
                        total_processed += 1
                        
                        # Free memory immediately
                        del img
                        del resized
                        
                    except Exception as e:
                        logger.error(f"Error processing {img_path}: {str(e)}")
                
                # Force garbage collection after each batch
                import gc
                gc.collect()
                
                # Log progress
                logger.info(f"Processed {total_processed} images so far")
        
        # Final report
        logger.info(f"Completed processing {total_processed} images across {len(categories)} categories")
        return total_processed, categories
        
    def create_segmentation_mask(self, input_path: str, output_path: str):
        """
        Create a simple segmentation mask for a single image.
        """
        try:
            # Read the image
            img = cv2.imread(input_path)
            if img is None:
                return False
                
            # Resize to target size
            img = cv2.resize(img, (self.image_size[1], self.image_size[0]))
            
            # Simple background removal (white background)
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            mask = cv2.inRange(hsv, np.array([0, 0, 200]), np.array([180, 30, 255]))
            
            # Create alpha channel (255 for dress, 0 for background)
            alpha = 255 - mask
            
            # Create RGBA image
            rgba = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
            rgba[:, :, 3] = alpha
            
            # Save result
            cv2.imwrite(output_path, rgba)
            
            # Clean up
            del img, hsv, mask, alpha, rgba
            return True
            
        except Exception as e:
            logger.error(f"Error creating mask for {input_path}: {str(e)}")
            return False
    
    def process_single_image(self, image_path: str):
        """
        Process a single image and return the result.
        """
        try:
            # Read the image
            img = cv2.imread(image_path)
            if img is None:
                return None
                
            # Resize to target size
            resized = cv2.resize(img, (self.image_size[1], self.image_size[0]))
            
            # Convert to RGB for return
            rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
            
            return rgb
            
        except Exception as e:
            logger.error(f"Error processing image {image_path}: {str(e)}")
            return None

# Example usage
if __name__ == "__main__":
    # Create processor with small image size
    processor = DressImageProcessor(
        data_path=r"F:\dresses",
        output_path=r"F:\processed_dresses",
        image_size=(128, 96) 
    )
    
    try:
        # Process all images
        total, categories = processor.process_directory(batch_size=5)
        print(f"Processed {total} images in categories: {categories}")
        
        sample_image = r"F:\dresses\woman\dresses\some_dress.jpg"
        if os.path.exists(sample_image):
            result = processor.process_single_image(sample_image)
            if result is not None:
                print(f"Successfully processed sample image. Shape: {result.shape}")
        
    except Exception as e:
        print(f"Error: {str(e)}")