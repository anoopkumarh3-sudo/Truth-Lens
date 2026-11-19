import React, { useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { submitAnalysisToEdge, generateUUID } from '../services/analysisService';
import { analyzeSocialLinkLocally, SocialLinkResult } from '../utils/forensics';

type PlatformType = 'youtube' | 'instagram';

export const LinkLens: React.FC = () => {
  const { wallet, availableCredits, refreshWallet } = useAuth();
  const [platform, setPlatform] = useState<PlatformType>('youtube');
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<SocialLinkResult | null>(null);
  const [backendSettled, setBackendSettled] = useState(false);
  const cost = 15;

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setErrorMessage('Please enter a social media URL.');
      return;
    }

    if (availableCredits < cost) {
      setErrorMessage(`Insufficient LensCredits. LinkLens requires ${cost} LC, but you have ${availableCredits} LC.`);
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setBackendSettled(false);

    try {
      const localResult = analyzeSocialLinkLocally(url.trim(), platform);
      setResult(localResult);

      const reqId = generateUUID();
      const { data, error } = await submitAnalysisToEdge({
        analysisType: 'linklens',
        inputUrl: localResult.url,
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
      setErrorMessage(err.message || 'Error parsing social media link.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setUrl('');
    setResult(null);
    setErrorMessage(null);
    setBackendSettled(false);
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
                  Social Media Ingest & Forensic Probe
                </span>
              </div>
              <h1 className="font-headline-lg md:font-headline-xl text-headline-lg md:text-headline-xl font-bold text-on-surface tracking-tight">
                LinkLens
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mt-0.5">
                Analyze public YouTube and Instagram links for tracker parameters, embedability, and container structure.
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

        {/* 2. Platform Selector Tabs */}
        <section className="relative z-10 w-full flex justify-center my-space-md">
          <div className="w-full max-w-xl bg-surface-container-low p-1.5 rounded-full shadow-md flex items-center gap-1.5 border border-surface-variant/40">
            <button
              onClick={() => { setPlatform('youtube'); setResult(null); }}
              className={`flex-1 flex items-center justify-center gap-space-sm py-2 px-4 rounded-full transition-all cursor-pointer ${
                platform === 'youtube'
                  ? 'bg-primary-container text-on-primary-container shadow-[0_0_20px_rgba(120,59,183,0.35)] font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">smart_display</span>
              <span className="font-label-md text-label-md">YouTube Video</span>
            </button>
            <button
              onClick={() => { setPlatform('instagram'); setResult(null); }}
              className={`flex-1 flex items-center justify-center gap-space-sm py-2 px-4 rounded-full transition-all cursor-pointer ${
                platform === 'instagram'
                  ? 'bg-primary-container text-on-primary-container shadow-[0_0_20px_rgba(120,59,183,0.35)] font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">photo_camera</span>
              <span className="font-label-md text-label-md">Instagram Post</span>
            </button>
          </div>
        </section>

        {/* 3. Link Input Box */}
        <section className="relative z-10 w-full max-w-4xl mx-auto flex flex-col gap-space-lg mb-space-lg">
          <div className="bg-surface-container-low rounded-xl p-space-lg flex flex-col gap-space-md shadow-xl border border-surface-variant/40">
            <div className="flex flex-col gap-1">
              <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="linkInput">
                Enter {platform === 'youtube' ? 'YouTube Video URL' : 'Instagram Post URL'}
              </label>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Analyze public YouTube video or authorized Instagram post. Platform access limits apply.
              </p>
            </div>

            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-space-md text-outline pointer-events-none text-[22px]">
                link
              </span>
              <input
                id="linkInput"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isAnalyzing && handleAnalyze()}
                placeholder={
                  platform === 'youtube'
                    ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    : 'https://www.instagram.com/p/CzX9y...'
                }
                className="w-full h-13 pl-12 pr-12 rounded-full bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-md text-body-md border border-surface-variant/40 focus:border-primary-container outline-none transition-all py-3"
              />
              {url && (
                <button
                  type="button"
                  onClick={() => setUrl('')}
                  className="absolute right-4 text-outline hover:text-on-surface p-1"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-error-container/20 border border-error/40 text-error font-label-sm text-label-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md pt-space-xs border-t border-surface-variant/20">
              <div className="flex items-center gap-space-md text-on-surface-variant font-label-md text-label-md">
                <span className="flex items-center gap-1.5 text-on-surface">
                  <span className="material-symbols-outlined text-primary text-[18px]">toll</span>
                  Analysis Cost: <strong className="text-primary font-bold">{cost} LC</strong>
                </span>
                <span className="text-surface-variant">•</span>
                <span className="text-outline text-xs">Deterministic Platform Probe</span>
              </div>
              <button
                type="button"
                disabled={isAnalyzing || !url.trim()}
                onClick={handleAnalyze}
                className="inline-flex items-center justify-center gap-space-sm px-space-lg py-3 rounded-full bg-primary hover:bg-primary/90 text-on-primary font-headline-sm font-semibold text-[15px] cursor-pointer shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {isAnalyzing ? 'refresh' : 'radar'}
                </span>
                <span>{isAnalyzing ? 'Inspecting Link...' : `Analyze Link (${cost} LC)`}</span>
              </button>
            </div>
          </div>

          {/* Result Dossier or Empty State */}
          {!result ? (
            <div className="bg-surface-container-low rounded-xl p-space-xl flex flex-col items-center justify-center text-center shadow-md border border-surface-variant/30">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-outline mb-space-md">
                <span className="material-symbols-outlined text-[32px]">hub</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Enter a URL to begin.
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md mt-1">
                Provide a valid YouTube or Instagram link above. Metadata, creator provenance, and spectral coherence dossiers will appear once external API integrations are configured.
              </p>
            </div>
          ) : (
            <section className="flex flex-col gap-space-lg">
              {/* Media Card */}
              <div className="p-space-lg rounded-xl bg-surface-container-low border border-surface-variant/40 shadow-md flex flex-col md:flex-row gap-space-lg items-center">
                {result.previewThumbnailUrl ? (
                  <img
                    src={result.previewThumbnailUrl}
                    alt="Social preview thumbnail"
                    className="w-full md:w-64 h-40 object-cover rounded-lg border border-surface-variant/40 shadow"
                  />
                ) : (
                  <div className="w-full md:w-64 h-40 rounded-lg bg-surface-container flex items-center justify-center text-outline border border-surface-variant/40">
                    <span className="material-symbols-outlined text-[48px]">
                      {platform === 'youtube' ? 'smart_display' : 'photo_camera'}
                    </span>
                  </div>
                )}

                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary font-semibold text-xs uppercase">
                      {result.platform.toUpperCase()} ASSET
                    </span>
                    {backendSettled && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                        -15 LC SETTLED
                      </span>
                    )}
                  </div>
                  <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                    Asset ID: {result.contentId || 'Generic Feed Target'}
                  </h3>
                  <p className="font-mono text-body-sm text-outline break-all">{result.url}</p>

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-3 py-1 rounded-full bg-surface-container hover:bg-surface-bright text-on-surface text-xs font-medium border border-surface-variant/40"
                    >
                      New Probe
                    </button>
                  </div>
                </div>
              </div>

              {/* Observed Platform Indicators */}
              <div className="p-space-lg rounded-xl bg-surface-container-low border border-surface-variant/30 flex flex-col gap-space-sm shadow-sm">
                <h4 className="font-headline-sm text-headline-sm font-semibold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">checklist</span>
                  <span>Observed Link Structure & Telemetry</span>
                </h4>
                <ul className="space-y-2 mt-2">
                  {result.platformIndicators.map((ind, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-body-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">
                        check_circle
                      </span>
                      <span>{ind}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Technical Limitations Disclosure */}
              <div className="p-space-md rounded-xl bg-surface-container-lowest border border-surface-variant/30 text-outline text-body-sm space-y-1">
                <span className="font-label-sm font-semibold uppercase text-secondary">
                  Transparent Inspection Disclosure:
                </span>
                {result.limitations.map((lim, idx) => (
                  <p key={idx} className="text-xs">• {lim}</p>
                ))}
              </div>
            </section>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};
