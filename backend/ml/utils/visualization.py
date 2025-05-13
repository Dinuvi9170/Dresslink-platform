import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import logging
from pathlib import Path
import cv2
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
from sklearn.metrics import confusion_matrix, roc_curve, precision_recall_curve, auc
from matplotlib.colors import LinearSegmentedColormap

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DressLinkVisualizer:
    """
    Visualization utilities for the DressLink platform.
    Provides methods to visualize training data, model results, and dress transformations.
    """
    
    def __init__(self, results_dir=None):
        """
        Initialize the visualizer with paths for saving results.
        
        Args:
            results_dir: Directory to save visualizations
        """
        self.results_dir = results_dir or "e:/Induvidual project/Dresslink-platform/backend/data/results"
        self.visualization_dir = os.path.join(self.results_dir, "visualizations")
        
        # Create directories if they don't exist
        os.makedirs(self.results_dir, exist_ok=True)
        os.makedirs(self.visualization_dir, exist_ok=True)
        
        # Set default style
        sns.set_style("whitegrid")
        plt.rcParams['figure.figsize'] = (10, 6)
        plt.rcParams['font.size'] = 12
        
        # Custom color palette for DressLink
        self.dresslink_colors = ["#3498db", "#e74c3c", "#2ecc71", "#f39c12", "#9b59b6", "#1abc9c", "#e67e22", "#34495e"]
        self.dresslink_cmap = LinearSegmentedColormap.from_list("dresslink", self.dresslink_colors, N=100)
    
    def visualize_body_measurements(self, measurements_df, save_path=None):
        """
        Visualize body measurements distribution.
        
        Args:
            measurements_df: DataFrame containing body measurements
            save_path: Path to save the visualization
        """
        if measurements_df is None or measurements_df.empty:
            logger.error("No measurements data provided")
            return
            
        logger.info("Visualizing body measurements distribution")
        
        # Create figure with multiple subplots
        fig, axes = plt.subplots(2, 2, figsize=(12, 10))
        fig.suptitle("Body Measurements Distribution", fontsize=16)
        
        # Plot bust distribution by body shape
        sns.boxplot(x="body_shape", y="bust", data=measurements_df, ax=axes[0, 0], palette=self.dresslink_colors[:4])
        axes[0, 0].set_title("Bust Measurement by Body Shape")
        axes[0, 0].set_xlabel("Body Shape")
        axes[0, 0].set_ylabel("Bust (cm)")
        
        # Plot waist distribution by body shape
        sns.boxplot(x="body_shape", y="waist", data=measurements_df, ax=axes[0, 1], palette=self.dresslink_colors[:4])
        axes[0, 1].set_title("Waist Measurement by Body Shape")
        axes[0, 1].set_xlabel("Body Shape")
        axes[0, 1].set_ylabel("Waist (cm)")
        
        # Plot hips distribution by body shape
        sns.boxplot(x="body_shape", y="hips", data=measurements_df, ax=axes[1, 0], palette=self.dresslink_colors[:4])
        axes[1, 0].set_title("Hips Measurement by Body Shape")
        axes[1, 0].set_xlabel("Body Shape")
        axes[1, 0].set_ylabel("Hips (cm)")
        
        # Plot body shape distribution
        body_shape_counts = measurements_df["body_shape"].value_counts()
        axes[1, 1].pie(
            body_shape_counts, 
            labels=body_shape_counts.index, 
            autopct="%1.1f%%",
            colors=self.dresslink_colors[:len(body_shape_counts)]
        )
        axes[1, 1].set_title("Body Shape Distribution")
        
        plt.tight_layout()
        plt.subplots_adjust(top=0.92)
        
        # Save if path provided
        if save_path is None:
            save_path = os.path.join(self.visualization_dir, "body_measurements_distribution.png")
            
        plt.savefig(save_path)
        logger.info(f"Saved body measurements visualization to {save_path}")
        plt.close()
    
    def visualize_measurement_relationships(self, measurements_df, save_path=None):
        """
        Visualize relationships between measurements with scatter plots.
        
        Args:
            measurements_df: DataFrame containing body measurements
            save_path: Path to save the visualization
        """
        if measurements_df is None or measurements_df.empty:
            logger.error("No measurements data provided")
            return
            
        logger.info("Visualizing measurement relationships")
        
        # Create pairplot for measurements by body shape
        measurement_cols = ["bust", "waist", "hips", "bust_to_waist", "waist_to_hip", "bust_to_hip"]
        available_cols = [col for col in measurement_cols if col in measurements_df.columns]
        
        if len(available_cols) < 2:
            logger.error("Not enough measurement columns available for pairplot")
            return
            
        g = sns.pairplot(
            measurements_df, 
            vars=available_cols,
            hue="body_shape",
            palette=self.dresslink_colors[:4],
            diag_kind="kde",
            corner=True,
            plot_kws={"alpha": 0.6, "s": 80}
        )
        
        g.fig.suptitle("Relationships Between Body Measurements", y=1.02, fontsize=16)
        
        # Save if path provided
        if save_path is None:
            save_path = os.path.join(self.visualization_dir, "measurement_relationships.png")
            
        plt.savefig(save_path, bbox_inches="tight")
        logger.info(f"Saved measurement relationships visualization to {save_path}")
        plt.close()
    
    def visualize_body_shape_ratios(self, measurements_df, save_path=None):
        """
        Visualize the key ratios that determine body shapes.
        
        Args:
            measurements_df: DataFrame containing body measurements
            save_path: Path to save the visualization
        """
        if measurements_df is None or measurements_df.empty:
            logger.error("No measurements data provided")
            return
            
        logger.info("Visualizing body shape ratios")
        
        # Calculate ratios if not present
        if "bust_to_waist" not in measurements_df.columns:
            measurements_df["bust_to_waist"] = measurements_df["bust"] / measurements_df["waist"]
            
        if "waist_to_hip" not in measurements_df.columns:
            measurements_df["waist_to_hip"] = measurements_df["waist"] / measurements_df["hips"]
            
        if "bust_to_hip" not in measurements_df.columns:
            measurements_df["bust_to_hip"] = measurements_df["bust"] / measurements_df["hips"]
        
        # Create figure
        plt.figure(figsize=(12, 8))
        
        # Plot bust-to-hip ratio vs waist-to-hip ratio, colored by body shape
        scatter = plt.scatter(
            measurements_df["bust_to_hip"],
            measurements_df["waist_to_hip"],
            c=pd.factorize(measurements_df["body_shape"])[0],
            cmap=self.dresslink_cmap,
            alpha=0.7,
            s=100
        )
        
        # Add legend
        legend_elements = []
        unique_shapes = measurements_df["body_shape"].unique()
        colors = [self.dresslink_colors[i % len(self.dresslink_colors)] for i in range(len(unique_shapes))]
        
        for i, shape in enumerate(unique_shapes):
            legend_elements.append(plt.Line2D([0], [0], marker='o', color='w', 
                              markerfacecolor=colors[i], markersize=10, label=shape))
    
        plt.legend(handles=legend_elements, title="Body Shape", loc="upper right")
        
        plt.title("Body Shape Classification by Key Ratios", fontsize=16)
        plt.xlabel("Bust-to-Hip Ratio", fontsize=14)
        plt.ylabel("Waist-to-Hip Ratio", fontsize=14)
        plt.grid(True, alpha=0.3)
        
        # Add decision boundaries (approximate)
        plt.axhline(y=0.75, color='gray', linestyle='--', alpha=0.5)
        plt.axvline(x=1.0, color='gray', linestyle='--', alpha=0.5)
        
        # Save if path provided
        if save_path is None:
            save_path = os.path.join(self.visualization_dir, "body_shape_ratios.png")
            
        plt.tight_layout()
        plt.savefig(save_path)
        logger.info(f"Saved body shape ratios visualization to {save_path}")
        plt.close()
    
    def visualize_confusion_matrix(self, y_true, y_pred, labels=None, save_path=None):
        """
        Visualize confusion matrix for classification results.
        
        Args:
            y_true: True labels
            y_pred: Predicted labels
            labels: List of class labels
            save_path: Path to save the visualization
        """
        logger.info("Visualizing confusion matrix")
        
        # Compute confusion matrix
        cm = confusion_matrix(y_true, y_pred, labels=labels)
        
        # Create figure
        plt.figure(figsize=(10, 8))
        
        # Plot confusion matrix
        sns.heatmap(
            cm, 
            annot=True, 
            fmt='d', 
            cmap=self.dresslink_cmap,
            xticklabels=labels if labels else "auto",
            yticklabels=labels if labels else "auto"
        )
        plt.title("Confusion Matrix", fontsize=16)
        plt.ylabel("True Label", fontsize=14)
        plt.xlabel("Predicted Label", fontsize=14)
        
        # Save if path provided
        if save_path is None:
            save_path = os.path.join(self.visualization_dir, "confusion_matrix.png")
            
        plt.tight_layout()
        plt.savefig(save_path)
        logger.info(f"Saved confusion matrix to {save_path}")
        plt.close()
    
    def visualize_feature_importance(self, feature_names, importance_values, save_path=None):
        """
        Visualize feature importance for a machine learning model.
        
        Args:
            feature_names: List of feature names
            importance_values: List of importance values
            save_path: Path to save the visualization
        """
        if len(feature_names) != len(importance_values):
            logger.error("Length of feature names and importance values must match")
            return
            
        logger.info("Visualizing feature importance")
        
        # Sort features by importance
        indices = np.argsort(importance_values)
        
        # Create figure
        plt.figure(figsize=(10, 8))
        
        # Plot feature importance
        plt.barh(
            range(len(indices)),
            importance_values[indices],
            align='center',
            color=self.dresslink_colors[0]
        )
        
        # Add feature names
        plt.yticks(range(len(indices)), [feature_names[i] for i in indices])
        
        plt.title("Feature Importance", fontsize=16)
        plt.xlabel("Importance", fontsize=14)
        
        # Save if path provided
        if save_path is None:
            save_path = os.path.join(self.visualization_dir, "feature_importance.png")
            
        plt.tight_layout()
        plt.savefig(save_path)
        logger.info(f"Saved feature importance visualization to {save_path}")
        plt.close()
    
    def visualize_dress_transformation(self, original_dress, transformed_dress, body_model, save_path=None):
        """
        Visualize before and after dress transformation.
        
        Args:
            original_dress: Path to original dress image or image array
            transformed_dress: Path to transformed dress image or image array
            body_model: Body model instance or body shape string
            save_path: Path to save the visualization
        """
        logger.info("Visualizing dress transformation")
        
        # Load images if paths provided
        if isinstance(original_dress, str) and os.path.exists(original_dress):
            original_img = cv2.imread(original_dress, cv2.IMREAD_UNCHANGED)
            original_img = cv2.cvtColor(original_img, cv2.COLOR_BGR2RGB)
        else:
            original_img = original_dress
            
        if isinstance(transformed_dress, str) and os.path.exists(transformed_dress):
            transformed_img = cv2.imread(transformed_dress, cv2.IMREAD_UNCHANGED)
            transformed_img = cv2.cvtColor(transformed_img, cv2.COLOR_BGR2RGB)
        else:
            transformed_img = transformed_dress
            
        # Get body shape
        if hasattr(body_model, 'body_shape'):
            body_shape = body_model.body_shape
        else:
            body_shape = str(body_model)
            
        # Create figure
        fig, axes = plt.subplots(1, 2, figsize=(12, 6))
        
        # Plot original dress
        axes[0].imshow(original_img)
        axes[0].set_title("Original Dress")
        axes[0].axis('off')
        
        # Plot transformed dress
        axes[1].imshow(transformed_img)
        axes[1].set_title(f"Transformed for {body_shape.capitalize()} Body")
        axes[1].axis('off')
        
        fig.suptitle("Dress Transformation Visualization", fontsize=16)
        
        # Save if path provided
        if save_path is None:
            save_path = os.path.join(self.visualization_dir, "dress_transformation.png")
            
        plt.tight_layout()
        plt.savefig(save_path)
        logger.info(f"Saved dress transformation visualization to {save_path}")
        plt.close()
    
    def visualize_body_shapes(self, save_path=None):
        """
        Visualize different body shapes with simple diagrams.
        
        Args:
            save_path: Path to save the visualization
        """
        logger.info("Creating body shape visualizations")
        
        # Create figure
        fig, axes = plt.subplots(1, 4, figsize=(16, 6))
        
        # Define body shapes
        body_shapes = ["hourglass", "apple", "pear", "rectangle"]
        
        # Create simple body shape diagrams
        for i, shape in enumerate(body_shapes):
            # Create a silhouette
            silhouette = np.zeros((300, 150, 4))
            
            # Common elements for all shapes
            # Head (circle)
            cv2.circle(silhouette, (75, 40), 25, (255, 255, 255, 255), -1)
            
            # Legs
            cv2.rectangle(silhouette, (60, 200), (75, 280), (255, 255, 255, 255), -1)  # Left leg
            cv2.rectangle(silhouette, (85, 200), (100, 280), (255, 255, 255, 255), -1)  # Right leg
            
            # Shape-specific torso
            if shape == "hourglass":
                # Wider at bust and hips, narrow at waist
                pts = np.array([[50, 70], [100, 70], [110, 120], [40, 120]], np.int32)  # Upper torso
                cv2.fillPoly(silhouette, [pts], (255, 255, 255, 255))
                
                pts = np.array([[40, 120], [110, 120], [110, 200], [40, 200]], np.int32)  # Lower torso
                cv2.fillPoly(silhouette, [pts], (255, 255, 255, 255))
                
                # Narrow waist
                cv2.rectangle(silhouette, (55, 120), (95, 140), (0, 0, 0, 255), -1)
                
            elif shape == "apple":
                # Wider at middle, narrower at hips
                pts = np.array([[55, 70], [95, 70], [105, 140], [45, 140]], np.int32)  # Upper torso
                cv2.fillPoly(silhouette, [pts], (255, 255, 255, 255))
                
                pts = np.array([[45, 140], [105, 140], [95, 200], [55, 200]], np.int32)  # Lower torso
                cv2.fillPoly(silhouette, [pts], (255, 255, 255, 255))
                
            elif shape == "pear":
                # Narrower at bust, wider at hips
                pts = np.array([[60, 70], [90, 70], [95, 140], [55, 140]], np.int32)  # Upper torso
                cv2.fillPoly(silhouette, [pts], (255, 255, 255, 255))
                
                pts = np.array([[55, 140], [95, 140], [110, 200], [40, 200]], np.int32)  # Lower torso
                cv2.fillPoly(silhouette, [pts], (255, 255, 255, 255))
                
            else:  # rectangle
                # Straight up and down
                pts = np.array([[55, 70], [95, 70], [95, 200], [55, 200]], np.int32)  # Torso
                cv2.fillPoly(silhouette, [pts], (255, 255, 255, 255))
            
            # Display the silhouette
            axes[i].imshow(silhouette)
            axes[i].set_title(shape.capitalize())
            axes[i].axis('off')
        
        fig.suptitle("Body Shape Types", fontsize=16)
        
        # Save if path provided
        if save_path is None:
            save_path = os.path.join(self.visualization_dir, "body_shapes.png")
            
        plt.tight_layout()
        plt.savefig(save_path)
        logger.info(f"Saved body shape visualizations to {save_path}")
        plt.close()
    
    def visualize_model_comparison(self, ml_results, rule_based_results, save_path=None):
        """
        Visualize comparison between ML and rule-based predictions.
        
        Args:
            ml_results: Results from ML model
            rule_based_results: Results from rule-based approach
            save_path: Path to save the visualization
        """
        logger.info("Visualizing model comparison")
        
        # Create figure
        plt.figure(figsize=(12, 6))
        
        # Calculate agreement
        agreement = sum(ml == rb for ml, rb in zip(ml_results, rule_based_results)) / len(ml_results)
        
        # Count occurrences of each result pair
        result_pairs = [(ml, rb) for ml, rb in zip(ml_results, rule_based_results)]
        pair_counts = {}
        for pair in result_pairs:
            if pair in pair_counts:
                pair_counts[pair] += 1
            else:
                pair_counts[pair] = 1
        
        # Create labels and frequencies
        labels = []
        sizes = []
        colors = []
        
        color_idx = 0
        for pair, count in pair_counts.items():
            ml, rb = pair
            if ml == rb:
                labels.append(f"Both: {ml}")
                colors.append(self.dresslink_colors[0])  # Blue for agreement
            else:
                labels.append(f"ML: {ml}, Rule: {rb}")
                colors.append(self.dresslink_colors[1])  # Red for disagreement
                
            sizes.append(count)
        
        # Plot pie chart
        plt.pie(
            sizes, 
            labels=labels, 
            autopct='%1.1f%%',
            colors=colors,
            startangle=90
        )
        
        plt.title(f"ML vs Rule-Based Predictions (Agreement: {agreement*100:.1f}%)", fontsize=16)
        
        # Save if path provided
        if save_path is None:
            save_path = os.path.join(self.visualization_dir, "model_comparison.png")
            
        plt.tight_layout()
        plt.savefig(save_path)
        logger.info(f"Saved model comparison visualization to {save_path}")
        plt.close()
    
    def visualize_data_distribution(self, data, column, by_column=None, save_path=None):
        """
        Visualize distribution of a specific column in the data.
        
        Args:
            data: DataFrame containing the data
            column: Column name to visualize
            by_column: Optional column to group by
            save_path: Path to save the visualization
        """
        if column not in data.columns:
            logger.error(f"Column {column} not found in data")
            return
            
        logger.info(f"Visualizing distribution of {column}")
        
        plt.figure(figsize=(10, 6))
        
        if by_column is not None and by_column in data.columns:
            for category, group in data.groupby(by_column):
                sns.kdeplot(group[column], label=category)
                
            plt.title(f"Distribution of {column} by {by_column}", fontsize=16)
            plt.legend(title=by_column)
        else:
            sns.histplot(data[column], kde=True, color=self.dresslink_colors[0])
            plt.title(f"Distribution of {column}", fontsize=16)
            
        plt.xlabel(column, fontsize=14)
        plt.ylabel("Density", fontsize=14)
        
        # Save if path provided
        if save_path is None:
            column_name = column.replace(" ", "_").lower()
            save_path = os.path.join(self.visualization_dir, f"{column_name}_distribution.png")
            
        plt.tight_layout()
        plt.savefig(save_path)
        logger.info(f"Saved distribution visualization to {save_path}")
        plt.close()
    
    def visualize_dimensionality_reduction(self, X, y, method='pca', save_path=None):
        """
        Visualize data in 2D using dimensionality reduction.
        
        Args:
            X: Feature matrix
            y: Target labels
            method: 'pca' or 'tsne'
            save_path: Path to save the visualization
        """
        logger.info(f"Performing dimensionality reduction using {method}")
        
        # Apply dimensionality reduction
        if method.lower() == 'pca':
            model = PCA(n_components=2)
            X_reduced = model.fit_transform(X)
            explained_var = model.explained_variance_ratio_
            title = f"PCA (Explained Variance: {sum(explained_var):.2f})"
        elif method.lower() == 'tsne':
            model = TSNE(n_components=2, random_state=42)
            X_reduced = model.fit_transform(X)
            title = "t-SNE Visualization"
        else:
            logger.error(f"Unknown method: {method}")
            return
        
        # Create figure
        plt.figure(figsize=(10, 8))
        
        # Convert y to numeric if it's categorical
        if not isinstance(y[0], (int, float, np.number)):
            y_numeric, labels = pd.factorize(y)
        else:
            y_numeric = y
            labels = None
        
        # Plot reduced data
        scatter = plt.scatter(
            X_reduced[:, 0],
            X_reduced[:, 1],
            c=y_numeric,
            cmap=self.dresslink_cmap,
            alpha=0.7,
            s=100
        )
        
        # Add legend
        if labels is not None:
            plt.legend(
                handles=scatter.legend_elements()[0],
                labels=labels,
                title="Classes",
                loc="best"
            )
        
        plt.title(title, fontsize=16)
        plt.xlabel("Component 1", fontsize=14)
        plt.ylabel("Component 2", fontsize=14)
        plt.grid(True, alpha=0.3)
        
        # Save if path provided
        if save_path is None:
            save_path = os.path.join(self.visualization_dir, f"{method.lower()}_visualization.png")
            
        plt.tight_layout()
        plt.savefig(save_path)
        logger.info(f"Saved dimensionality reduction visualization to {save_path}")
        plt.close()
    
    def create_dashboard(self, measurements_df, model_results=None):
        """
        Create a complete dashboard of visualizations.
        
        Args:
            measurements_df: DataFrame containing body measurements
            model_results: Optional dictionary with model evaluation results
        """
        logger.info("Creating visualization dashboard")
        
        # 1. Body measurements distribution
        self.visualize_body_measurements(measurements_df)
        
        # 2. Measurement relationships
        self.visualize_measurement_relationships(measurements_df)
        
        # 3. Body shape ratios
        self.visualize_body_shape_ratios(measurements_df)
        
        # 4. Body shape diagrams
        self.visualize_body_shapes()
        
        # 5. Model results if available
        if model_results:
            if 'confusion_matrix' in model_results:
                y_true = model_results['confusion_matrix']['true']
                y_pred = model_results['confusion_matrix']['pred']
                labels = model_results['confusion_matrix'].get('labels')
                self.visualize_confusion_matrix(y_true, y_pred, labels)
                
            if 'feature_importance' in model_results:
                features = model_results['feature_importance']['features']
                values = model_results['feature_importance']['values']
                self.visualize_feature_importance(features, values)
                
            if 'model_comparison' in model_results:
                ml_results = model_results['model_comparison']['ml']
                rule_results = model_results['model_comparison']['rule']
                self.visualize_model_comparison(ml_results, rule_results)
                
            # Dimensionality reduction if features available
            if 'features' in model_results and 'target' in model_results:
                X = model_results['features']
                y = model_results['target']
                self.visualize_dimensionality_reduction(X, y, method='pca')
        
        logger.info(f"Dashboard created in {self.visualization_dir}")


# Example usage
if __name__ == "__main__":
    # Set up paths
    data_dir = "e:/Induvidual project/Dresslink-platform/backend/data"
    measurements_path = os.path.join(data_dir, "processed/body_measurements.csv")
    
    # Create visualizer
    visualizer = DressLinkVisualizer()
    
    # Check if measurements data exists
    if os.path.exists(measurements_path):
        # Load measurements data
        measurements_df = pd.read_csv(measurements_path)
        
        # Create dashboard
        visualizer.create_dashboard(measurements_df)
        
        # Specific visualizations
        visualizer.visualize_body_shape_ratios(measurements_df)
        visualizer.visualize_body_shapes()
        
        # Data distribution
        visualizer.visualize_data_distribution(measurements_df, "bust", by_column="body_shape")
        visualizer.visualize_data_distribution(measurements_df, "waist")
        visualizer.visualize_data_distribution(measurements_df, "hips")
        
        logger.info("All visualizations created successfully")
    else:
        logger.error(f"Measurements data not found at {measurements_path}")