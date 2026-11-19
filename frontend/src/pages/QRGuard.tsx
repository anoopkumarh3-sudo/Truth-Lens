import React, { useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { uploadMedia, UploadResult } from '../services/storageService';
import { submitAnalysisToEdge, generateUUID } from '../services/analysisService';
import { decodeQrCodeLocally, UrlForensicsResult } from '../utils/forensics';

export const QRGuard: React.FC = () => {
  const { user, wallet, availableCredits, refreshWallet } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [decodedPayload, setDecodedPayload] = useState<string | null>(null);
  const [payloadType, setPayloadType] = useState<string>('Unknown');
  const [heuristics, setHeuristics] = useState<UrlForensicsResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDecoding, setIsDecoding] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [backendSettled, setBackendSettled] = useState(false);

  const cost = 10;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setUploadResult(null);
    setDecodedPayload(null);
    setHeuristics(null);
    setBackendSettled(false);

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      if (!user) {
        setErrorMessage('Authentication required to upload files.');
        return;
      }

      if (availableCredits < cost) {
        setErrorMessage(`Insufficient LensCredits. QRGuard requires ${cost} LC, but you have ${availableCredits} LC.`);
        return;
      }

      setIsUploading(true);
      try {
        const { data, error } = await uploadMedia(file, user.id, 'qrguard');
        if (error) {
          setErrorMessage(error.message);
        } else if (data) {
          setUploadResult(data);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Error uploading QR image.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDecode = async () => {
    if (!selectedFile || !uploadResult) {
      setErrorMessage('Please upload a QR code image first.');
      return;
    }

    if (availableCredits < cost) {
      setErrorMessage(`Insufficient LensCredits. QRGuard requires ${cost} LC.`);
      return;
    }

    setIsDecoding(true);
    setErrorMessage(null);

    try {
      // 1. Decode locally via native BarcodeDetector or canvas fallback
      const decoded = await decodeQrCodeLocally(selectedFile);
      setDecodedPayload(decoded.decodedText);
      setPayloadType(decoded.contentType);
      setHeuristics(decoded.heuristics || null);

      // 2. Submit to backend to deduct 10 LC
      const reqId = generateUUID();
      const { data, error } = await submitAnalysisToEdge({
        analysisType: 'qrguard',
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
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error decoding QR image.');
    } finally {
      setIsDecoding(false);
    }
  };

  const handleCopy = () => {
    if (!decodedPayload) return;
    navigator.clipboard.writeText(decodedPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setErrorMessage(null);
    setDecodedPayload(null);
    setHeuristics(null);
    setBackendSettled(false);
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
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-label-sm text-label-sm tracking-widest uppercase text-secondary font-semibold text-[11px]">
                  Optoelectronic Threat Assessment
                </span>
              </div>
              <h1 className="font-headline-lg md:font-headline-xl text-headline-lg md:text-headline-xl font-bold text-on-surface tracking-tight">
                QRGuard
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mt-0.5">
                Decode QR codes locally and assess potentially unsafe destinations without auto-navigating.
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

        {/* 2. Upload Section */}
        <section className="bg-surface-container-low p-space-lg rounded-xl flex flex-col gap-space-md shadow-md mb-space-lg border border-surface-variant/30 max-w-4xl mx-auto w-full">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight">
                Decode & Assess QR Code
              </h2>
              <span className="font-label-sm text-label-sm text-primary font-semibold px-2.5 py-0.5 rounded-full bg-primary-container/20">
                Cost: {cost} LC
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Upload a QR code image to decode its destination safely in an isolated sandbox. Never automatically opens the destination.
            </p>
          </div>

          <label className="group relative rounded-lg bg-surface-container/60 hover:bg-surface-container p-space-lg flex flex-col items-center justify-center text-center transition-all cursor-pointer border-2 border-dashed border-surface-variant/50 hover:border-primary-container">
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading || isDecoding}
            />
            <div className="w-14 h-14 rounded-full bg-surface-container-high group-hover:bg-primary-container text-primary group-hover:text-on-primary-container flex items-center justify-center transition-all shadow-md mb-space-sm">
              <span className="material-symbols-outlined text-[28px]">
                {isUploading ? 'refresh' : 'qr_code_scanner'}
              </span>
            </div>
            <p className="font-headline-sm text-headline-sm text-on-surface font-medium">
              {isUploading
                ? 'Uploading file...'
                : selectedFile
                ? selectedFile.name
                : 'Drag and drop your QR code image here'}
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Supports PNG, JPG, WEBP, or scanned documentation (Max 10 MB)
            </p>
            <span className="mt-space-md py-2 px-space-md rounded-full bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-md text-label-md font-medium transition-all shadow-sm">
              Browse QR Image
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
          {uploadResult && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-label-sm text-label-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                <span>
                  QR image staged: <strong className="font-mono text-white">{uploadResult.fileName}</strong>
                </span>
              </div>
              <button
                type="button"
                disabled={isDecoding}
                onClick={handleDecode}
                className="px-space-md py-2 rounded-full bg-primary hover:bg-primary/90 text-on-primary font-semibold text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isDecoding ? 'refresh' : 'qr_code_2'}
                </span>
                <span>{isDecoding ? 'Decoding Payload...' : `Decode & Assess (${cost} LC)`}</span>
              </button>
            </div>
          )}
        </section>

        {/* 3. Empty State or Forensic Results Dossier */}
        {!decodedPayload ? (
          <div className="bg-surface-container-low p-space-xl rounded-xl border border-surface-variant/30 flex flex-col items-center justify-center text-center py-16 max-w-4xl mx-auto w-full shadow-md">
            <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center mb-4 text-outline border border-surface-variant/30">
              <span className="material-symbols-outlined text-[28px]">qr_code_2</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface mb-2">
              {uploadResult ? 'Upload Complete — Ready for Sandbox Decoding' : 'Upload a QR code to begin decoding.'}
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md">
              Safe sandbox decoding without automated browser navigation. Decoded URLs are evaluated against WebSentinel phishing rules.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-space-lg max-w-4xl mx-auto w-full">
            {/* Decoded Target Terminal Box */}
            <div className="bg-surface-container-low p-space-lg rounded-xl border border-surface-variant/30 shadow-md flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                    SECTION A • DECODED DESTINATION PAYLOAD
                  </span>
                  <span className="py-0.5 px-2 rounded font-label-sm text-[11px] bg-primary/20 text-primary font-semibold">
                    TYPE: {payloadType.toUpperCase()}
                  </span>
                  <span className="py-0.5 px-2 rounded font-label-sm text-[11px] bg-error-container text-on-error-container font-semibold">
                    INERT PAYLOAD
                  </span>
                  {backendSettled && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                      -10 LC SETTLED
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container hover:bg-surface-bright text-on-surface font-label-sm text-label-sm transition-colors border border-surface-variant/40 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  <span>{copied ? 'Copied!' : 'Copy Destination'}</span>
                </button>
              </div>

              <div className="bg-surface-container-lowest p-space-md rounded-DEFAULT font-mono text-body-sm text-on-surface break-all select-all shadow-inner space-y-2 border border-surface-variant/20">
                <p className="text-secondary font-medium">{decodedPayload}</p>
              </div>
            </div>

            {/* If URL, show embedded WebSentinel Heuristics */}
            {heuristics && (
              <div className="p-space-lg rounded-xl bg-surface-container-low border border-surface-variant/30 flex flex-col gap-space-md shadow-md">
                <div className="flex items-center justify-between">
                  <h4 className="font-headline-sm text-headline-sm font-semibold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">shield</span>
                    <span>Decoded Destination Risk Assessment</span>
                  </h4>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    heuristics.riskCategory === 'Critical' || heuristics.riskCategory === 'High'
                      ? 'bg-error/20 text-error'
                      : heuristics.riskCategory === 'Medium'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {heuristics.riskCategory.toUpperCase()} RISK ({heuristics.riskScore}/100)
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-surface-variant/20">
                    <span className="text-[11px] text-outline">Protocol</span>
                    <p className={`font-semibold text-sm ${heuristics.isHttps ? 'text-emerald-400' : 'text-error'}`}>
                      {heuristics.protocol.toUpperCase().replace(':', '')}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-surface-variant/20">
                    <span className="text-[11px] text-outline">Target Host</span>
                    <p className="font-semibold text-sm text-on-surface truncate">{heuristics.domain}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-surface-variant/20">
                    <span className="text-[11px] text-outline">Shortener Mask</span>
                    <p className="font-semibold text-sm text-on-surface">{heuristics.isShortener ? 'Yes' : 'No'}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-container-lowest border border-surface-variant/20">
                    <span className="text-[11px] text-outline">Direct IP</span>
                    <p className="font-semibold text-sm text-on-surface">{heuristics.isIpAddress ? 'Yes' : 'No'}</p>
                  </div>
                </div>

                <ul className="space-y-1.5 mt-2">
                  {heuristics.triggeredConditions.map((cond, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-body-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">
                        check_circle
                      </span>
                      <span>{cond}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Bar */}
            <footer className="flex flex-wrap items-center justify-between gap-space-md pt-space-xs pb-space-xl border-t border-surface-variant/30">
              <button
                type="button"
                onClick={handleReset}
                className="px-space-md py-2 rounded-full font-label-md text-label-md font-medium text-outline hover:text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2 border border-surface-variant/40 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                <span>New QR Analysis</span>
              </button>
            </footer>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
