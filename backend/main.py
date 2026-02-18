"""
FastAPI Main Application

This is the main entry point for the CyberGuard API server.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
from pathlib import Path
import os

from backend.models.database import Database
from backend.models.ml_model import get_model
from backend.routes import analyze, stats


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events
    """
    # Startup
    print("\n" + "="*70)
    print("🔐 CYBERGUARD - AI-POWERED PHISHING DETECTION SYSTEM")
    print("="*70)
    
    # Load ML model
    print("\n📦 Loading ML model...")
    try:
        get_model()
    except Exception as e:
        print(f"❌ Failed to load model: {e}")
        print("   Please train the model first: python ml/train_model.py")
    
    # Connect to database
    print("\n🔌 Connecting to database...")
    await Database.connect_db()
    
    print("\n✅ Server ready!")
    print("="*70)
    print(f"📊 Dashboard: http://localhost:8000")
    print(f"📖 API Docs: http://localhost:8000/docs")
    print("="*70 + "\n")
    
    yield
    
    # Shutdown
    print("\n🛑 Shutting down...")
    await Database.close_db()
    print("✅ Shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="CyberGuard API",
    description="AI-Powered Phishing Detection & Analysis System",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(analyze.router, prefix="/api", tags=["Analysis"])
app.include_router(stats.router, prefix="/api", tags=["Statistics"])

# Serve static files (frontend)
frontend_dir = Path(__file__).parent.parent / "frontend-react" / "dist"
if frontend_dir.exists():
    # Serve assets from the dist/assets folder
    assets_dir = frontend_dir / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")
    
    # Also mount the root dist folder for other static files like favicon, etc.
    app.mount("/static", StaticFiles(directory=str(frontend_dir)), name="static")
    
    @app.get("/")
    async def serve_dashboard():
        """Serve the dashboard HTML"""
        index_path = frontend_dir / "index.html"
        if index_path.exists():
            return FileResponse(index_path)
        return {"message": "Dashboard not yet available"}

    # Catch-all route for SPA navigation
    @app.get("/{full_path:path}")
    async def catch_all(full_path: str):
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("redoc"):
            return None # Let FastAPI handles these
        
        index_path = frontend_dir / "index.html"
        if index_path.exists():
            return FileResponse(index_path)
        return {"message": "Not found"}


@app.get("/api")
async def root():
    """API root endpoint"""
    return {
        "name": "CyberGuard API",
        "version": "1.0.0",
        "description": "AI-Powered Phishing Detection & Analysis System",
        "endpoints": {
            "analyze_url": "/api/analyze-url",
            "analyze_email": "/api/analyze-email",
            "statistics": "/api/stats",
            "recent_threats": "/api/recent-threats",
            "health": "/api/health",
            "docs": "/docs"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
