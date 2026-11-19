# TruthLens — AI-Powered Digital Forensics Platform

TruthLens is a multi-modal digital forensics and deepfake detection platform designed to detect synthetic media, facial reenactments, neural voice clones, and container tampering across **Images**, **Videos**, and **Audio**.

---

## 🌟 Key Features

- **Multi-Modal Forensics Workspace (OmniScan):**
  - **Image Forensics:** Pretrained deep learning Vision Transformer & ConvNeXt detectors paired with EXIF metadata parsing and editing software signature discovery.
  - **Video Deepfake Detection:** Frame extraction and temporal sequence analysis powered by OpenCV and deep feature transformers to identify facial reenactments, blending seam artifacts, and temporal lighting jitter.
  - **Audio Deepfake Detection:** Acoustic DSP signal evaluation (RMS energy, silence/pause ratios, zero-crossing rate, spectral centroid) and neural vocoder spoof profiling.
- **Obsidian Violet Forensics UI:** Responsive, high-contrast digital investigation workspace built with React 18, TypeScript, Tailwind CSS, and Vite.
- **LensCredits Decentralized Economy:** Atomic wallet credit ledger tracking free and purchased credits for forensic scans (5 LC Image, 10 LC Audio, 20 LC Video).
- **Supabase Integration:** Row-Level Security (RLS) encrypted storage, user authentication, and transaction logging.
- **FastAPI Modular Engine:** High-performance RESTful API with automated multi-modal file routing, hardware device detection (NVIDIA CUDA / CPU), and interactive Swagger docs.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite, Lucide Icons, KaTeX
- **Backend:** Python 3.11, FastAPI, Uvicorn, PyTorch, Hugging Face Transformers, OpenCV, SoundFile, SciPy, Pillow
- **Database & Auth:** Supabase (PostgreSQL, Storage Buckets, Row-Level Security, Edge Functions)
- **Media Decoding:** FFmpeg & FFprobe

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Python:** 3.11+
- **Node.js:** 18+ & npm
- **FFmpeg & FFprobe:** Installed and available in your system `PATH`.

---

### 2. Backend Setup

```bash
# Navigate to the backend directory
cd Backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
copy .env.example .env
# Edit .env with your Supabase credentials (SUPABASE_URL, SUPABASE_ANON_KEY)

# Start the FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
- API will be accessible at: `http://localhost:8000`
- Interactive API Documentation (Swagger): `http://localhost:8000/docs`

---

### 3. Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install packages
npm install

# Configure environment variables
copy .env.example .env
# Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY

# Start the development server
npm run dev
```
- Web Application will be accessible at: `http://localhost:5173`

---

## 🔬 Machine Learning Models & Inference Pipeline

TruthLens downloads and caches pretrained model weights locally on first execution:
1. **Image Forensics:**
   - Architecture: Vision Transformer (`umm-maybe/AI-image-detector`) / ConvNeXt Base (`Imagers/imager-1-pro`).
   - Pretrained weights are cached in `~/.cache/huggingface/hub/` (~340MB).
2. **Video Forensics:**
   - OpenCV video stream decoding with representative keyframe sampling and temporal variance estimation.
3. **Audio Forensics:**
   - SoundFile & SciPy acoustic signal processing with neural vocoder spoof detection.

---

## 🛡️ Security & Privacy
- **Zero API Secret Leakage:** All `.env` files, model weights, and private tokens are excluded via `.gitignore`.
- **Encrypted Storage:** User uploads are directed to private Supabase storage buckets with authenticated access.
- **Ethical Disclosure:** All forensic results include technical limitation disclaimers and model confidence calibrations.

---

## 📄 License
This project is licensed under the Apache 2.0 License.
