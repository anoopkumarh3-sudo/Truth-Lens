"""
TruthLens Backend API Entrypoint
"""

import os
from contextlib import asynccontextmanager
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.config import settings
from app.core.device import get_device_info


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.services.forensics_service import ForensicsService
    info = get_device_info()
    print("=" * 60)
    print(f"TruthLens Forensics API Starting on {settings.API_HOST}:{settings.API_PORT}")
    print(f"Device Acceleration: {info.get('allocated_device')} ({info.get('device_name', 'CPU')})")
    service = ForensicsService()
    print(f"Multi-Modal Detection Engines (Image, Video, Audio) Ready: {service.is_model_ready()}")
    print("=" * 60)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="TruthLens AI-Powered Multi-Modal Forensics API (Image, Video, Audio)",
    lifespan=lifespan,
)

# CORS configuration allowing React frontend at http://localhost:5173
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "service": "TruthLens Forensics API",
        "status": "online",
        "docs": "/docs",
        "health": "/health",
        "supported_engines": ["image", "video", "audio"],
    }


@app.get("/health")
def health_check():
    """Health endpoint returning server status and detection engines."""
    from app.services.forensics_service import (
        ForensicsService,
        ALLOWED_IMAGE_EXTS,
        ALLOWED_VIDEO_EXTS,
        ALLOWED_AUDIO_EXTS,
    )
    service = ForensicsService()
    return {
        "status": "online",
        "service": "TruthLens Multi-Modal Forensics API",
        "version": "1.0.0",
        "engines": {
            "image": {
                "status": "ready" if service.is_model_ready() else "initializing",
                "model": "umm-maybe/AI-image-detector (ViT-Base)",
                "supported_formats": sorted(list(ALLOWED_IMAGE_EXTS)),
            },
            "video": {
                "status": "ready",
                "engine": "OpenCV Decoders + Frame-by-Frame ViT Temporal Evaluation",
                "supported_formats": sorted(list(ALLOWED_VIDEO_EXTS)),
            },
            "audio": {
                "status": "ready",
                "engine": "SoundFile Acoustic DSP + Neural Vocoder Spoof Profiler",
                "supported_formats": sorted(list(ALLOWED_AUDIO_EXTS)),
            },
        },
        "device_info": get_device_info(),
    }


# Include API routes
app.include_router(router, prefix="/api")


if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.API_HOST, port=settings.API_PORT, reload=settings.DEBUG)
