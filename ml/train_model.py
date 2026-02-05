"""
Machine Learning Model Training Script

This script trains a phishing detection model using extracted URL features.
It supports multiple algorithms and includes evaluation metrics.
"""

import pandas as pd
import numpy as np
import joblib
import os
from pathlib import Path
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report, roc_auc_score
)
from sklearn.preprocessing import StandardScaler
import sys

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from backend.utils.feature_extraction import URLFeatureExtractor
from ml.prepare_data import load_dataset, create_sample_dataset


class PhishingDetector:
    """Phishing Detection Model Trainer and Predictor"""
    
    def __init__(self, model_type='random_forest'):
        """
        Initialize the phishing detector
        
        Args:
            model_type: Type of model to use ('random_forest', 'gradient_boosting', 'logistic')
        """
        self.model_type = model_type
        self.model = None
        self.scaler = StandardScaler()
        self.feature_extractor = URLFeatureExtractor()
        self.feature_names = self.feature_extractor.get_feature_names()
        
        # Initialize model based on type
        if model_type == 'random_forest':
            self.model = RandomForestClassifier(
                n_estimators=100,
                max_depth=20,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1
            )
        elif model_type == 'gradient_boosting':
            self.model = GradientBoostingClassifier(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=5,
                random_state=42
            )
        elif model_type == 'logistic':
            self.model = LogisticRegression(
                max_iter=1000,
                random_state=42,
                n_jobs=-1
            )
        else:
            raise ValueError(f"Unknown model type: {model_type}")
    
    def prepare_features(self, urls):
        """
        Extract features from URLs
        
        Args:
            urls: List of URLs or pandas Series
            
        Returns:
            Feature matrix (numpy array)
        """
        features_list = []
        
        for url in urls:
            features = self.feature_extractor.extract_features(url)
            # Convert to list in correct order
            feature_vector = [features[name] for name in self.feature_names]
            features_list.append(feature_vector)
        
        return np.array(features_list)
    
    def train(self, X_train, y_train, X_val=None, y_val=None):
        """
        Train the model
        
        Args:
            X_train: Training features
            y_train: Training labels
            X_val: Validation features (optional)
            y_val: Validation labels (optional)
        """
        print(f"\n🚀 Training {self.model_type} model...")
        print(f"   Training samples: {len(X_train)}")
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        
        # Train model
        self.model.fit(X_train_scaled, y_train)
        
        # Training accuracy
        train_pred = self.model.predict(X_train_scaled)
        train_acc = accuracy_score(y_train, train_pred)
        print(f"   Training accuracy: {train_acc:.4f}")
        
        # Validation accuracy if provided
        if X_val is not None and y_val is not None:
            X_val_scaled = self.scaler.transform(X_val)
            val_pred = self.model.predict(X_val_scaled)
            val_acc = accuracy_score(y_val, val_pred)
            print(f"   Validation accuracy: {val_acc:.4f}")
        
        print("✅ Training complete!")
    
    def evaluate(self, X_test, y_test):
        """
        Evaluate the model
        
        Args:
            X_test: Test features
            y_test: Test labels
            
        Returns:
            Dictionary of evaluation metrics
        """
        print("\n📊 Evaluating model...")
        
        # Scale features
        X_test_scaled = self.scaler.transform(X_test)
        
        # Predictions
        y_pred = self.model.predict(X_test_scaled)
        y_pred_proba = self.model.predict_proba(X_test_scaled)[:, 1]
        
        # Calculate metrics
        metrics = {
            'accuracy': accuracy_score(y_test, y_pred),
            'precision': precision_score(y_test, y_pred),
            'recall': recall_score(y_test, y_pred),
            'f1_score': f1_score(y_test, y_pred),
            'roc_auc': roc_auc_score(y_test, y_pred_proba)
        }
        
        # Print results
        print("\n" + "="*50)
        print("MODEL EVALUATION RESULTS")
        print("="*50)
        print(f"Accuracy:  {metrics['accuracy']:.4f} ({metrics['accuracy']*100:.2f}%)")
        print(f"Precision: {metrics['precision']:.4f}")
        print(f"Recall:    {metrics['recall']:.4f}")
        print(f"F1-Score:  {metrics['f1_score']:.4f}")
        print(f"ROC-AUC:   {metrics['roc_auc']:.4f}")
        print("="*50)
        
        # Confusion Matrix
        cm = confusion_matrix(y_test, y_pred)
        print("\nConfusion Matrix:")
        print(f"                Predicted")
        print(f"              Legit  Phish")
        print(f"Actual Legit   {cm[0][0]:4d}   {cm[0][1]:4d}")
        print(f"       Phish   {cm[1][0]:4d}   {cm[1][1]:4d}")
        
        # Classification Report
        print("\nDetailed Classification Report:")
        print(classification_report(y_test, y_pred, 
                                   target_names=['Legitimate', 'Phishing']))
        
        return metrics
    
    def predict(self, url):
        """
        Predict if a URL is phishing
        
        Args:
            url: URL to analyze
            
        Returns:
            Dictionary with prediction and confidence
        """
        # Extract features
        features = self.feature_extractor.extract_features(url)
        feature_vector = np.array([[features[name] for name in self.feature_names]])
        
        # Scale features
        feature_vector_scaled = self.scaler.transform(feature_vector)
        
        # Predict
        prediction = self.model.predict(feature_vector_scaled)[0]
        confidence = self.model.predict_proba(feature_vector_scaled)[0]
        
        return {
            'prediction': 'Phishing' if prediction == 1 else 'Legitimate',
            'confidence': float(confidence[prediction]),
            'phishing_probability': float(confidence[1]),
            'legitimate_probability': float(confidence[0])
        }
    
    def save_model(self, filepath):
        """Save the trained model"""
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'model_type': self.model_type,
            'feature_names': self.feature_names
        }
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        joblib.dump(model_data, filepath)
        print(f"\n✅ Model saved to: {filepath}")
    
    def load_model(self, filepath):
        """Load a trained model"""
        model_data = joblib.load(filepath)
        self.model = model_data['model']
        self.scaler = model_data['scaler']
        self.model_type = model_data['model_type']
        self.feature_names = model_data['feature_names']
        print(f"✅ Model loaded from: {filepath}")
    
    def get_feature_importance(self, top_n=10):
        """Get feature importance (for tree-based models)"""
        if hasattr(self.model, 'feature_importances_'):
            importances = self.model.feature_importances_
            indices = np.argsort(importances)[::-1][:top_n]
            
            print(f"\n🔍 Top {top_n} Most Important Features:")
            print("="*50)
            for i, idx in enumerate(indices, 1):
                print(f"{i:2d}. {self.feature_names[idx]:25s} {importances[idx]:.4f}")
            print("="*50)


