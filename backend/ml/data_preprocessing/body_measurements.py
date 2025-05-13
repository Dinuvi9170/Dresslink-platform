import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
import os
from typing import Tuple, Dict, List, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class BodyMeasurementsProcessor:
    """
    Class to handle preprocessing of body measurement data.
    Includes loading, cleaning, normalizing, and transforming body measurement data.
    """
    def __init__(self, data_path: str = None):
        """
        Initialize the body measurements processor.
        
        Args:
            data_path (str, optional): Path to the body measurements dataset.
        """
        self.data_path = data_path
        self.data = None
        self.normalized_data = None
        self.scaler = StandardScaler()
        
        # Define key body measurements needed for the model
        self.key_measurements = [
            'height', 'weight', 'bust', 'waist', 'hips', 
            'shoulder_width', 'arm_length', 'leg_length', 'inseam'
        ]
        
    def load_data(self, data_path: Optional[str] = None) -> pd.DataFrame:
        """
        Load the body measurements dataset from CSV file.
        
        Args:
            data_path (str, optional): Path to the dataset. If not provided, uses the path from initialization.
            
        Returns:
            pd.DataFrame: The loaded body measurements data.
        """
        if data_path:
            self.data_path = data_path
            
        if not self.data_path:
            raise ValueError("No data path provided for body measurements dataset.")
            
        if not os.path.exists(self.data_path):
            raise FileNotFoundError(f"Body measurements dataset not found at {self.data_path}")
            
        try:
            logger.info(f"Loading body measurements data from {self.data_path}")
            self.data = pd.read_csv(self.data_path)
            logger.info(f"Successfully loaded data with {len(self.data)} records")
            return self.data
        except Exception as e:
            logger.error(f"Error loading body measurements data: {str(e)}")
            raise
    
    def clean_data(self) -> pd.DataFrame:
        """
        Clean the body measurements data by handling missing values and outliers.
        
        Returns:
            pd.DataFrame: The cleaned body measurements data.
        """
        if self.data is None:
            raise ValueError("Data not loaded. Call load_data() first.")
            
        logger.info("Cleaning body measurements data")
        
        # Make a copy to avoid modifying the original data
        cleaned_data = self.data.copy()
        
        # Convert column names to lowercase and replace spaces with underscores
        cleaned_data.columns = [col.lower().replace(' ', '_') for col in cleaned_data.columns]
        
        # Handle missing values - fill with median for numerical columns
        numerical_cols = cleaned_data.select_dtypes(include=['float64', 'int64']).columns
        cleaned_data[numerical_cols] = cleaned_data[numerical_cols].fillna(
            cleaned_data[numerical_cols].median()
        )
        
        # Remove extreme outliers (values beyond 3 standard deviations)
        for col in numerical_cols:
            mean = cleaned_data[col].mean()
            std = cleaned_data[col].std()
            cleaned_data = cleaned_data[
                (cleaned_data[col] >= mean - 3 * std) & 
                (cleaned_data[col] <= mean + 3 * std)
            ]
        
        # Ensure all key measurements exist, create them if not (with reasonably derived values)
        for measurement in self.key_measurements:
            if measurement not in cleaned_data.columns:
                if measurement == 'shoulder_width' and 'bust' in cleaned_data.columns:
                    # Derive shoulder width as a function of bust
                    cleaned_data['shoulder_width'] = cleaned_data['bust'] * 0.4
                elif measurement == 'inseam' and 'leg_length' in cleaned_data.columns:
                    # Derive inseam as a function of leg length
                    cleaned_data['inseam'] = cleaned_data['leg_length'] * 0.8
                else:
                    # Create placeholder with median values (to be refined later)
                    logger.warning(f"Missing measurement: {measurement}. Creating placeholder.")
                    cleaned_data[measurement] = cleaned_data.get(numerical_cols[0]).median()
            
        self.data = cleaned_data
        logger.info(f"Data cleaning complete. Remaining records: {len(cleaned_data)}")
        return cleaned_data
    
    def normalize_data(self) -> pd.DataFrame:
        """
        Normalize body measurements data using StandardScaler.
        
        Returns:
            pd.DataFrame: Normalized body measurements data.
        """
        if self.data is None:
            raise ValueError("Data not loaded. Call load_data() first.")
            
        logger.info("Normalizing body measurements data")
        
        # Only normalize key measurements
        numerical_cols = [col for col in self.key_measurements if col in self.data.columns]
    
        # Fit and transform the data
        normalized_values = self.scaler.fit_transform(self.data[numerical_cols])
        
        # Create a new DataFrame with the normalized values
        self.normalized_data = pd.DataFrame(
            normalized_values, 
            columns=numerical_cols,
            index=self.data.index
        )
        
        # Add any non-numerical columns back to the normalized data
        non_numerical_cols = [col for col in self.data.columns if col not in numerical_cols]
        for col in non_numerical_cols:
            self.normalized_data[col] = self.data[col]
            
        logger.info("Data normalization complete")
        return self.normalized_data
    
    def transform_measurements_to_model_input(
        self, measurements: Dict[str, float]
    ) -> np.ndarray:
        """
        Transform user-provided body measurements to the format expected by the model.
        
        Args:
            measurements (Dict[str, float]): Dictionary containing body measurements.
            
        Returns:
            np.ndarray: Transformed measurements for model input.
        """
        logger.info("Transforming measurements for model input")
        
        # Create a DataFrame with the user's measurements
        user_measurements = pd.DataFrame([measurements])

        # Get the columns that were used to fit the scaler
        if hasattr(self, 'scaler') and hasattr(self.scaler, 'feature_names_in_'):
            scaler_columns = self.scaler.feature_names_in_
        else:
            scaler_columns = self.key_measurements
        
        # Fill missing measurements with median values from the training data
        for column in scaler_columns:
            if column not in user_measurements.columns:
                if self.data is not None and column in self.data.columns:
                    user_measurements[column] = self.data[column].median()
                else:
                    # Use default values if no data is available
                    default_values = {
                        'height': 170.0,  # cm
                        'weight': 65.0,   # kg
                        'bust': 90.0,     # cm
                        'waist': 75.0,    # cm
                        'hips': 95.0,     # cm
                        'shoulder_width': 40.0,  # cm
                        'arm_length': 60.0,      # cm
                        'leg_length': 80.0,      # cm
                        'inseam': 70.0           # cm
                    }
                    user_measurements[column] = default_values.get(column, 0.0)
        # Ensure all columns are in the same order as during fit
        user_measurements_ordered = user_measurements[scaler_columns]
                    
        # Normalize the user's measurements using the fitted scaler
        if hasattr(self, 'scaler') and self.scaler is not None:
            transformed_measurements = self.scaler.transform(
                user_measurements[self.key_measurements]
            )
        else:
            # If scaler not fitted, just return the raw measurements
            transformed_measurements = user_measurements[self.key_measurements].values
            
        logger.info("Measurement transformation complete")
        return transformed_measurements
    
    def get_body_proportions(self, measurements: Dict[str, float]) -> Dict[str, float]:
        """
        Calculate body proportions from measurements for better visualization.
        
        Args:
            measurements (Dict[str, float]): Dictionary containing body measurements.
            
        Returns:
            Dict[str, float]: Calculated body proportions useful for visualization.
        """
        logger.info("Calculating body proportions")
        
        height = measurements.get('height', 170.0)  # default height in cm
        proportions = {}
        
        # Calculate relative proportions
        proportions['waist_to_height_ratio'] = measurements.get('waist', 75.0) / height
        proportions['bust_to_waist_ratio'] = measurements.get('bust', 90.0) / measurements.get('waist', 75.0)
        proportions['waist_to_hip_ratio'] = measurements.get('waist', 75.0) / measurements.get('hips', 95.0)
        
        # Calculate body shape based on bust-waist-hip ratio
        bust = measurements.get('bust', 90.0)
        waist = measurements.get('waist', 75.0)
        hips = measurements.get('hips', 95.0)
        
        # Determine body shape (hourglass, pear, apple, rectangle, etc.)
        if abs(bust - hips) <= 5 and (bust - waist) >= 15 and (hips - waist) >= 15:
            proportions['body_shape'] = 'hourglass'
        elif bust > hips + 5:
            proportions['body_shape'] = 'apple' 
        elif hips > bust + 5:
            proportions['body_shape'] = 'pear'
        else:
            proportions['body_shape'] = 'rectangle'
        
        logger.info(f"Body shape determined as: {proportions['body_shape']}")
        return proportions
    
    def get_size_recommendation(self, measurements: Dict[str, float]) -> str:
        """
        Provide size recommendation based on body measurements.
        
        Args:
            measurements (Dict[str, float]): Dictionary containing body measurements.
            
        Returns:
            str: Recommended size (XS, S, M, L, XL, etc.).
        """
        # Simple size chart based on bust measurement
        bust = measurements.get('bust', 0)
        
        if bust < 82:
            return 'XS'
        elif bust < 87:
            return 'S'
        elif bust < 92:
            return 'M'
        elif bust < 97:
            return 'L'
        elif bust < 102:
            return 'XL'
        else:
            return 'XXL'

# Example usage
if __name__ == "__main__":
    processor = BodyMeasurementsProcessor("F:\measurements\Body Measurements _ original_CSV.csv")
    data = processor.load_data()
    cleaned_data = processor.clean_data()
    normalized_data = processor.normalize_data()

    print(f"Dataset columns: {list(cleaned_data.columns)}")

    # Get a list of all columns that the scaler was trained on
    if hasattr(processor.scaler, 'feature_names_in_'):
        required_columns = processor.scaler.feature_names_in_
        print(f"Required columns for transformation: {required_columns}")
    
    # Example user measurements
    user_measurements = {
        'height': 165,
        'weight': 60,
        'bust': 88,
        'waist': 70,
        'hips': 95
    }
    
    
    model_input = processor.transform_measurements_to_model_input(user_measurements)
    proportions = processor.get_body_proportions(user_measurements)
    size = processor.get_size_recommendation(user_measurements)
    
    print(f"Recommended size: {size}")
    print(f"Body shape: {proportions['body_shape']}")
    