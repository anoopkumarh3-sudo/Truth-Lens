"""
TruthLens API Routes
Multi-modal endpoints for Image, Video, and Audio digital forensics.
"""

import os
from typing import Optional
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, status
from app.core.device import get_device_info
from app.services.forensics_service import (
    ForensicsService,
    ALLOWED_IMAGE_EXTS,
    ALLOWED_VIDEO_EXTS,
    ALLOWED_AUDIO_EXTS,
)

router = APIRouter()
forensics = ForensicsService()


@router.get("/health")
def health_check():
    """Returns service operational status, hardware acceleration, and all three engine capabilities."""
    return {
        "status": "online",
        "service": "TruthLens Multi-Modal Forensics API",
        "version": "1.0.0",
        "engines": {
            "image": {
                "status": "ready" if forensics.is_model_ready() else "initializing",
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


@router.post("/analyze/quick")
async def quick_analysis(
    file: Optional[UploadFile] = File(
        default=None,
        description="Upload an image, audio, or video file for automated forensic inspection.",
    ),
    file_path: Optional[str] = Form(
        default=None,
        description="Optional local filesystem path to a media file.",
    ),
    analysis_type: Optional[str] = Form(
        default=None,
        description="Optional modality hint: 'image', 'video', or 'audio'.",
    ),
):
    """
    Unified multi-modal endpoint:
    Automatically routes image, audio, or video files to their respective forensics engine.
    """
    if file is None and not file_path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either a 'file' upload or a valid 'file_path' must be provided.",
        )

    try:
        if file is not None:
            filename = file.filename or "uploaded_media"
            contents = await file.read()
            if len(contents) == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Uploaded file is empty (0 bytes).",
                )
            return forensics.process_file_auto(
                file_bytes=contents,
                file_name=filename,
                hint_modality=analysis_type,
            )

        if file_path:
            clean_path = file_path.strip().strip("'\"")
            if not os.path.isfile(clean_path):
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"File not found on local disk: '{clean_path}'",
                )
            with open(clean_path, "rb") as f:
                contents = f.read()

            return forensics.process_file_auto(
                file_bytes=contents,
                file_name=os.path.basename(clean_path),
                hint_modality=analysis_type,
            )

    except HTTPException:
        raise
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forensics processing failed: {str(exc)}",
        )


@router.post("/analyze/image")
async def analyze_image_endpoint(
    file: UploadFile = File(..., description="Image file (JPG, PNG, WEBP)"),
):
    """Dedicated Image Forensics Endpoint."""
    try:
        contents = await file.read()
        return forensics.process_image(contents, file.filename or "image.jpg")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze/video")
async def analyze_video_endpoint(
    file: UploadFile = File(..., description="Video file (MP4, WEBM, MOV, AVI)"),
):
    """Dedicated Video Forensics Endpoint."""
    try:
        contents = await file.read()
        return forensics.process_video(contents, file.filename or "video.mp4")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze/audio")
async def analyze_audio_endpoint(
    file: UploadFile = File(..., description="Audio file (WAV, MP3, OGG, FLAC)"),
):
    """Dedicated Audio Forensics Endpoint."""
    try:
        contents = await file.read()
        return forensics.process_audio(contents, file.filename or "audio.wav")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
