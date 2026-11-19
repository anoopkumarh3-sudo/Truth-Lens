import React, { useState } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { submitAnalysisToEdge, generateUUID } from '../services/analysisService';
import { analyzeUrlLocally, UrlForensicsResult } from '../utils/forensics';

export const WebSentinel: React.FC = () => {
  const { wallet, availableCredits, refreshWallet } = useAuth();
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<UrlForensicsResult | null>(null);
  const [backendSettled, setBackendSettled] = useState(false);
  const cost = 20;

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setErrorMessage('Please enter a website URL.');
      return;
    }

    if (availableCredits < cost) {
      setErrorMessage(`Insufficient LensCredits. WebSentinel requires ${cost} LC, but you have ${availableCredits} LC.`);
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setBackendSettled(false);

    try {
      // 1. Run local heuristic evaluation
      const localAnalysis = analyzeUrlLocally(url.trim());
      setResult(localAnalysis);

      // 2. Submit to backend for atomic wallet credit deduction (20 LC)
      const reqId = generateUUID();
      const { data, error } = await submitAnalysisToEdge({
        analysisType: 'websentinel',
        inputUrl: localAnalysis.url,
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
      setErrorMessage(err.message || 'Error assessing website.');
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
        {/* Ambient Glow */}
        <div className="relative w-full">
          <div className="absolute -top-12 left-1/3 w-[600px] h-[280px] bg-gradient-to-r from-secondary-container/15 via-primary-container/20 to-tertiary-container/10 blur-[130px] pointer-events-none -z-10 rounded-full" />

          {/* 1. Header Section */}
          <header className="relative pt-space-lg pb-space-md flex flex-col lg:flex-row lg:items-start lg:justify-between gap-space-md">
            <div className="flex flex-col max-w-2xl">
              <div className="inline-flex items-center gap-space-xs mb-space-xs">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-label-sm text-label-sm tracking-widest uppercase text-secondary font-semibold text-[11px]">
                  Passive URL Risk Analysis
                </span>
              </div>
              <h1 className="font-headline-lg md:font-headline-xl text-headline-lg md:text-headline-xl font-bold text-on-surface tracking-tight">
                WebSentinel
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mt-0.5">
                Assess websites for phishing indicators and potential security risks using local risk signals.
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

        {/* 2. Input Section */}
        <section className="bg-surface-container-low p-space-lg rounded-xl flex flex-col gap-space-md shadow-md mb-space-lg border border-surface-variant/30 max-w-4xl mx-auto w-full">
          <div className="flex flex-col gap-space-xs">
            <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="website-url">
              Website URL to Assess
            </label>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Enter a complete domain or URL. Passive assessment evaluates external heuristics without auto-navigating.
            </p>
          </div>

          <div className="relative flex items-center">
            <span className="material-symbols-outlined text-outline absolute left-space-md text-[20px] pointer-events-none">
              public
            </span>
            <input
              id="website-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isAnalyzing && handleAnalyze()}
              placeholder="https://example-domain.com/path"
              className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-md text-body-md rounded-full py-3 pl-12 pr-12 border border-surface-variant/40 focus:border-primary-container outline-none transition-all"
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

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-error-container/20 border border-error/40 text-error font-label-sm text-label-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md pt-space-xs border-t border-surface-variant/20">
            <div className="flex items-center gap-space-xs text-on-surface font-label-md text-label-md">
              <span className="material-symbols-outlined text-primary text-[18px]">toll</span>
              <span>
                Cost per analysis: <strong className="text-primary font-bold">{cost} LC</strong>
              </span>
            </div>

            <button
              type="button"
              disabled={isAnalyzing || !url.trim()}
              onClick={handleAnalyze}
              className="px-space-lg py-2.5 bg-primary hover:bg-primary/90 text-on-primary rounded-full font-label-md text-label-md font-semibold flex items-center justify-center gap-space-xs shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isAnalyzing ? 'refresh' : 'shield'}
              </span>
              <span>{isAnalyzing ? 'Analyzing Heuristics...' : `Analyze Website (${cost} LC)`}</span>
            </button>
          </div>
        </section>

        {/* 3. Empty State or Forensic Dossier */}
        {!result ? (
          <div className="bg-surface-container-low p-space-xl rounded-xl border border-surface-variant/30 flex flex-col items-center justify-center text-center py-16 max-w-4xl mx-auto w-full shadow-md">
            <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center mb-4 text-outline border border-surface-variant/30">
              <span className="material-symbols-outlined text-[28px]">travel_explore</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface mb-2">
              Enter a website URL to begin.
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md">
              Passive phishing indicators, domain structure, homoglyphs, and SSL risk assessment executed locally without opening remote pages.
            </p>
          </div>
        ) : (
          <section className="flex flex-col gap-space-lg max-w-4xl mx-auto w-full">
            {/* Risk Banner */}
            <div className={`p-space-lg rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md shadow-md ${
              result.riskCategory === 'Critical' || result.riskCategory === 'High'
                ? 'bg-error-container/20 border-error/40 text-on-surface'
                : result.riskCategory === 'Medium'
                ? 'bg-amber-500/10 border-amber-500/30 text-on-surface'
                : 'bg-emerald-500/10 border-emerald-500/30 text-on-surface'
            }`}>
              <div className="flex items-center gap-space-md">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${
                  result.riskCategory === 'Critical' || result.riskCategory === 'High'
                    ? 'bg-error'
                    : result.riskCategory === 'Medium'
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}>
                  <span className="material-symbols-outlined text-[24px]">
                    {result.riskCategory === 'Low' ? 'verified_user' : 'warning'}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                      THREAT VERDICT
                    </span>
                    {backendSettled && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                        -20 LC SETTLED
                      </span>
                    )}
                  </div>
                  <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                    {result.riskCategory.toUpperCase()} RISK (Score: {result.riskScore}/100)
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-body-sm text-outline truncate max-w-xs">{result.domain}</span>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-bright text-on-surface text-xs font-medium border border-surface-variant/40"
                >
                  New Scan
                </button>
              </div>
            </div>

            {/* Heuristics Telemetry Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm">
              <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-variant/30 flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-outline">Protocol</span>
                <span className={`font-headline-sm text-headline-sm font-bold ${result.isHttps ? 'text-emerald-400' : 'text-error'}`}>
                  {result.protocol.toUpperCase().replace(':', '')}
                </span>
                <span className="text-[11px] text-outline">{result.isHttps ? 'TLS Encrypted' : 'Insecure HTTP'}</span>
              </div>

              <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-variant/30 flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-outline">Subdomains</span>
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {result.subdomainsCount}
                </span>
                <span className="text-[11px] text-outline">{result.subdomainsCount > 2 ? 'High Subdomain Count' : 'Standard Host'}</span>
              </div>

              <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-variant/30 flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-outline">Destination Type</span>
                <span className={`font-headline-sm text-headline-sm font-bold ${result.isIpAddress ? 'text-error' : 'text-on-surface'}`}>
                  {result.isIpAddress ? 'Direct IP' : 'Domain FQDN'}
                </span>
                <span className="text-[11px] text-outline">{result.isShortener ? 'Shortener Masked' : 'Direct Target'}</span>
              </div>

              <div className="p-space-md rounded-xl bg-surface-container-low border border-surface-variant/30 flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-outline">Length</span>
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {result.urlLength} ch
                </span>
                <span className="text-[11px] text-outline">{result.urlLength > 75 ? 'Excessive Length' : 'Normal Length'}</span>
              </div>
            </div>

            {/* Triggered Conditions */}
            <div className="p-space-lg rounded-xl bg-surface-container-low border border-surface-variant/30 flex flex-col gap-space-sm shadow-sm">
              <h4 className="font-headline-sm text-headline-sm font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">checklist</span>
                <span>Observed Heuristic Indicators</span>
              </h4>
              <ul className="space-y-2 mt-2">
                {result.triggeredConditions.map((cond, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-body-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">
                      check_circle
                    </span>
                    <span>{cond}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Precautions */}
            <div className="p-space-lg rounded-xl bg-surface-container-low border border-surface-variant/30 flex flex-col gap-space-sm shadow-sm">
              <h4 className="font-headline-sm text-headline-sm font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400 text-[20px]">security</span>
                <span>Recommended Precautions</span>
              </h4>
              <ul className="space-y-2 mt-2">
                {result.recommendedPrecautions.map((prec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-body-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-amber-400 shrink-0 mt-0.5">
                      arrow_right
                    </span>
                    <span>{prec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
};
