"""
API Routes for Statistics and Threat Intelligence

This module contains endpoints for retrieving statistics and recent threats.
"""

from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

from backend.models.database import Database, InMemoryStorage


router = APIRouter()


class StatisticsResponse(BaseModel):
    """Response model for statistics"""
    total_analyzed: int
    phishing_detected: int
    detection_accuracy: float
    avg_response_time_ms: int
    today_count: int
    threat_breakdown: Dict[str, float]


class ThreatLog(BaseModel):
    """Model for a single threat log entry"""
    url: str
    prediction: str
    confidence: float
    risk_score: int
    threat_type: Optional[str]
    timestamp: datetime


@router.get("/stats", response_model=StatisticsResponse)
async def get_statistics():
    """
    Get overall system statistics
    
    Returns:
        StatisticsResponse with system metrics
    """
    if Database.db is not None:
        stats = await Database.get_statistics()
    else:
        stats = InMemoryStorage.get_statistics()
    
    return StatisticsResponse(**stats)


@router.get("/recent-threats")
async def get_recent_threats(limit: int = Query(default=10, ge=1, le=100)):
    """
    Get recent phishing threats detected
    
    Args:
        limit: Maximum number of threats to return (1-100)
        
    Returns:
        List of recent threat detections
    """
    if Database.db is not None:
        threats = await Database.get_recent_threats(limit)
    else:
        threats = InMemoryStorage.get_recent_threats(limit)
    
    return {
        'count': len(threats),
        'threats': threats
    }


@router.get("/analysis-logs")
async def get_analysis_logs(limit: int = Query(default=20, ge=1, le=100)):
    """
    Get all recent analysis logs
    
    Args:
        limit: Maximum number of logs to return (1-100)
        
    Returns:
        List of recent analysis logs
    """
    if Database.db is not None:
        logs = await Database.get_all_logs(limit)
    else:
        logs = InMemoryStorage.get_all_logs(limit)
    
    return {
        'count': len(logs),
        'logs': logs
    }


@router.get("/health")
async def health_check():
    """
    Health check endpoint
    
    Returns:
        System health status
    """
    return {
        'status': 'healthy',
        'timestamp': datetime.utcnow(),
        'database': 'connected' if Database.db is not None else 'in-memory',
        'model': 'loaded'
    }
