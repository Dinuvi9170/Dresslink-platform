import os
import sys
import numpy as np
import pandas as pd
import pickle
import logging
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import cross_val_score

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

# Import custom modules
from models.body_model import BodyModel
from models.dress_transformer import DressTransformer

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ModelEvaluator:
    """
    Class for evaluating the trained models from the DressLink platform.
    Provides methods to evaluate accuracy, test with new data,
    and visualize results.
    """
    
    def __init__(self, data_dir=None):
        """Initialize with paths to datasets and models"""
        self.data_dir = data_dir or "e:/Induvidual project/Dresslink-platform/backend/data"
        
        # Set up directory paths
        self.processed_dir = os.path.join(self.data_dir, "processed")
        self.models_dir = os.path.join(self.data_dir, "models")
        self.results_dir = os.path.join(self.data_dir, "results")
        
        # Create directories if they don't exist
        os.makedirs(self.processed_dir, exist_ok=True)
        os.makedirs(self.models_dir, exist_ok=True)
        os.makedirs(self.results_dir, exist_ok=True)
            
        # Initialize paths
        self.body_measurements_path = os.path.join(self.processed_dir, "body_measurements.csv")
        self.body_shape_model_path = os.path.join(self.models_dir, "body_shape_classifier.pkl")
        
        # Load measurements data if available
        if os.path.exists(self.body_measurements_path):
            self.measurements_df = pd.read_csv(self.body_measurements_path)
            logger.info(f"Loaded {len(self.measurements_df)} body measurement records")
        else:
            logger.warning(f"No measurements data found at {self.body_measurements_path}")
            self.measurements_df = None
        
        # Load the trained model if available
        if os.path.exists(self.body_shape_model_path):
            with open(self.body_shape_model_path, 'rb') as f:
                self.model, self.scaler = pickle.load(f)
            logger.info(f"Loaded body shape classifier model from {self.body_shape_model_path}")
        else:
            logger.warning(f"No trained model found at {self.body_shape_model_path}")
            self.model = None
            self.scaler = None
    
    def evaluate_model_accuracy(self):
        """Evaluate model accuracy on the test dataset"""
        if self.model is None or self.measurements_df is None:
            logger.error("Model or measurements data not loaded")
            return None
        
        logger.info("Evaluating body shape classifier accuracy...")
        
        # Prepare features and target
        X = self.measurements_df[['bust', 'waist', 'hips', 'bust_to_waist', 'waist_to_hip', 'bust_to_hip']]
        y = self.measurements_df['body_shape']
        
        # Scale the features
        X_scaled = self.scaler.transform(X)
        
        # Make predictions
        y_pred = self.model.predict(X_scaled)
        
        # Calculate accuracy
        accuracy = accuracy_score(y, y_pred)
        logger.info(f"Overall accuracy: {accuracy:.4f}")
        
        # Generate classification report
        report = classification_report(y, y_pred)
        logger.info(f"Classification report:\n{report}")
        
        # Generate confusion matrix
        cm = confusion_matrix(y, y_pred)
        
        # Plot confusion matrix
        plt.figure(figsize=(10, 8))
        sns.heatmap(
            cm, 
            annot=True, 
            fmt='d', 
            cmap='Blues',
            xticklabels=np.unique(y),
            yticklabels=np.unique(y)
        )
        plt.title('Body Shape Classifier Confusion Matrix')
        plt.ylabel('True Label')
        plt.xlabel('Predicted Label')
        
        # Save the confusion matrix
        cm_path = os.path.join(self.results_dir, "confusion_matrix.png")
        plt.savefig(cm_path)
        logger.info(f"Saved confusion matrix visualization to {cm_path}")
        
        return accuracy, report, cm
    
    def perform_cross_validation(self, cv=5):
        """Perform cross-validation on the model"""
        if self.model is None or self.measurements_df is None:
            logger.error("Model or measurements data not loaded")
            return None
        
        logger.info(f"Performing {cv}-fold cross-validation...")
        
        # Prepare features and target
        X = self.measurements_df[['bust', 'waist', 'hips', 'bust_to_waist', 'waist_to_hip', 'bust_to_hip']]
        y = self.measurements_df['body_shape']
        
        # Scale the features
        X_scaled = self.scaler.transform(X)
        
        # Perform cross-validation
        cv_scores = cross_val_score(self.model, X_scaled, y, cv=cv)
        
        logger.info(f"Cross-validation scores: {cv_scores}")
        logger.info(f"Mean CV accuracy: {cv_scores.mean():.4f}")
        logger.info(f"CV accuracy standard deviation: {cv_scores.std():.4f}")
        
        return cv_scores
    
    def evaluate_feature_importance(self):
        """Evaluate and visualize feature importance"""
        if self.model is None:
            logger.error("Model not loaded")
            return None
        
        if not hasattr(self.model, 'feature_importances_'):
            logger.error("Model doesn't have feature importance attribute")
            return None
        
        # Get feature names
        feature_names = ['bust', 'waist', 'hips', 'bust_to_waist', 'waist_to_hip', 'bust_to_hip']
        
        # Get feature importances
        importances = self.model.feature_importances_
        
        # Sort features by importance
        indices = np.argsort(importances)[::-1]
        
        logger.info("Feature ranking:")
        for i, idx in enumerate(indices):
            logger.info(f"{i+1}. {feature_names[idx]} ({importances[idx]:.4f})")
        
        # Plot feature importances
        plt.figure(figsize=(10, 6))
        plt.title("Feature Importances")
        plt.bar(range(len(indices)), importances[indices], align='center')
        plt.xticks(range(len(indices)), [feature_names[i] for i in indices], rotation=45)
        plt.tight_layout()
        
        # Save the feature importance plot
        importance_path = os.path.join(self.results_dir, "feature_importance.png")
        plt.savefig(importance_path)
        logger.info(f"Saved feature importance visualization to {importance_path}")
        
        return importances, feature_names
    
    def test_with_new_measurements(self, measurements_list=None):
        """Test the model with new measurements"""
        if self.model is None or self.scaler is None:
            logger.error("Model or scaler not loaded")
            return None
        
        # Use default test measurements if none provided
        if measurements_list is None:
            measurements_list = [
                # Test cases covering different body shapes
                {"bust": 92, "waist": 65, "hips": 94, "label": "expected hourglass"},
                {"bust": 100, "waist": 90, "hips": 95, "label": "expected apple"},
                {"bust": 85, "waist": 70, "hips": 100, "label": "expected pear"},
                {"bust": 88, "waist": 80, "hips": 90, "label": "expected rectangle"},
                # Edge cases
                {"bust": 95, "waist": 80, "hips": 95, "label": "equal bust and hips"},
                {"bust": 85, "waist": 85, "hips": 85, "label": "all equal"},
                {"bust": 110, "waist": 60, "hips": 110, "label": "extreme hourglass"}
            ]
        
        logger.info(f"Testing model with {len(measurements_list)} new measurements")
        
        results = []
        for i, m in enumerate(measurements_list):
            # Extract measurements
            bust = m['bust']
            waist = m['waist']
            hips = m['hips']
            label = m.get('label', f"Sample {i+1}")
            
            # Calculate ratios
            bust_to_waist = bust / waist if waist > 0 else 0
            waist_to_hip = waist / hips if hips > 0 else 0
            bust_to_hip = bust / hips if hips > 0 else 0
            
            # Create DataFrame for prediction to avoid feature name warning
            X = pd.DataFrame({
                'bust': [bust], 
                'waist': [waist], 
                'hips': [hips], 
                'bust_to_waist': [bust_to_waist], 
                'waist_to_hip': [waist_to_hip], 
                'bust_to_hip': [bust_to_hip]
            })
            
            # Scale features
            X_scaled = self.scaler.transform(X)
            
            # Predict body shape
            predicted_shape = self.model.predict(X_scaled)[0]
            
            # Get prediction probabilities
            proba = self.model.predict_proba(X_scaled)[0]
            max_proba = max(proba)
            
            # Compare with BodyModel prediction
            body_model = BodyModel()
            body_model.update_measurements({"bust": bust, "waist": waist, "hips": hips})
            rule_based_shape = body_model.body_shape
            
            result = {
                "label": label,
                "bust": bust,
                "waist": waist,
                "hips": hips,
                "ml_prediction": predicted_shape,
                "ml_confidence": max_proba,
                "rule_based": rule_based_shape,
                "match": predicted_shape == rule_based_shape
            }
            
            results.append(result)
            
            logger.info(f"Test {label}: ML model: {predicted_shape} ({max_proba:.2f}), Rule-based: {rule_based_shape}")
        
        # Create comparison DataFrame
        results_df = pd.DataFrame(results)
        
        # Save results to CSV
        results_path = os.path.join(self.results_dir, "model_test_results.csv")
        results_df.to_csv(results_path, index=False)
        logger.info(f"Saved test results to {results_path}")
        
        # Calculate agreement percentage
        agreement = results_df["match"].mean() * 100
        logger.info(f"Agreement between ML model and rule-based method: {agreement:.2f}%")
        
        return results_df
    
    def compare_ml_vs_rule_based(self):
        """Compare ML predictions with rule-based predictions on the full dataset"""
        if self.model is None or self.measurements_df is None:
            logger.error("Model or measurements data not loaded")
            return None
        
        logger.info("Comparing ML predictions with rule-based method...")
        
        # Prepare features
        X = self.measurements_df[['bust', 'waist', 'hips', 'bust_to_waist', 'waist_to_hip', 'bust_to_hip']]
        
        # Scale features
        X_scaled = self.scaler.transform(X)
        
        # Make predictions with ML model
        ml_predictions = self.model.predict(X_scaled)
        
        # Initialize list for rule-based predictions
        rule_based = []
        
        # Make predictions with rule-based method
        for i, row in self.measurements_df.iterrows():
            body_model = BodyModel()
            body_model.update_measurements({
                "bust": row['bust'],
                "waist": row['waist'],
                "hips": row['hips']
            })
            rule_based.append(body_model.body_shape)
        
        # Add predictions to DataFrame
        results_df = self.measurements_df.copy()
        results_df['ml_prediction'] = ml_predictions
        results_df['rule_based'] = rule_based
        results_df['match'] = results_df['ml_prediction'] == results_df['rule_based']
        
        # Calculate agreement statistics
        agreement = results_df['match'].mean() * 100
        logger.info(f"Agreement percentage: {agreement:.2f}%")
        
        # Generate confusion matrix between the two methods
        cm = confusion_matrix(rule_based, ml_predictions)
        
        # Plot confusion matrix
        plt.figure(figsize=(10, 8))
        sns.heatmap(
            cm, 
            annot=True, 
            fmt='d', 
            cmap='Blues',
            xticklabels=np.unique(ml_predictions),
            yticklabels=np.unique(rule_based)
        )
        plt.title('ML vs Rule-Based Method Comparison')
        plt.ylabel('Rule-Based Method')
        plt.xlabel('ML Prediction')
        
        # Save the comparison matrix
        comparison_path = os.path.join(self.results_dir, "ml_vs_rule_based.png")
        plt.savefig(comparison_path)
        logger.info(f"Saved comparison visualization to {comparison_path}")
        
        # Save detailed results
        results_path = os.path.join(self.results_dir, "ml_vs_rule_based_full.csv")
        results_df.to_csv(results_path, index=False)
        logger.info(f"Saved detailed comparison to {results_path}")
        
        return agreement, results_df
    
    def evaluate_dress_recommendations(self, num_users=10):
        """Evaluate how ML model affects dress recommendations compared to rule-based"""
        if self.model is None or self.scaler is None:
            logger.error("Model or scaler not loaded")
            return None
            
        # Try to load the dress catalog
        catalog_path = os.path.join(self.processed_dir, "dress_catalog.csv")
        if not os.path.exists(catalog_path):
            logger.error(f"Dress catalog not found at {catalog_path}")
            return None
            
        try:
            catalog_df = pd.read_csv(catalog_path)
            logger.info(f"Loaded dress catalog with {len(catalog_df)} items")
        except Exception as e:
            logger.error(f"Error loading dress catalog: {str(e)}")
            return None
        
        # Sample some users from the measurements dataset or create random ones
        if self.measurements_df is not None and len(self.measurements_df) >= num_users:
            user_samples = self.measurements_df.sample(num_users)
        else:
            # Create random user samples
            user_samples = []
            for i in range(num_users):
                bust = np.random.randint(80, 110)
                waist = np.random.randint(60, 95)
                hips = np.random.randint(85, 115)
                
                user_samples.append({
                    "user_id": f"test_user_{i}",
                    "bust": bust,
                    "waist": waist,
                    "hips": hips
                })
            user_samples = pd.DataFrame(user_samples)
        
        results = []
        for _, user in user_samples.iterrows():
            bust = user['bust']
            waist = user['waist']
            hips = user['hips']
            
            # Get ML prediction
            bust_to_waist = bust / waist if waist > 0 else 0
            waist_to_hip = waist / hips if hips > 0 else 0
            bust_to_hip = bust / hips if hips > 0 else 0
            
            X = pd.DataFrame({
                'bust': [bust], 
                'waist': [waist], 
                'hips': [hips], 
                'bust_to_waist': [bust_to_waist], 
                'waist_to_hip': [waist_to_hip], 
                'bust_to_hip': [bust_to_hip]
            })
            
            X_scaled = self.scaler.transform(X)
            ml_shape = self.model.predict(X_scaled)[0]
            
            # Get rule-based prediction
            body_model = BodyModel()
            body_model.update_measurements({"bust": bust, "waist": waist, "hips": hips})
            rule_shape = body_model.body_shape
            
            # Create dress transformer with both methods
            transformer_ml = DressTransformer()
            body_model_ml = BodyModel()
            body_model_ml.update_measurements({"bust": bust, "waist": waist, "hips": hips})
            # Override the detected shape with ML prediction
            body_model_ml.body_shape = ml_shape
            transformer_ml.set_body_model(body_model_ml)
            
            transformer_rule = DressTransformer()
            body_model_rule = BodyModel()
            body_model_rule.update_measurements({"bust": bust, "waist": waist, "hips": hips})
            transformer_rule.set_body_model(body_model_rule)
            
            #simple recommendation logic for testing
            if ml_shape == "hourglass":
                ml_pref_styles = ["elegant", "formal"]
            elif ml_shape == "apple":
                ml_pref_styles = ["casual", "empire"]
            elif ml_shape == "pear":
                ml_pref_styles = ["a-line", "flared"]
            else:  # rectangle
                ml_pref_styles = ["fitted", "belted"]
                
            if rule_shape == "hourglass":
                rule_pref_styles = ["elegant", "formal"]
            elif rule_shape == "apple":
                rule_pref_styles = ["casual", "empire"]
            elif rule_shape == "pear":
                rule_pref_styles = ["a-line", "flared"]
            else:  # rectangle
                rule_pref_styles = ["fitted", "belted"]
            
            # Check if dress recommendations would differ
            recommendation_differs = ml_shape != rule_shape
                
            result = {
                "bust": bust,
                "waist": waist,
                "hips": hips,
                "ml_shape": ml_shape,
                "rule_shape": rule_shape,
                "ml_pref_styles": ", ".join(ml_pref_styles),
                "rule_pref_styles": ", ".join(rule_pref_styles),
                "recommendation_differs": recommendation_differs
            }
            
            results.append(result)
        
        # Create DataFrame with results
        results_df = pd.DataFrame(results)
        
        # Calculate how often recommendations differ
        differ_pct = results_df["recommendation_differs"].mean() * 100
        logger.info(f"Dress recommendations differ in {differ_pct:.2f}% of cases")
        
        # Save results
        recom_path = os.path.join(self.results_dir, "recommendation_comparison.csv")
        results_df.to_csv(recom_path, index=False)
        logger.info(f"Saved recommendation comparison to {recom_path}")
        
        return differ_pct, results_df

    def run_full_evaluation(self):
        """Run full evaluation suite"""
        if self.model is None:
            logger.error("Model not loaded, cannot run evaluation")
            return
        
        logger.info("Running full model evaluation...")
        
        # 1. Evaluate model accuracy
        self.evaluate_model_accuracy()
        
        # 2. Perform cross-validation
        self.perform_cross_validation()
        
        # 3. Evaluate feature importance
        self.evaluate_feature_importance()
        
        # 4. Test with new measurements
        self.test_with_new_measurements()
        
        # 5. Compare ML vs rule-based
        self.compare_ml_vs_rule_based()
        
        # 6. Evaluate impact on dress recommendations
        self.evaluate_dress_recommendations()
        
        logger.info("Full evaluation completed. Results saved to " + self.results_dir)


if __name__ == "__main__":
    evaluator = ModelEvaluator()
    
    # Run individual evaluations
    logger.info("Evaluating model accuracy...")
    evaluator.evaluate_model_accuracy()
    
    logger.info("Performing cross-validation...")
    evaluator.perform_cross_validation()
    
    logger.info("Evaluating feature importance...")
    evaluator.evaluate_feature_importance()
    
    logger.info("Testing with new measurements...")
    evaluator.test_with_new_measurements()
    
    logger.info("Comparing ML vs rule-based method...")
    evaluator.compare_ml_vs_rule_based()
    
    logger.info("Evaluating dress recommendations...")
    evaluator.evaluate_dress_recommendations()
    
    logger.info("Evaluation completed successfully")