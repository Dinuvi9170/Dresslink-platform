import os
import numpy as np
import pandas as pd
import cv2
import logging
import pickle
from pathlib import Path
import sys
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import StandardScaler

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

# Import custom modules
from models.body_model import BodyModel
from models.dress_transformer import DressTransformer

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DressLinkTrainer:
    """
    Simple training pipeline for DressLink ML models.
    Focuses on body shape classification from measurements.
    """
    
    def __init__(self, data_dir=None):
        """Initialize with paths to datasets"""
        self.data_dir = data_dir or "e:/Induvidual project/Dresslink-platform/backend/data"
        
        # Set up directory paths
        self.processed_dir = os.path.join(self.data_dir, "processed")
        self.models_dir = os.path.join(self.data_dir, "models")
        
        # Create directories if they don't exist
        os.makedirs(self.processed_dir, exist_ok=True)
        os.makedirs(self.models_dir, exist_ok=True)
            
        # Initialize dataset path
        self.body_measurements_path = os.path.join(self.processed_dir, "body_measurements.csv")
        
        # Initialize model paths
        self.body_shape_model_path = os.path.join(self.models_dir, "body_shape_classifier.pkl")
        
        # Set random seed for reproducibility
        np.random.seed(42)
        
    def load_or_create_data(self):
        """Load existing data or create sample data if needed"""
        # Check if measurements data exists
        if os.path.exists(self.body_measurements_path):
            logger.info(f"Loading body measurements from {self.body_measurements_path}")
            self.measurements_df = pd.read_csv(self.body_measurements_path)
        else:
            logger.info("Creating sample body measurements data")
            self._create_sample_measurements()
        
        return True
            
    def _create_sample_measurements(self):
        """Create sample body measurements dataset"""
        body_shapes = ["hourglass", "apple", "pear", "rectangle"]
        measurements = []
        
        # Generate 200 sample body measurements
        for i in range(1, 201):
            user_id = f"user{i:03d}"
            
            # Random characteristics
            height = np.random.randint(150, 190)
            weight = np.random.randint(45, 95)
            
            # Choose a random body shape
            body_shape = np.random.choice(body_shapes)
            
            # Generate measurements based on body shape
            if body_shape == "hourglass":
                # Bust and hips similar, waist smaller
                bust = np.random.randint(85, 105)
                hips = bust + np.random.randint(-3, 4)
                waist = bust - np.random.randint(15, 25)
            elif body_shape == "apple":
                # Larger waist
                bust = np.random.randint(85, 105)
                waist = bust - np.random.randint(0, 10)
                hips = bust - np.random.randint(5, 15)
            elif body_shape == "pear":
                # Hips larger than bust
                bust = np.random.randint(80, 95)
                hips = bust + np.random.randint(10, 20)
                waist = bust - np.random.randint(10, 15)
            else:  # rectangle
                # Similar measurements
                bust = np.random.randint(80, 105)
                waist = bust - np.random.randint(5, 10)
                hips = bust + np.random.randint(-5, 6)
            
            # Add some measurement ratios
            bust_to_waist = bust / waist if waist > 0 else 0
            waist_to_hip = waist / hips if hips > 0 else 0
            bust_to_hip = bust / hips if hips > 0 else 0
            
            # Create measurement entry
            measurement = {
                "user_id": user_id,
                "height": height,
                "weight": weight,
                "bust": bust,
                "waist": waist,
                "hips": hips,
                "bust_to_waist": bust_to_waist,
                "waist_to_hip": waist_to_hip,
                "bust_to_hip": bust_to_hip,
                "body_shape": body_shape
            }
            measurements.append(measurement)
        
        # Create DataFrame and save
        self.measurements_df = pd.DataFrame(measurements)
        self.measurements_df.to_csv(self.body_measurements_path, index=False)
        logger.info(f"Created sample measurements with {len(self.measurements_df)} entries")
    
    def prepare_training_data(self):
        """Prepare data for training the body shape classifier"""
        logger.info("Preparing data for body shape classifier...")
        
        # Select features and target
        X = self.measurements_df[['bust', 'waist', 'hips', 'bust_to_waist', 'waist_to_hip', 'bust_to_hip']]
        y = self.measurements_df['body_shape']
        
        # Normalize the data
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42, stratify=y
        )
        
        logger.info(f"Prepared data with {len(X_train)} training and {len(X_test)} testing samples")
        
        return X_train, X_test, y_train, y_test, scaler
    
    def train_body_shape_model(self):
        """Train a model to classify body shapes from measurements"""
        # Load or create data
        self.load_or_create_data()
        
        # Prepare training data
        X_train, X_test, y_train, y_test, scaler = self.prepare_training_data()
        
        logger.info("Training body shape classifier...")
        
        # Train the model
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        logger.info(f"Body shape classifier accuracy: {accuracy:.4f}")
        
        # Save the model and scaler
        with open(self.body_shape_model_path, 'wb') as f:
            pickle.dump((model, scaler), f)
        
        logger.info(f"Saved body shape model to {self.body_shape_model_path}")
        
        return model, scaler
    
    def test_model_with_sample(self):
        """Test the trained model with some sample measurements"""
        if not os.path.exists(self.body_shape_model_path):
            logger.error("No trained model found. Please train the model first.")
            return
        
        # Load model and scaler
        with open(self.body_shape_model_path, 'rb') as f:
            model, scaler = pickle.load(f)
        
        # Sample measurements to test
        samples = [
            {"bust": 92, "waist": 65, "hips": 94},  # Hourglass
            {"bust": 100, "waist": 90, "hips": 95}, # Apple
            {"bust": 85, "waist": 70, "hips": 100}, # Pear
            {"bust": 88, "waist": 80, "hips": 90}   # Rectangle
        ]
        
        logger.info("Testing body shape model with samples:")
        
        for i, sample in enumerate(samples):
            # Calculate ratios
            bust = sample['bust']
            waist = sample['waist']
            hips = sample['hips']
            
            bust_to_waist = bust / waist if waist > 0 else 0
            waist_to_hip = waist / hips if hips > 0 else 0
            bust_to_hip = bust / hips if hips > 0 else 0
            
            # Prepare input
            X = np.array([[bust, waist, hips, bust_to_waist, waist_to_hip, bust_to_hip]])
            X_scaled = scaler.transform(X)
            
            # Predict
            shape = model.predict(X_scaled)[0]
            
            logger.info(f"Sample {i+1}: {sample} => Predicted shape: {shape}")
            
            # Also create and test a body model
            try:
                body_model = BodyModel()
                body_model.update_measurements(sample)
                model_shape = body_model.body_shape
                logger.info(f"  BodyModel shape: {model_shape}")
            except Exception as e:
                logger.error(f"Error creating body model: {str(e)}")
    
    def integrate_with_transformer(self):
        """Demonstrate integration with DressTransformer"""
        try:
            # Load model and scaler
            with open(self.body_shape_model_path, 'rb') as f:
                model, scaler = pickle.load(f)
            
            # Create a body model
            body_model = BodyModel()
            body_model.update_measurements({
                "bust": 85,
                "waist": 70, 
                "hips": 100  # Pear shape
            })
            
            # Create dress transformer
            catalog_path = os.path.join(self.processed_dir, "dress_catalog.csv")
            dress_transformer = DressTransformer(body_model, catalog_path)
            
            logger.info(f"Created dress transformer with body shape: {body_model.body_shape}")
            logger.info("Integration test successful")
            
        except Exception as e:
            logger.error(f"Integration test failed: {str(e)}")

# Main execution
if __name__ == "__main__":
    trainer = DressLinkTrainer()
    
    # Train the body shape model
    model, scaler = trainer.train_body_shape_model()
    
    # Test with sample measurements
    trainer.test_model_with_sample()
    
    # Test integration with dress transformer
    trainer.integrate_with_transformer()
    
    logger.info("Training completed successfully")