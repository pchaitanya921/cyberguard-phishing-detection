"""
API Routes for URL and Email Analysis

This module contains the endpoints for analyzing URLs and emails.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl, validator
from typing import Optional, Dict, Any
from datetime import datetime
import time

from backend.models.ml_model import get_model
from backend.models.database import Database, InMemoryStorage


router = APIRouter()


class URLAnalysisRequest(BaseModel):
    """Request model for URL analysis"""
    url: str
    
    @validator('url')
    def validate_url(cls, v):
        """Validate URL format"""
        if not v or len(v) < 4:
            raise ValueError('URL must be at least 4 characters long')
        
        # Add http:// if no protocol specified
        if not v.startswith(('http://', 'https://')):
            v = 'http://' + v
        
        return v


class EmailAnalysisRequest(BaseModel):
    """Request model for email analysis"""
    subject: str
    body: str
    sender: str


class AnalysisResponse(BaseModel):
    """Response model for analysis"""
    prediction: str
    confidence: float
    risk_score: int
    threat_type: Optional[str]
    phishing_probability: float
    legitimate_probability: float
    timestamp: datetime
    response_time_ms: int
    features: Optional[Dict[str, Any]] = None


@router.post("/analyze-url", response_model=AnalysisResponse)
async def analyze_url(request: URLAnalysisRequest):
    """
    Analyze a URL for phishing patterns
    
    Args:
        request: URLAnalysisRequest containing the URL to analyze
        
    Returns:
        AnalysisResponse with prediction and details
    """
    start_time = time.time()
    
    try:
        # Get model and predict
        model = get_model()
        result = model.predict(request.url)
        
        # Calculate response time
        response_time_ms = int((time.time() - start_time) * 1000)
        
        # Prepare response
        response_data = {
            'prediction': result['prediction'],
            'confidence': result['confidence'],
            'risk_score': result['risk_score'],
            'threat_type': result['threat_type'],
            'phishing_probability': result['phishing_probability'],
            'legitimate_probability': result['legitimate_probability'],
            'timestamp': datetime.utcnow(),
            'response_time_ms': response_time_ms,
            'features': result['features']
        }
        
        # Save to database
        analysis_log = {
            'url': request.url,
            'prediction': result['prediction'],
            'confidence': result['confidence'],
            'risk_score': result['risk_score'],
            'threat_type': result['threat_type'],
            'response_time_ms': response_time_ms
        }
        
        if Database.db is not None:
            await Database.save_analysis(analysis_log)
        else:
            InMemoryStorage.save_analysis(analysis_log)
        
        return AnalysisResponse(**response_data)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/analyze-email")
async def analyze_email(request: EmailAnalysisRequest):
    """
    Analyze an email for phishing patterns
    
    Note: This is a placeholder for future email analysis functionality
    """
    # For now, return a simple response
    # In production, this would use NLP to analyze email content
    
    suspicious_keywords = ['urgent', 'verify', 'suspend', 'click here', 'confirm', 'update']
    
    email_text = f"{request.subject} {request.body} {request.sender}".lower()
    
    keyword_count = sum(1 for keyword in suspicious_keywords if keyword in email_text)
    
    is_phishing = keyword_count >= 2
    confidence = min(0.5 + (keyword_count * 0.15), 0.95)
    
    return {
        'prediction': 'Phishing' if is_phishing else 'Legitimate',
        'confidence': confidence,
        'risk_score': int(confidence * 100) if is_phishing else 20,
        'threat_type': 'Social Engineering' if is_phishing else None,
        'indicators': [kw for kw in suspicious_keywords if kw in email_text],
        'timestamp': datetime.utcnow()
    }
