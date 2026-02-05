"""
ML Model Wrapper for FastAPI Integration

This module provides a wrapper around the trained ML model for easy integration
with the FastAPI backend.
"""

import joblib
import numpy as np
from pathlib import Path
from typing import Dict, Any
import sys

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from backend.utils.feature_extraction import URLFeatureExtractor


class PhishingModel:
    """Wrapper for the trained phishing detection model"""
    
    def __init__(self, model_path: str = None):
        """
        Initialize the model
        
        Args:
            model_path: Path to the trained model file
        """
        if model_path is None:
            # Default path
            base_dir = Path(__file__).parent.parent.parent
            model_path = base_dir / 'data' / 'models' / 'phishing_detector.pkl'
        
        self.model_path = Path(model_path)
        self.model = None
        self.scaler = None
        self.feature_names = []
        self.feature_extractor = URLFeatureExtractor()
        
        self.load_model()
    
    def load_model(self):
        """Load the trained model from disk"""
        try:
            if not self.model_path.exists():
                raise FileNotFoundError(f"Model file not found: {self.model_path}")
            
            model_data = joblib.load(self.model_path)
            self.model = model_data['model']
            self.scaler = model_data['scaler']
            self.feature_names = model_data['feature_names']
            
            print(f"✅ Model loaded successfully from: {self.model_path}")
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            raise
    
    def predict(self, url: str) -> Dict[str, Any]:
        """
        Predict if a URL is phishing
        
        Args:
            url: URL to analyze
            
        Returns:
            Dictionary with prediction results
        """
        # Extract features
        features = self.feature_extractor.extract_features(url)
        feature_vector = np.array([[features[name] for name in self.feature_names]])
        
        # Scale features
        feature_vector_scaled = self.scaler.transform(feature_vector)
        
        # Predict
        prediction = self.model.predict(feature_vector_scaled)[0]
        probabilities = self.model.predict_proba(feature_vector_scaled)[0]
        
        # Determine threat type based on features
        threat_type = self._determine_threat_type(features, prediction)
        
        # Calculate risk score (0-100)
        risk_score = int(probabilities[1] * 100)
        
        return {
            'prediction': 'Phishing' if prediction == 1 else 'Legitimate',
            'confidence': float(probabilities[prediction]),
            'phishing_probability': float(probabilities[1]),
            'legitimate_probability': float(probabilities[0]),
            'risk_score': risk_score,
            'threat_type': threat_type if prediction == 1 else None,
            'features': features
        }
    
    def _determine_threat_type(self, features: Dict[str, Any], prediction: int) -> str:
        """
        Determine the type of phishing threat based on features
        
        Args:
            features: Extracted URL features
            prediction: Model prediction (0=legitimate, 1=phishing)
            
        Returns:
            Threat type string
        """
        if prediction == 0:
            return None
        
        # Brand Impersonation: Has suspicious keywords like login, verify, etc.
        if features.get('num_suspicious_keywords', 0) >= 2:
            return 'Brand Impersonation'
        
        # Credential Harvesting: Has login/signin keywords
        if features.get('num_suspicious_keywords', 0) >= 1:
            return 'Credential Harvesting'
        
        # Malware Distribution: Uses IP address or shortened URL
        if features.get('has_ip', 0) == 1 or features.get('is_shortened', 0) == 1:
            return 'Malware Distribution'
        
        # Social Engineering: Long URL with many special characters
        if features.get('url_length', 0) > 75 and features.get('special_char_ratio', 0) > 0.15:
            return 'Social Engineering'
        
        return 'Other / Unclassified'


# Global model instance (loaded once at startup)
_model_instance = None


def get_model() -> PhishingModel:
    """Get or create the global model instance"""
    global _model_instance
    if _model_instance is None:
        _model_instance = PhishingModel()
    return _model_instance
