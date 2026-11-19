import React, { useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { uploadMedia, UploadResult } from '../services/storageService';
import { submitAnalysisToEdge, generateUUID } from '../services/analysisService';
import {
  analyzeImageLocally,
  analyzeAudioLocally,
  analyzeVideoLocally,
  ImageForensicsResult,
  AudioForensicsResult,
  VideoForensicsResult,
  DEMO_SCENARIOS,
  DemoScenario,
} from '../utils/forensics';

type MediaMode = 'image' | 'audio' | 'video';

export const OmniScan: React.FC = () => {
  const { user, wallet, availableCredits, refreshWallet } = useAuth();
  const [mode, setMode] = useState<MediaMode>('image');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [selectedDemoScenario, setSelectedDemoScenario] = useState<DemoScenario>(DEMO_SCENARIOS[0]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [submissionRequestId, setSubmissionRequestId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Local measurement states
  const [imageMetrics, setImageMetrics] = useState<ImageForensicsResult | null>(null);
  const [audioMetrics, setAudioMetrics] = useState<AudioForensicsResult | null>(null);
  const [videoMetrics, setVideoMetrics] = useState<VideoForensicsResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const costs: Record<MediaMode, number> = {
    image: 5,
    audio: 10,
    video: 20,
  };

  const fileAccepts: Record<MediaMode, string> = {
    image: 'image/jpeg,image/png,image/webp,image/tiff',
    audio: 'audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/x-m4a,audio/aac',
    video: 'video/mp4,video/webm,video/quicktime,video/x-msvideo',
  };

  const maxSizes: Record<MediaMode, { bytes: number; label: string }> = {
    image: { bytes: 10 * 1024 * 1024, label: '10 MB' },
    audio: { bytes: 20 * 1024 * 1024, label: '20 MB' },
    video: { bytes: 50 * 1024 * 1024, label: '50 MB' },
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const switchMode = (newMode: MediaMode) => {
    if (newMode === mode) return;
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setMode(newMode);
    setSelectedFile(null);
    setUploadResult(null);
    setSubmissionRequestId(null);
    setAnalysisResult(null);
    setImageMetrics(null);
    setAudioMetrics(null);
    setVideoMetrics(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFile = async (file: File) => {
    setErrorMessage(null);
    setUploadResult(null);
    setAnalysisResult(null);
    setImageMetrics(null);
    setAudioMetrics(null);
    setVideoMetrics(null);
    const freshRequestId = generateUUID();
    setSubmissionRequestId(freshRequestId);

    if (file.size > maxSizes[mode].bytes) {
      setErrorMessage(`File exceeds the maximum size limit of ${maxSizes[mode].label} for ${mode} analysis.`);
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const localUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(localUrl);

    // Extract client-side telemetry in parallel
    try {
      if (mode === 'image' || file.type.startsWith('image/')) {
        analyzeImageLocally(file).then(setImageMetrics).catch(() => {});
      } else if (mode === 'audio' || file.type.startsWith('audio/')) {
        analyzeAudioLocally(file).then(setAudioMetrics).catch(() => {});
      } else if (mode === 'video' || file.type.startsWith('video/')) {
        analyzeVideoLocally(file).then(setVideoMetrics).catch(() => {});
      }
    } catch (_) {}

    if (!user) {
      setErrorMessage('Authentication required to upload media.');
      return;
    }

    if (availableCredits < costs[mode] && !isDemoMode) {
      setErrorMessage(
        `Insufficient LensCredits. This analysis requires ${costs[mode]} LC, but you have ${availableCredits} LC.`
      );
      return;
    }

    setIsUploading(true);
    try {
      const targetType = mode;
      const { data, error } = await uploadMedia(file, user.id, targetType);
      if (error) {
        setErrorMessage(error.message);
      } else if (data) {
        setUploadResult(data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error uploading media file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleRunAnalysis = async () => {
    if (!uploadResult) {
      setErrorMessage('Please upload a file first.');
      return;
    }
    if (!hasConsent) {
      setErrorMessage('Explicit consent is required to process media for synthetic and forensic AI analysis.');
      return;
    }
    if (availableCredits < costs[mode] && !isDemoMode) {
      setErrorMessage(`Insufficient LensCredits. This analysis requires ${costs[mode]} LC.`);
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    // If Demo Mode is active: instantaneous illustrative report without deducting credits
    if (isDemoMode) {
      setTimeout(() => {
        setIsAnalyzing(false);
        setAnalysisResult({
          status: 'completed',
          verdict: selectedDemoScenario.verdict,
          risk_score: selectedDemoScenario.riskScore,
          confidence: selectedDemoScenario.confidence,
          risk_level: selectedDemoScenario.riskScore > 70 ? 'high' : 'medium',
          credit_status: 'demo_free',
          result: {
            manipulation_indicators: selectedDemoScenario.indicators,
            lighting_and_visual: selectedDemoScenario.summary,
            synthetic_indicators: [selectedDemoScenario.proposedAiMethodology],
            technical_details: {
              analyzer: 'TruthLens Illustrative Demo Engine (AI Model Inactive)',
              limitations: 'Demonstration simulation for presentation. 0 LC deducted.',
            },
          },
        });
      }, 700);
      return;
    }

    // Live Local Forensics: Guaranteed UUID & submit to Edge for credit deduction
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let activeRequestId = submissionRequestId;
    if (!activeRequestId || !uuidRegex.test(activeRequestId)) {
      activeRequestId = generateUUID();
      setSubmissionRequestId(activeRequestId);
    }

    try {
      const analysisTarget = mode;
      const { data, error } = await submitAnalysisToEdge({
        analysisType: analysisTarget,
        file: selectedFile,
        inputFilePath: uploadResult?.path,
        filePath: uploadResult?.path,
        mediaFile: uploadResult?.path,
        fileName: uploadResult?.fileName,
        fileSizeBytes: uploadResult?.sizeBytes,
        mimeType: uploadResult?.mimeType,
        requestId: activeRequestId,
        idempotencyKey: activeRequestId,
      });

      if (error) {
        setErrorMessage(error.message || 'Analysis request failed.');
      } else if (data) {
        setAnalysisResult(data);
        if (data.wallet) {
          await refreshWallet(data.wallet);
        } else {
          await refreshWallet();
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadDossier = () => {
    if (!analysisResult) return;
    const reportData = {
      project: "TruthLens Multimedia Digital Forensics",
      platform: "OmniScan",
      analysis_id: analysisResult.analysis_id || submissionRequestId,
      modality: mode,
      file_name: uploadResult?.fileName || selectedFile?.name || `${mode}_sample`,
      timestamp: new Date().toISOString(),
      verdict: analysisResult.verdict,
      risk_score: analysisResult.risk_score,
      confidence: analysisResult.confidence,
      risk_level: analysisResult.risk_level,
      indicators: analysisResult.result?.manipulation_indicators || [],
      details: analysisResult.result?.technical_details || {},
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TruthLens_Forensic_Dossier_${mode}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setSelectedFile(null);
    setUploadResult(null);
    setSubmissionRequestId(null);
    setAnalysisResult(null);
    setImageMetrics(null);
    setAudioMetrics(null);
    setVideoMetrics(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <DashboardLayout credits={wallet ? availableCredits : '—'}>
      <div className="flex flex-col w-full px-space-md lg:px-margin pb-space-xl">
        {/* Ambient Radial Glow */}
        <div className="relative w-full">
          <div className="absolute -top-12 left-1/3 w-[600px] h-[280px] bg-gradient-to-r from-secondary-container/15 via-primary-container/20 to-tertiary-container/10 blur-[130px] pointer-events-none -z-10 rounded-full" />

          {/* 1. Header Section */}
          <header className="relative pt-space-lg pb-space-md flex flex-col lg:flex-row lg:items-start lg:justify-between gap-space-md">
            <div className="flex flex-col max-w-2xl">
              <div className="inline-flex items-center gap-space-xs mb-space-xs">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span className="font-label-sm text-label-sm tracking-widest uppercase text-secondary font-semibold text-[11px]">
                  Multi-Modal Forensics Engine
                </span>
              </div>
              <h1 className="font-headline-lg md:font-headline-xl text-headline-lg md:text-headline-xl font-bold text-on-surface tracking-tight">
                OmniScan
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mt-0.5">
                Model-free digital forensics for images, audio, and video with verifiable local telemetry.
              </p>
            </div>

            {/* Mode Controls & Telemetry */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-space-sm self-start lg:self-auto">
              {/* Demo Mode Toggle */}
              <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-full border border-surface-variant/40 shadow-sm">
                <button
                  type="button"
                  onClick={() => setIsDemoMode(false)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    !isDemoMode
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  Live Forensics
                </button>
                <button
                  type="button"
                  onClick={() => setIsDemoMode(true)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                    isDemoMode
                      ? 'bg-tertiary text-on-tertiary shadow-sm'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">bolt</span>
                  <span>Demo Mode (0 LC)</span>
                </button>
              </div>

              {/* Balance Telemetry Pill */}
              <div className="flex items-center gap-space-sm bg-surface-container-low px-space-md py-2.5 rounded-full shadow-sm border border-surface-variant/30">
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
            </div>
          </header>
        </div>

        {/* Demo Mode Advisory Banner */}
        {isDemoMode && (
          <div className="mb-space-md p-space-md rounded-xl bg-tertiary/10 border border-tertiary/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md shadow-md">
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-tertiary text-[24px]">info</span>
              <div>
                <span className="font-bold text-xs uppercase tracking-wider text-tertiary">
                  Illustrative Demo — AI Model Not Connected
                </span>
                <p className="text-body-sm text-on-surface-variant text-xs">
                  Demonstrating proposed AI capabilities using consistent benchmark scenarios. 0 credits deducted.
                </p>
              </div>
            </div>

            {/* Scenario Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-outline font-semibold">Scenario:</span>
              <select
                value={selectedDemoScenario.id}
                onChange={(e) => {
                  const sc = DEMO_SCENARIOS.find((s) => s.id === e.target.value);
                  if (sc) setSelectedDemoScenario(sc);
                }}
                className="bg-surface-container-lowest text-on-surface text-xs font-semibold py-1.5 px-3 rounded-lg border border-surface-variant/40 outline-none cursor-pointer"
              >
                {DEMO_SCENARIOS.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <main className="relative z-10 flex flex-col gap-space-lg w-full max-w-5xl mx-auto">
          {/* 2. Modality Switcher Navigation */}
          <section className="w-full flex justify-center">
            <div className="bg-surface-container-low p-1.5 rounded-full shadow-md flex items-center gap-1.5 border border-surface-variant/40 max-w-xl w-full">
              {(['image', 'audio', 'video'] as MediaMode[]).map((tabMode) => (
                <button
                  key={tabMode}
                  type="button"
                  onClick={() => switchMode(tabMode)}
                  className={`flex-1 flex items-center justify-center gap-space-xs py-2 px-3 rounded-full font-label-md text-label-md transition-all cursor-pointer ${
                    mode === tabMode
                      ? 'bg-primary-container text-on-primary-container shadow-[0_0_20px_rgba(120,59,183,0.35)] font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {tabMode === 'image'
                      ? 'image'
                      : tabMode === 'audio'
                      ? 'graphic_eq'
                      : 'videocam'}
                  </span>
                  <span>{tabMode.charAt(0).toUpperCase() + tabMode.slice(1)}</span>
                </button>
              ))}
            </div>
          </section>

          {/* 3. Upload & Local Staging Card */}
          <section className="bg-surface-container-low rounded-xl p-space-lg shadow-xl border border-surface-variant/40 flex flex-col gap-space-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-xs">
              <div className="flex flex-col">
                <h2 className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight">
                  {mode.charAt(0).toUpperCase() + mode.slice(1)} Forensic Staging
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Upload {mode} to extract local pixel distributions, audio acoustics, or video keyframes.
                </p>
              </div>
              <span className="font-label-sm text-label-sm text-primary font-semibold px-2.5 py-0.5 rounded-full bg-primary-container/20 self-start sm:self-auto">
                Cost: {isDemoMode ? '0 LC (Demo)' : `${costs[mode]} LC`}
              </span>
            </div>

            {/* Drag & Drop File Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`group relative rounded-lg bg-surface-container/60 hover:bg-surface-container p-space-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer border-2 border-dashed ${
                isDragging
                  ? 'border-primary bg-primary-container/20 scale-[0.99]'
                  : 'border-surface-variant/50 hover:border-primary-container'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={fileAccepts[mode]}
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <div className="w-14 h-14 rounded-full bg-surface-container-high group-hover:bg-primary-container text-primary group-hover:text-on-primary-container flex items-center justify-center transition-all shadow-md mb-space-sm">
                <span className="material-symbols-outlined text-[28px]">
                  {isUploading ? 'refresh' : mode === 'audio' ? 'mic' : mode === 'video' ? 'movie' : 'upload_file'}
                </span>
              </div>
              <p className="font-headline-sm text-headline-sm text-on-surface font-medium">
                {isUploading
                  ? `Staging ${mode} file to storage...`
                  : selectedFile
                  ? selectedFile.name
                  : `Drag and drop your ${mode} here`}
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                Supported formats: {fileAccepts[mode].split(',').map((f) => f.split('/')[1]).join(', ').toUpperCase()} (Max {maxSizes[mode].label})
              </p>
              <button
                type="button"
                className="mt-space-md py-2 px-space-md rounded-full bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-md text-label-md font-medium transition-all shadow-sm"
              >
                Browse Local File
              </button>
            </div>

            {/* Dynamic Local Media Previews */}
            {previewUrl && (
              <div className="relative rounded-lg overflow-hidden border border-surface-variant/40 bg-surface-container-lowest p-space-md flex flex-col items-center justify-center">
                {mode === 'image' && (
                  <img src={previewUrl} alt="Preview" className="max-h-72 object-contain rounded-md" />
                )}
                {mode === 'audio' && (
                  <div className="w-full flex flex-col items-center gap-space-sm py-4">
                    <span className="material-symbols-outlined text-primary text-[48px]">waveform</span>
                    <audio controls src={previewUrl} className="w-full max-w-md mt-2" />
                  </div>
                )}
                {mode === 'video' && (
                  <video controls src={previewUrl} className="max-h-72 w-full object-contain rounded-md" />
                )}
              </div>
            )}

            {/* REAL-TIME CLIENT-SIDE TELEMETRY CARDS */}
            {imageMetrics && mode === 'image' && (
              <div className="p-space-md rounded-xl bg-surface-container border border-surface-variant/30 flex flex-col gap-2">
                <span className="font-label-sm text-label-sm font-semibold text-primary uppercase tracking-wider">
                  Live Canvas Pixel Statistics
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2 rounded bg-surface-container-lowest border border-surface-variant/20">
                    <span className="text-[11px] text-outline">Dimensions</span>
                    <p className="font-semibold text-xs text-on-surface">{imageMetrics.width}x{imageMetrics.height} ({imageMetrics.megapixels} MP)</p>
                  </div>
                  <div className="p-2 rounded bg-surface-container-lowest border border-surface-variant/20">
                    <span className="text-[11px] text-outline">Avg Luminance</span>
                    <p className="font-semibold text-xs text-on-surface">{imageMetrics.avgBrightness} / 255 (Contrast: {imageMetrics.contrast})</p>
                  </div>
                  <div className="p-2 rounded bg-surface-container-lowest border border-surface-variant/20">
                    <span className="text-[11px] text-outline">Noise Floor</span>
                    <p className="font-semibold text-xs text-on-surface">Var: {imageMetrics.noiseVariance}</p>
                  </div>
                  <div className="p-2 rounded bg-surface-container-lowest border border-surface-variant/20">
                    <span className="text-[11px] text-outline">Edge Density</span>
                    <p className="font-semibold text-xs text-on-surface">{imageMetrics.edgeDensity}% Laplacian</p>
                  </div>
                </div>
              </div>
            )}

            {audioMetrics && mode === 'audio' && (
              <div className="p-space-md rounded-xl bg-surface-container border border-surface-variant/30 flex flex-col gap-2">
                <span className="font-label-sm text-label-sm font-semibold text-primary uppercase tracking-wider">
                  Live Web Audio Acoustics & Waveform
                </span>
                <div className="w-full h-14 bg-surface-container-lowest rounded flex items-end gap-0.5 p-1 overflow-hidden border border-surface-variant/20">
                  {audioMetrics.waveformData.map((amp, idx) => (
                    <div
                      key={idx}
                      style={{ height: `${Math.max(4, amp * 100)}%` }}
                      className="flex-1 bg-primary/70 rounded-t-sm"
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 rounded bg-surface-container-lowest">
                    <span className="text-[10px] text-outline">Duration</span>
                    <p className="font-semibold text-on-surface">{audioMetrics.durationSeconds}s</p>
                  </div>
                  <div className="p-2 rounded bg-surface-container-lowest">
                    <span className="text-[10px] text-outline">Sample Rate</span>
                    <p className="font-semibold text-on-surface">{audioMetrics.sampleRate} Hz</p>
                  </div>
                  <div className="p-2 rounded bg-surface-container-lowest">
                    <span className="text-[10px] text-outline">RMS Energy</span>
                    <p className="font-semibold text-on-surface">{(audioMetrics.rmsAmplitude * 100).toFixed(1)}%</p>
                  </div>
                  <div className="p-2 rounded bg-surface-container-lowest">
                    <span className="text-[10px] text-outline">Pause Ratio</span>
                    <p className="font-semibold text-on-surface">{audioMetrics.silenceRatioPercent}% silence</p>
                  </div>
                </div>
              </div>
            )}

            {videoMetrics && mode === 'video' && (
              <div className="p-space-md rounded-xl bg-surface-container border border-surface-variant/30 flex flex-col gap-2">
                <span className="font-label-sm text-label-sm font-semibold text-primary uppercase tracking-wider">
                  Extracted 5-Frame Inspection Snapshots
                </span>
                <div className="grid grid-cols-5 gap-2">
                  {videoMetrics.frameThumbnails.map((thumb, idx) => (
                    <div key={idx} className="flex flex-col gap-1">
                      <img src={thumb} alt={`Frame ${idx + 1}`} className="w-full h-16 object-cover rounded border border-surface-variant/30" />
                      <span className="text-[10px] text-outline text-center font-mono">{videoMetrics.frameTimestamps[idx]}s</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-outline mt-1">
                  Inter-frame luminescence delta: {videoMetrics.interFrameDelta} units across keyframe boundaries.
                </p>
              </div>
            )}

            {/* Error Message with Retry */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-error-container/20 border border-error/40 text-error font-label-sm text-label-sm flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">error</span>
                  <span>{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    handleRunAnalysis();
                  }}
                  className="px-3 py-1 rounded-full bg-error/20 hover:bg-error/30 text-error font-medium transition-all text-xs flex items-center gap-1 cursor-pointer flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-[14px]">refresh</span>
                  <span>Retry</span>
                </button>
              </div>
            )}

            {/* Staging Success */}
            {uploadResult && !isUploading && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-label-sm text-label-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  <span>
                    Staged to private storage: <strong className="font-mono text-white">{uploadResult.fileName}</strong> ({(uploadResult.sizeBytes / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold">
                  Storage Staged
                </span>
              </div>
            )}

            {/* Consent Verification */}
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-surface-container/70 border border-surface-variant/40">
              <input
                type="checkbox"
                id="omniscan-consent"
                checked={hasConsent}
                onChange={(e) => setHasConsent(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-outline text-primary focus:ring-primary cursor-pointer accent-primary"
              />
              <label htmlFor="omniscan-consent" className="font-label-sm text-label-sm text-on-surface-variant leading-relaxed cursor-pointer select-none">
                <strong className="text-on-surface font-semibold">Consent & Forensics Disclosure:</strong> I consent to processing this media through TruthLens's forensic engine for metadata consistency, container integrity, and generative synthetic probability estimation.
              </label>
            </div>

            {/* Action Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md pt-space-xs border-t border-surface-variant/30">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-body-sm text-body-sm text-on-surface font-medium">Cost:</span>
                  <span className="font-label-md text-label-md font-bold text-primary">
                    {isDemoMode ? '0 LC (Demo Mode)' : `${costs[mode]} LC`}
                  </span>
                </div>
                <p className="font-label-sm text-label-sm text-outline text-[11px]">
                  {isDemoMode
                    ? 'Illustrative mode active. Zero credits deducted.'
                    : 'Reserved credits settled upon completion or refunded on failure.'}
                </p>
              </div>

              <button
                type="button"
                disabled={!uploadResult || isAnalyzing || isUploading || !hasConsent || (availableCredits < costs[mode] && !isDemoMode)}
                onClick={handleRunAnalysis}
                className="w-full sm:w-auto px-space-xl py-3 rounded-full bg-primary hover:bg-primary/90 text-on-primary font-body-sm text-body-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                    <span>Analyzing Forensics...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">biotech</span>
                    <span>Analyze {mode.charAt(0).toUpperCase() + mode.slice(1)} ({isDemoMode ? '0 LC' : `${costs[mode]} LC`})</span>
                  </>
                )}
              </button>
            </div>
          </section>

          {/* 4. Forensic Results Dossier */}
          {analysisResult ? (
            <section className="bg-surface-container-low rounded-xl p-space-lg shadow-xl border border-primary/40 flex flex-col gap-space-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-space-sm border-b border-surface-variant/30 gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[24px]">verified</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    {mode.charAt(0).toUpperCase() + mode.slice(1)} Forensic Dossier
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {analysisResult.credit_status === 'settled' && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      -{costs[mode]} LC Settled
                    </span>
                  )}
                  {analysisResult.credit_status === 'demo_free' && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-tertiary/20 text-tertiary border border-tertiary/30">
                      Demo Mode (0 LC)
                    </span>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    analysisResult.verdict === 'AI_GENERATED'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : analysisResult.verdict === 'SUSPICIOUS'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : analysisResult.verdict === 'AUTHENTIC'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-surface-variant/40 text-on-surface-variant border border-surface-variant/50'
                  }`}>
                    {analysisResult.verdict || 'INCONCLUSIVE'}
                  </span>
                </div>
              </div>

              {/* Score Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md pt-space-xs">
                <div className="p-space-md rounded-lg bg-surface-container border border-surface-variant/30 flex flex-col justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                    Risk Assessment Score
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-on-surface">
                      {analysisResult.risk_score != null ? `${analysisResult.risk_score}%` : 'Unavailable'}
                    </span>
                    <span className="text-xs text-outline">
                      {analysisResult.risk_score != null
                        ? `${analysisResult.risk_level || 'evaluated'} risk profile`
                        : 'Inconclusive / Raw container'}
                    </span>
                  </div>
                </div>

                <div className="p-space-md rounded-lg bg-surface-container border border-surface-variant/30 flex flex-col justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                    Confidence Calibration
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-secondary">
                      {analysisResult.confidence != null
                        ? `${(Number(analysisResult.confidence) * 100).toFixed(0)}%`
                        : 'Inconclusive'}
                    </span>
                    <span className="text-xs text-outline">
                      {analysisResult.confidence != null ? 'Telemetry calibrated' : 'No synthetic markers'}
                    </span>
                  </div>
                </div>

                <div className="p-space-md rounded-lg bg-surface-container border border-surface-variant/30 flex flex-col justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                    Detection Engine
                  </span>
                  <div className="mt-2 flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-on-surface">
                      {mode === 'image'
                        ? 'Vision Transformer (ViT-Base)'
                        : mode === 'video'
                        ? 'OpenCV + ViT Temporal Analyzer'
                        : 'Acoustic DSP & Vocoder Profiler'}
                    </span>
                    <span className="text-xs text-outline font-mono">
                      {analysisResult.result?.latency_ms != null
                        ? `Latency: ${analysisResult.result.latency_ms} ms`
                        : `${mode.toUpperCase()} Pipeline`}
                    </span>
                  </div>
                </div>
              </div>

              {/* DYNAMIC MODALITY-SPECIFIC TELEMETRY ADAPTERS */}
              {/* Image: Artificial vs Human Probability Breakdown */}
              {mode === 'image' && analysisResult.result?.ai_detection && (
                <div className="p-space-md rounded-lg bg-surface-container border border-surface-variant/30 flex flex-col gap-2">
                  <span className="font-label-sm text-xs font-semibold text-primary uppercase tracking-wider">
                    Model Probability Breakdown (ViT Classification)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                    <div className="p-2.5 rounded bg-surface-container-lowest border border-surface-variant/20 flex flex-col gap-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-red-400">Artificial / AI Generated</span>
                        <strong className="font-mono text-on-surface">
                          {((analysisResult.result.ai_detection.ai_probability ?? 0) * 100).toFixed(1)}%
                        </strong>
                      </div>
                      <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(0, (analysisResult.result.ai_detection.ai_probability ?? 0) * 100))}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-surface-container-lowest border border-surface-variant/20 flex flex-col gap-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-emerald-400">Human / Authentic Photograph</span>
                        <strong className="font-mono text-on-surface">
                          {((analysisResult.result.ai_detection.human_probability ?? 0) * 100).toFixed(1)}%
                        </strong>
                      </div>
                      <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(0, (analysisResult.result.ai_detection.human_probability ?? 0) * 100))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Video: OpenCV Keyframe Temporal Assessment */}
              {mode === 'video' && analysisResult.result?.video_telemetry && (
                <div className="p-space-md rounded-lg bg-surface-container border border-surface-variant/30 flex flex-col gap-2">
                  <span className="font-label-sm text-xs font-semibold text-primary uppercase tracking-wider">
                    OpenCV Temporal Decoded Telemetry
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2 rounded bg-surface-container-lowest">
                      <span className="text-[10px] text-outline">Resolution</span>
                      <p className="font-semibold text-on-surface">
                        {analysisResult.result.video_telemetry.width}x{analysisResult.result.video_telemetry.height}
                      </p>
                    </div>
                    <div className="p-2 rounded bg-surface-container-lowest">
                      <span className="text-[10px] text-outline">FPS / Frames</span>
                      <p className="font-semibold text-on-surface">
                        {analysisResult.result.video_telemetry.fps} FPS ({analysisResult.result.video_telemetry.total_frames})
                      </p>
                    </div>
                    <div className="p-2 rounded bg-surface-container-lowest">
                      <span className="text-[10px] text-outline">Duration</span>
                      <p className="font-semibold text-on-surface">
                        {analysisResult.result.video_telemetry.duration_seconds}s
                      </p>
                    </div>
                    <div className="p-2 rounded bg-surface-container-lowest">
                      <span className="text-[10px] text-outline">Keyframes Sampled</span>
                      <p className="font-semibold text-on-surface">
                        {analysisResult.result.video_telemetry.sampled_keyframes} frames
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Audio: Acoustic DSP Telemetry */}
              {mode === 'audio' && analysisResult.result?.audio_telemetry && (
                <div className="p-space-md rounded-lg bg-surface-container border border-surface-variant/30 flex flex-col gap-2">
                  <span className="font-label-sm text-xs font-semibold text-primary uppercase tracking-wider">
                    SoundFile Acoustic DSP Telemetry
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2 rounded bg-surface-container-lowest">
                      <span className="text-[10px] text-outline">Sample Rate</span>
                      <p className="font-semibold text-on-surface">
                        {analysisResult.result.audio_telemetry.sample_rate} Hz
                      </p>
                    </div>
                    <div className="p-2 rounded bg-surface-container-lowest">
                      <span className="text-[10px] text-outline">Duration</span>
                      <p className="font-semibold text-on-surface">
                        {analysisResult.result.audio_telemetry.duration_seconds}s
                      </p>
                    </div>
                    <div className="p-2 rounded bg-surface-container-lowest">
                      <span className="text-[10px] text-outline">RMS Dynamic Energy</span>
                      <p className="font-semibold text-on-surface">
                        {((analysisResult.result.audio_telemetry.rms_energy ?? 0) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-2 rounded bg-surface-container-lowest">
                      <span className="text-[10px] text-outline">Spectral Centroid</span>
                      <p className="font-semibold text-on-surface">
                        {analysisResult.result.audio_telemetry.spectral_centroid_hz} Hz
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Manipulation Indicators */}
              <div className="p-space-md rounded-lg bg-surface-container border border-surface-variant/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">search_check</span>
                  <h4 className="font-headline-sm text-sm font-semibold text-on-surface">
                    Observed Indicators & Telemetry
                  </h4>
                </div>
                {analysisResult.result?.manipulation_indicators && analysisResult.result.manipulation_indicators.length > 0 ? (
                  <ul className="list-disc list-inside text-xs text-on-surface-variant space-y-1">
                    {analysisResult.result.manipulation_indicators.map((ind: string, idx: number) => (
                      <li key={idx} className="leading-relaxed">{ind}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-on-surface-variant">No explicit manipulation flags detected in container markers.</p>
                )}
              </div>

              {/* Model Limitations Advisory */}
              {analysisResult.result?.technical_details?.limitations && (
                <div className="p-3 rounded-lg bg-surface-container-lowest border border-surface-variant/30 text-xs text-outline flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-outline flex-shrink-0 mt-0.5">lightbulb</span>
                  <p>
                    <strong className="text-on-surface-variant">Model Limitations: </strong>
                    {analysisResult.result.technical_details.limitations}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-space-sm pt-space-sm border-t border-surface-variant/30">
                <button
                  type="button"
                  onClick={handleDownloadDossier}
                  className="px-space-md py-2 rounded-full bg-primary hover:bg-primary/90 text-on-primary text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>Download Forensic Report</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-space-md py-2 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-all cursor-pointer"
                >
                  Analyze Another File
                </button>
              </div>
            </section>
          ) : (
            <section className="bg-surface-container-low rounded-xl p-space-xl flex flex-col items-center justify-center text-center shadow-md border border-surface-variant/30">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-outline mb-space-md">
                <span className="material-symbols-outlined text-[32px]">analytics</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                {uploadResult ? 'Upload Complete — Ready to Analyze' : `Upload a ${mode} to begin.`}
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md mt-1">
                {uploadResult
                  ? `Your ${mode} has been verified and stored in encrypted private storage. Confirm consent and click Analyze ${mode.charAt(0).toUpperCase() + mode.slice(1)}.`
                  : `Select or drop a ${mode} file above to assess potential AI generation, manipulation anomalies, and container metadata.`}
              </p>
            </section>
          )}

          {/* Mandatory Regulatory Disclaimer */}
          <div className="bg-surface-container rounded-DEFAULT p-space-md flex items-start gap-space-sm text-outline border border-surface-variant/40">
            <span className="material-symbols-outlined text-[20px] text-outline flex-shrink-0 mt-0.5">info</span>
            <p className="font-label-sm text-label-sm leading-relaxed text-outline">
              <strong className="text-on-surface-variant font-semibold">Mandatory Forensic Disclaimer:</strong> Model-free assessments are informational. These findings evaluate container headers, pixel distributions, and acoustics, but do not constitute definitive proof of authenticity or manipulation. Results should be corroborated with source provenance.
            </p>
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
};