def main():
    """Main training pipeline"""
    print("="*70)
    print("🔐 CYBERGUARD - PHISHING DETECTION MODEL TRAINING")
    print("="*70)
    
    # Step 1: Load or create dataset
    print("\n📂 Step 1: Loading dataset...")
    data_dir = Path(__file__).parent.parent / 'data' / 'raw'
    dataset_path = data_dir / 'sample_urls.csv'
    
    if not dataset_path.exists():
        print("   Dataset not found. Creating sample dataset...")
        create_sample_dataset()
    
    df = load_dataset(str(dataset_path))
    
    # Step 2: Extract features
    print("\n🔧 Step 2: Extracting features from URLs...")
    detector = PhishingDetector(model_type='random_forest')
    
    X = detector.prepare_features(df['url'])
    y = df['label'].values
    
    print(f"   Feature matrix shape: {X.shape}")
    print(f"   Number of features: {len(detector.feature_names)}")
    
    # Step 3: Split data
    print("\n✂️  Step 3: Splitting data...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"   Training set: {len(X_train)} samples")
    print(f"   Test set: {len(X_test)} samples")
    
    # Step 4: Train model
    print("\n" + "="*70)
    detector.train(X_train, y_train, X_test, y_test)
    
    # Step 5: Evaluate model
    metrics = detector.evaluate(X_test, y_test)
    
    # Step 6: Feature importance
    detector.get_feature_importance(top_n=15)
    
    # Step 7: Save model
    model_dir = Path(__file__).parent.parent / 'data' / 'models'
    model_path = model_dir / 'phishing_detector.pkl'
    detector.save_model(str(model_path))
    
    # Step 8: Test predictions
    print("\n🧪 Testing predictions on sample URLs...")
    print("="*70)
    
    test_urls = [
        "http://secure-login-update.com/verify/account?id=47281",
        "https://www.google.com/search?q=cybersecurity",
        "http://paypa1-secure.com/signin",
        "https://www.github.com/explore"
    ]
    
    for url in test_urls:
        result = detector.predict(url)
        print(f"\nURL: {url}")
        print(f"  Prediction: {result['prediction']}")
        print(f"  Confidence: {result['confidence']:.2%}")
        print(f"  Phishing Probability: {result['phishing_probability']:.2%}")
    
    print("\n" + "="*70)
    print("✅ TRAINING COMPLETE!")
    print("="*70)
    print(f"\n📊 Final Model Performance:")
    print(f"   Accuracy: {metrics['accuracy']*100:.2f}%")
    print(f"   Model saved to: {model_path}")
    print("\n🚀 Ready to deploy!")


if __name__ == "__main__":
    main()
