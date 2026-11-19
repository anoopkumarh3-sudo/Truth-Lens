import React, { useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { uploadMedia, UploadResult } from '../services/storageService';
import { submitAnalysisToEdge, generateUUID } from '../services/analysisService';

export const ReOrigin: React.FC = () => {
  const { user, wallet, availableCredits, refreshWallet } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasEnhanced, setHasEnhanced] = useState(false);
  const [backendSettled, setBackendSettled] = useState(false);

  // Filter controls
  const [brightness, setBrightness] = useState(0); // -100 to 100
  const [contrast, setContrast] = useState(0); // -100 to 100
  const [isGrayscale, setIsGrayscale] = useState(false);
  const [isSharpened, setIsSharpened] = useState(false);
  const [isEdgeDetected, setIsEdgeDetected] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  const cost = 25;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setUploadResult(null);
    setHasEnhanced(false);
    setBackendSettled(false);

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      if (originalUrl) URL.revokeObjectURL(originalUrl);
      const url = URL.createObjectURL(file);
      setOriginalUrl(url);

      if (!user) {
        setErrorMessage('Authentication required to upload media.');
        return;
      }

      if (availableCredits < cost) {
        setErrorMessage(
          `Insufficient LensCredits. ReOrigin requires ${cost} LC, but you have ${availableCredits} LC.`
        );
        return;
      }

      setIsUploading(true);
      try {
        const { data, error } = await uploadMedia(file, user.id, 'reorigin');
        if (error) {
          setErrorMessage(error.message);
        } else if (data) {
          setUploadResult(data);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Error uploading image.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  // Re-render canvas whenever filters change
  useEffect(() => {
    if (!originalImageRef.current || !canvasRef.current || !hasEnhanced) return;

    const img = originalImageRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    // 1. Brightness & Contrast & Grayscale
    const bMul = brightness * 1.28; // -128 to 128
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Brightness
      r += bMul;
      g += bMul;
      b += bMul;

      // Contrast
      r = factor * (r - 128) + 128;
      g = factor * (g - 128) + 128;
      b = factor * (b - 128) + 128;

      // Grayscale
      if (isGrayscale) {
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        r = luma;
        g = luma;
        b = luma;
      }

      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }

    ctx.putImageData(imgData, 0, 0);

    // 2. Convolution (Sharpening or Edge Detection)
    if (isSharpened || isEdgeDetected) {
      const srcData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const outData = ctx.createImageData(canvas.width, canvas.height);
      const src = srcData.data;
      const dst = outData.data;
      const w = canvas.width;
      const h = canvas.height;

      // Kernels
      // Sharpen: [0, -1, 0, -1, 5, -1, 0, -1, 0]
      // Edge: [-1, -1, -1, -1, 8, -1, -1, -1, -1]
      const kernel = isEdgeDetected
        ? [-1, -1, -1, -1, 8, -1, -1, -1, -1]
        : [0, -1, 0, -1, 5, -1, 0, -1, 0];

      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          let r = 0, g = 0, b = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const pIdx = ((y + ky) * w + (x + kx)) * 4;
              const weight = kernel[(ky + 1) * 3 + (kx + 1)];
              r += src[pIdx] * weight;
              g += src[pIdx + 1] * weight;
              b += src[pIdx + 2] * weight;
            }
          }
          const outIdx = (y * w + x) * 4;
          dst[outIdx] = Math.max(0, Math.min(255, r));
          dst[outIdx + 1] = Math.max(0, Math.min(255, g));
          dst[outIdx + 2] = Math.max(0, Math.min(255, b));
          dst[outIdx + 3] = 255;
        }
      }
      ctx.putImageData(outData, 0, 0);
    }
  }, [brightness, contrast, isGrayscale, isSharpened, isEdgeDetected, hasEnhanced]);

  const handleStartEnhancement = async () => {
    if (!uploadResult || !selectedFile) {
      setErrorMessage('Please upload an image first.');
      return;
    }

    if (availableCredits < cost) {
      setErrorMessage(`Insufficient LensCredits. ReOrigin requires ${cost} LC.`);
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Deduct 25 LC on backend
      const reqId = generateUUID();
      const { data, error } = await submitAnalysisToEdge({
        analysisType: 'reorigin',
        inputFilePath: uploadResult.path,
        fileName: uploadResult.fileName,
        fileSizeBytes: uploadResult.sizeBytes,
        mimeType: uploadResult.mimeType,
        requestId: reqId,
      });

      if (error) {
        setErrorMessage(error.message || 'Credit settlement failed on server.');
      } else if (data) {
        setBackendSettled(true);
        if (data.wallet) {
          await refreshWallet(data.wallet);
        } else {
          await refreshWallet();
        }
        setHasEnhanced(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error initializing enhancement pipeline.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `enhanced_${selectedFile?.name || 'reorigin_output.png'}`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handleResetFilters = () => {
    setBrightness(0);
    setContrast(0);
    setIsGrayscale(false);
    setIsSharpened(false);
    setIsEdgeDetected(false);
  };

  return (
    <DashboardLayout credits={wallet ? availableCredits : '—'}>
      <div className="flex flex-col w-full px-space-md lg:px-margin pb-space-xl">
        {/* Ambient Glow */}
        <div className="relative w-full">
          <div className="absolute -top-12 left-1/3 w-[600px] h-[280px] bg-gradient-to-r from-secondary-container/15 via-primary-container/20 to-tertiary-container/10 blur-[130px] pointer-events-none -z-10 rounded-full" />

          {/* 1. Header Section */}
          <header className="relative pt-space-lg pb-space-md flex flex-col lg:flex-row lg:items-start lg:justify-between gap-space-md">
            <div className="flex flex-col max-w-2xl">
              <div className="inline-flex items-center gap-space-xs mb-space-xs">
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                <span className="font-label-sm text-label-sm tracking-widest uppercase text-tertiary font-semibold text-[11px]">
                  Forensic Image Enhancement & Inspection
                </span>
              </div>
              <h1 className="font-headline-lg md:font-headline-xl text-headline-lg md:text-headline-xl font-bold text-on-surface tracking-tight">
                ReOrigin
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mt-0.5">
                Apply local high-pass sharpening, contrast normalization, and edge gradient filters for forensic inspection.
              </p>
            </div>

            {/* Balance Telemetry Pill */}
            <div className="flex items-center gap-space-sm self-start lg:self-auto bg-surface-container-low px-space-md py-2.5 rounded-full shadow-sm border border-surface-variant/30">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <div className="flex items-baseline gap-1.5">
                <span className="font-label-md text-label-md font-bold text-on-surface">
                  {wallet ? `${availableCredits} LC` : '— LC'}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Available</span>
              </div>
              <span className="w-1 h-1 rounded-full bg-outline-variant mx-1" />
              <span className="font-label-sm text-label-sm text-primary font-medium tracking-wide">
                Live Database Balance
              </span>
            </div>
          </header>
        </div>

        {/* Mandatory Prominent Caution Banner */}
        <section className="bg-surface-container-low border border-tertiary/40 p-space-md rounded-xl shadow-md my-space-md flex items-start gap-space-md max-w-5xl mx-auto w-full">
          <div className="w-10 h-10 rounded-full bg-tertiary/20 flex items-center justify-center text-tertiary shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[22px]">warning</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-label-md text-label-md font-bold text-tertiary uppercase tracking-wider">
              Forensic Integrity Advisory
            </span>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              ReOrigin provides <strong className="text-on-surface">optical and frequency enhancement</strong> to reveal latent compression blocks and contrast shifts. It <strong className="text-on-surface">does not recover or prove a guaranteed original ground truth image</strong>.
            </p>
          </div>
        </section>

        {/* 2. Upload Box */}
        <section className="bg-surface-container-low p-space-lg rounded-xl flex flex-col gap-space-md shadow-md mb-space-lg border border-surface-variant/30 max-w-5xl mx-auto w-full">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight">
                Upload Target Image for Enhancement
              </h2>
              <span className="font-label-sm text-label-sm text-primary font-semibold px-2.5 py-0.5 rounded-full bg-primary-container/20">
                Cost: {cost} LC
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Provide an image to inspect edges, equalize luminance, and reveal concealed digital compression artifacts.
            </p>
          </div>

          <label className="group relative rounded-lg bg-surface-container/60 hover:bg-surface-container p-space-lg flex flex-col items-center justify-center text-center transition-all cursor-pointer border-2 border-dashed border-surface-variant/50 hover:border-primary-container">
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading || isProcessing}
            />
            <div className="w-14 h-14 rounded-full bg-surface-container-high group-hover:bg-primary-container text-primary group-hover:text-on-primary-container flex items-center justify-center transition-all shadow-md mb-space-sm">
              <span className="material-symbols-outlined text-[28px]">
                {isUploading ? 'refresh' : 'auto_fix_high'}
              </span>
            </div>
            <p className="font-headline-sm text-headline-sm text-on-surface font-medium">
              {isUploading
                ? 'Uploading file...'
                : selectedFile
                ? selectedFile.name
                : 'Drag and drop your image here'}
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Supports PNG, JPG, WEBP (Max 15 MB)
            </p>
            <span className="mt-space-md py-2 px-space-md rounded-full bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-md text-label-md font-medium transition-all shadow-sm">
              Browse Image
            </span>
          </label>

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-error-container/20 border border-error/40 text-error font-label-sm text-label-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Upload Success */}
          {uploadResult && !hasEnhanced && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-label-sm text-label-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                <span>
                  Image staged: <strong className="font-mono text-white">{uploadResult.fileName}</strong>
                </span>
              </div>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleStartEnhancement}
                className="px-space-md py-2 bg-primary hover:bg-primary/90 text-on-primary font-semibold text-xs rounded-full flex items-center justify-center gap-1.5 shadow cursor-pointer transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isProcessing ? 'refresh' : 'auto_fix_high'}
                </span>
                <span>{isProcessing ? 'Opening Canvas...' : `Launch Enhancement (${cost} LC)`}</span>
              </button>
            </div>
          )}
        </section>

        {/* Hidden original image element for canvas source */}
        {originalUrl && (
          <img
            ref={originalImageRef}
            src={originalUrl}
            alt="Source"
            className="hidden"
            onLoad={() => {
              if (hasEnhanced && canvasRef.current) {
                // Trigger canvas redraw
                setBrightness((b) => b);
              }
            }}
          />
        )}

        {/* 3. Before-and-After Canvas Studio */}
        {hasEnhanced && originalUrl && (
          <section className="flex flex-col gap-space-lg max-w-5xl mx-auto w-full">
            {/* Settlement Badge */}
            {backendSettled && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>Forensic enhancement canvas initialized. Settlement confirmed.</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                  -25 LC SETTLED
                </span>
              </div>
            )}

            {/* Filter Sliders & Toggle Bar */}
            <div className="bg-surface-container-low p-space-md rounded-xl border border-surface-variant/30 shadow-md flex flex-wrap items-center justify-between gap-space-md">
              <div className="flex items-center gap-4 flex-wrap flex-1">
                {/* Brightness */}
                <div className="flex flex-col gap-1 min-w-[140px]">
                  <span className="text-xs text-outline font-semibold">Brightness: {brightness}</span>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="accent-primary h-1.5 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Contrast */}
                <div className="flex flex-col gap-1 min-w-[140px]">
                  <span className="text-xs text-outline font-semibold">Contrast: {contrast}</span>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="accent-primary h-1.5 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Filter Toggles */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsGrayscale(!isGrayscale)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      isGrayscale
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface-container hover:bg-surface-bright text-on-surface border-surface-variant/40'
                    }`}
                  >
                    Grayscale
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsSharpened(!isSharpened);
                      if (!isSharpened) setIsEdgeDetected(false);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      isSharpened
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface-container hover:bg-surface-bright text-on-surface border-surface-variant/40'
                    }`}
                  >
                    Sharpen
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsEdgeDetected(!isEdgeDetected);
                      if (!isEdgeDetected) setIsSharpened(false);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      isEdgeDetected
                        ? 'bg-tertiary text-on-tertiary border-tertiary'
                        : 'bg-surface-container hover:bg-surface-bright text-on-surface border-surface-variant/40'
                    }`}
                  >
                    Edge Gradients
                  </button>

                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-3 py-1.5 rounded-full text-xs text-outline hover:text-on-surface hover:bg-surface-container transition-all"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownload}
                className="px-space-md py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>Download Enhanced</span>
              </button>
            </div>

            {/* Split Comparison View */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
              {/* Original Preview */}
              <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-variant/30 flex flex-col gap-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-outline font-semibold uppercase tracking-wider">
                    ORIGINAL INPUT IMAGE
                  </span>
                  <span className="text-[11px] text-outline font-mono">Ground Target</span>
                </div>
                <div className="w-full h-80 rounded-lg bg-surface-container-lowest flex items-center justify-center overflow-hidden border border-surface-variant/20">
                  <img
                    src={originalUrl}
                    alt="Original"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>

              {/* Enhanced Canvas Preview */}
              <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-variant/30 flex flex-col gap-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-primary font-semibold uppercase tracking-wider">
                    ENHANCED FORENSIC CANVAS
                  </span>
                  <span className="text-[11px] text-primary-fixed font-mono">Live Convolution</span>
                </div>
                <div className="w-full h-80 rounded-lg bg-surface-container-lowest flex items-center justify-center overflow-hidden border border-surface-variant/20">
                  <canvas
                    ref={canvasRef}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
};
