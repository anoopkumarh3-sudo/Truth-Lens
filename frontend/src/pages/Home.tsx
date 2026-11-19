import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { getUserAnalyses } from '../services/analysisService';
import { Analysis } from '../types/database';

export const Home: React.FC = () => {
  const { user, profile, wallet, availableCredits } = useAuth();
  const [recentAnalyses, setRecentAnalyses] = useState<Analysis[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    setLoadingHistory(true);

    getUserAnalyses(user.id).then(({ data }) => {
      if (isMounted) {
        setRecentAnalyses(data.slice(0, 3));
        setLoadingHistory(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Authentication Integration Pending';

  return (
    <DashboardLayout credits={wallet ? availableCredits : '—'}>
      <div className="flex flex-col w-full px-space-md lg:px-margin pb-space-xl">
        {/* Subtle Ethereal Ambient Glow */}
        <div className="relative w-full">
          <div className="absolute -top-12 left-1/4 w-[540px] h-[280px] bg-gradient-to-r from-secondary-container/20 via-primary-container/25 to-tertiary-container/15 blur-[120px] pointer-events-none -z-10 rounded-full" />

          {/* Welcome Header Section */}
          <section className="relative pt-space-lg pb-space-xl flex flex-col md:flex-row md:items-start md:justify-between gap-space-lg">
            <div className="flex flex-col max-w-3xl">
              <div className="inline-flex items-center gap-space-xs mb-space-sm">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="font-label-sm text-label-sm tracking-widest uppercase text-secondary font-semibold text-[11px]">
                  Enterprise Forensics Gateway
                </span>
              </div>
              <h1 className="font-headline-lg md:font-headline-xl text-headline-lg md:text-headline-xl font-bold text-on-surface tracking-tight">
                Welcome back, {displayName}.
              </h1>
              <p className="mt-space-xs font-body-md text-body-md text-on-surface-variant leading-relaxed max-w-2xl">
                Ready for assessment. Select a forensic AI module or review your verification history.
              </p>
            </div>

            {/* Global System Telemetry Pill */}
            <div className="flex items-center gap-space-sm p-space-sm rounded-DEFAULT bg-surface-container border border-surface-variant/40 shadow-sm shrink-0 self-start">
              <div className="w-7 h-7 rounded-full bg-primary-container/40 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[18px]">toll</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm font-bold text-on-surface tracking-tight">
                  {wallet ? `${availableCredits} LC Available` : '— LC Available'}
                </span>
                <span className="font-label-sm text-label-sm text-outline text-[10px] leading-tight">
                  {wallet ? 'Live Database Balance' : 'Wallet Syncing...'}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Core AI Tools Section */}
        <section className="flex flex-col gap-space-lg pt-space-sm">
          <div className="flex flex-col">
            <h2 className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight">
              Explore AI Tools
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Choose a tool to begin your digital verification.
            </p>
          </div>

          {/* AI Tools Bento-Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
            {/* Card 01: OmniScan */}
            <div className="group relative flex flex-col justify-between p-space-lg bg-surface-container rounded-lg shadow-sm border border-surface-variant/30 hover:border-primary-container transition-all duration-300">
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-space-md">
                  <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors duration-200">
                    <span className="material-symbols-outlined text-[24px]">document_scanner</span>
                  </div>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline px-2.5 py-1 rounded-full bg-surface-container-lowest">
                    Multi-Modal
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">OmniScan</h3>
                <p className="mt-space-xs font-body-sm text-body-sm text-on-surface-variant/90 leading-relaxed min-h-[48px]">
                  Assess potentially manipulated images, cloned voices, and deepfake videos in one unified workspace.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-space-md">
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high font-label-sm text-label-sm text-on-surface-variant/90 text-[11px]">
                    Image (5 LC)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high font-label-sm text-label-sm text-on-surface-variant/90 text-[11px]">
                    Audio (10 LC)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high font-label-sm text-label-sm text-on-surface-variant/90 text-[11px]">
                    Video (20 LC)
                  </span>
                </div>
              </div>
              <div className="pt-space-lg mt-space-sm">
                <Link
                  to="/omniscan"
                  className="w-full flex items-center justify-center gap-space-xs py-2 px-space-md rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold hover:bg-primary hover:text-on-primary transition-all duration-200"
                >
                  <span>Open OmniScan</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            </div>

            {/* Card 02: LinkLens */}
            <div className="group relative flex flex-col justify-between p-space-lg bg-surface-container rounded-lg shadow-sm border border-surface-variant/30 hover:border-primary-container transition-all duration-300">
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-space-md">
                  <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors duration-200">
                    <span className="material-symbols-outlined text-[24px]">link</span>
                  </div>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline px-2.5 py-1 rounded-full bg-surface-container-lowest">
                    Social Probe
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">LinkLens</h3>
                <p className="mt-space-xs font-body-sm text-body-sm text-on-surface-variant/90 leading-relaxed min-h-[48px]">
                  Assess supported social media content for suspicious indicators and available digital evidence.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-space-md">
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high font-label-sm text-label-sm text-on-surface-variant/90 text-[11px]">
                    YouTube
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high font-label-sm text-label-sm text-on-surface-variant/90 text-[11px]">
                    Instagram
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high font-label-sm text-label-sm text-primary text-[11px]">
                    15 LC
                  </span>
                </div>
              </div>
              <div className="pt-space-lg mt-space-sm">
                <Link
                  to="/linklens"
                  className="w-full flex items-center justify-center gap-space-xs py-2 px-space-md rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold hover:bg-primary hover:text-on-primary transition-all duration-200"
                >
                  <span>Open LinkLens</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            </div>

            {/* Card 03: WebSentinel */}
            <div className="group relative flex flex-col justify-between p-space-lg bg-surface-container rounded-lg shadow-sm border border-surface-variant/30 hover:border-primary-container transition-all duration-300">
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-space-md">
                  <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors duration-200">
                    <span className="material-symbols-outlined text-[24px]">shield</span>
                  </div>
                  <span className="font-label-sm text-label-sm text-primary/80 font-medium px-2 py-0.5 rounded-full bg-primary-container/20">
                    20 LC / scan
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">WebSentinel</h3>
                <p className="mt-space-xs font-body-sm text-body-sm text-on-surface-variant/90 leading-relaxed min-h-[48px]">
                  Assess suspicious websites for deceptive heuristics, phishing vectors and domain indicators.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-space-md">
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high font-label-sm text-label-sm text-on-surface-variant/90 text-[11px]">
                    SSL & WHOIS
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high font-label-sm text-label-sm text-on-surface-variant/90 text-[11px]">
                    Passive Heuristics
                  </span>
                </div>
              </div>
              <div className="pt-space-lg mt-space-sm">
                <Link
                  to="/websentinel"
                  className="w-full flex items-center justify-center gap-space-xs py-2 px-space-md rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold hover:bg-primary hover:text-on-primary transition-all duration-200"
                >
                  <span>Open WebSentinel</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            </div>

            {/* Card 04: QRGuard */}
            <div className="group relative flex flex-col justify-between p-space-lg bg-surface-container rounded-lg shadow-sm border border-surface-variant/30 hover:border-primary-container transition-all duration-300">
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-space-md">
                  <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors duration-200">
                    <span className="material-symbols-outlined text-[24px]">qr_code_2</span>
                  </div>
                  <span className="font-label-sm text-label-sm text-primary/80 font-medium px-2 py-0.5 rounded-full bg-primary-container/20">
                    10 LC / scan
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">QRGuard</h3>
                <p className="mt-space-xs font-body-sm text-body-sm text-on-surface-variant/90 leading-relaxed min-h-[48px]">
                  Decode and evaluate QR codes in a secure, isolated sandbox without automated browser navigation.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-space-md">
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high font-label-sm text-label-sm text-on-surface-variant/90 text-[11px]">
                    Isolated Sandbox
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high font-label-sm text-label-sm text-on-surface-variant/90 text-[11px]">
                    No Auto-Navigate
                  </span>
                </div>
              </div>
              <div className="pt-space-lg mt-space-sm">
                <Link
                  to="/qrguard"
                  className="w-full flex items-center justify-center gap-space-xs py-2 px-space-md rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold hover:bg-primary hover:text-on-primary transition-all duration-200"
                >
                  <span>Open QRGuard</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            </div>

            {/* Card 05: ReOrigin */}
            <div className="group relative flex flex-col justify-between p-space-lg bg-surface-container rounded-lg shadow-sm border border-surface-variant/30 hover:border-tertiary transition-all duration-300 md:col-span-2">
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-space-md">
                  <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-tertiary group-hover:bg-tertiary-container group-hover:text-on-tertiary-container transition-colors duration-200">
                    <span className="material-symbols-outlined text-[24px]">auto_fix_high</span>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-tertiary px-2.5 py-1 rounded-full bg-tertiary-container/20">
                      Experimental
                    </span>
                    <span className="font-label-sm text-label-sm text-primary/80 font-medium px-2 py-0.5 rounded-full bg-primary-container/20">
                      25 LC
                    </span>
                  </div>
                </div>
                <div className="max-w-2xl">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">ReOrigin</h3>
                  <p className="mt-space-xs font-body-sm text-body-sm text-on-surface-variant/90 leading-relaxed">
                    Explore hypothetical image reconstructions using experimental artificial intelligence.
                  </p>
                </div>
                <div className="mt-space-md flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pt-space-xs">
                  <div className="flex items-center gap-1.5 text-outline">
                    <span className="material-symbols-outlined text-[16px]">toll</span>
                    <span className="font-label-sm text-label-sm text-[11px] text-outline">
                      Cost: 25 LC per reconstruction
                    </span>
                  </div>
                  <p className="font-label-sm text-label-sm text-[11px] text-outline italic">
                    *Reconstructed images must not be presented as verified originals.
                  </p>
                </div>
              </div>
              <div className="pt-space-lg mt-space-sm flex justify-start">
                <Link
                  to="/reorigin"
                  className="w-full sm:w-auto min-w-[200px] flex items-center justify-center gap-space-xs py-2 px-space-md rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold hover:bg-primary hover:text-on-primary transition-all duration-200"
                >
                  <span>Open ReOrigin</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Activity Section */}
        <section className="flex flex-col gap-space-md pt-space-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">
                Recent Activity
              </h2>
            </div>
            <Link
              to="/dashboard"
              className="flex items-center gap-1 font-label-md text-label-md text-primary hover:text-on-primary-container font-semibold transition-colors"
            >
              <span>View All</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>

          {/* Genuine Dynamic State / Empty State */}
          {loadingHistory ? (
            <div className="flex items-center justify-center p-8 bg-surface-container rounded-lg">
              <span className="material-symbols-outlined animate-spin text-primary mr-2">refresh</span>
              <span className="text-body-sm text-outline">Fetching analysis records...</span>
            </div>
          ) : recentAnalyses.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-space-xl bg-surface-container rounded-lg text-center shadow-sm border border-surface-variant/30">
              <div className="relative w-16 h-16 mb-space-md flex items-center justify-center rounded-full bg-surface-container-high">
                <span className="material-symbols-outlined text-[32px] text-primary">radar</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">
                No analyses yet.
              </h3>
              <p className="mt-space-xs font-body-sm text-body-sm text-on-surface-variant max-w-sm">
                Choose an AI tool above to start your first analysis.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-surface-container-high bg-surface-container rounded-lg border border-surface-variant/30 overflow-hidden">
              {recentAnalyses.map((item) => (
                <div key={item.id} className="p-space-md flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[20px]">
                        {item.analysis_type === 'image' || item.analysis_type === 'video' || item.analysis_type === 'audio'
                          ? 'document_scanner'
                          : item.analysis_type === 'linklens'
                          ? 'link'
                          : item.analysis_type === 'websentinel'
                          ? 'shield'
                          : item.analysis_type === 'qrguard'
                          ? 'qr_code_2'
                          : 'auto_fix_high'}
                      </span>
                    </div>
                    <div>
                      <p className="font-body-md text-on-surface font-medium capitalize">
                        {item.analysis_type} Analysis
                      </p>
                      <p className="font-label-sm text-outline text-[12px]">
                        {new Date(item.created_at).toLocaleString()} • Cost: {item.credit_cost} LC
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase bg-surface-container-highest text-on-surface-variant">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};
