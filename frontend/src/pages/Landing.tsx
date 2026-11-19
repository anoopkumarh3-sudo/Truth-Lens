import React from 'react';
import { Link } from 'react-router-dom';
import { PublicHeader } from '../components/PublicHeader';

export const Landing: React.FC = () => {
  return (
    <div className="bg-surface text-on-surface font-body-md text-body-md flex flex-col min-h-screen antialiased selection:bg-primary-container selection:text-on-primary-container">
      <PublicHeader />

      <main className="flex-1 flex flex-col relative w-full pt-16 bg-surface">
        <div className="flex flex-col w-full relative overflow-hidden bg-[#08090B] text-on-surface">
          {/* Glowing ambient light ribbons */}
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            <svg
              className="w-full h-[1200px] opacity-60"
              fill="none"
              viewBox="0 0 1440 1200"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <radialGradient
                  cx="0"
                  cy="0"
                  gradientTransform="translate(300 280) rotate(45) scale(600 500)"
                  gradientUnits="userSpaceOnUse"
                  id="meshGrad1"
                  r="1"
                >
                  <stop stopColor="#32174D" stopOpacity="0.8" />
                  <stop offset="0.5" stopColor="#783BB7" stopOpacity="0.35" />
                  <stop offset="1" stopColor="#08090B" stopOpacity="0" />
                </radialGradient>
                <radialGradient
                  cx="0"
                  cy="0"
                  gradientTransform="translate(1100 450) rotate(-30) scale(700 450)"
                  gradientUnits="userSpaceOnUse"
                  id="meshGrad2"
                  r="1"
                >
                  <stop stopColor="#5145E5" stopOpacity="0.5" />
                  <stop offset="0.6" stopColor="#AD4FA4" stopOpacity="0.2" />
                  <stop offset="1" stopColor="#08090B" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="ribbonLine1" x1="0%" x2="100%" y1="20%" y2="80%">
                  <stop offset="0%" stopColor="#5145E5" stopOpacity="0" />
                  <stop offset="30%" stopColor="#783BB7" stopOpacity="0.6" />
                  <stop offset="70%" stopColor="#CE8ABC" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#AD4FA4" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="ribbonLine2" x1="100%" x2="0%" y1="10%" y2="90%">
                  <stop offset="0%" stopColor="#CE8ABC" stopOpacity="0" />
                  <stop offset="40%" stopColor="#AD4FA4" stopOpacity="0.5" />
                  <stop offset="80%" stopColor="#5145E5" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#32174D" stopOpacity="0" />
                </linearGradient>
                <filter height="140%" id="softGlow" width="140%" x="-20%" y="-20%">
                  <feGaussianBlur result="blur" stdDeviation="36" />
                </filter>
              </defs>
              <circle cx="350" cy="300" fill="url(#meshGrad1)" filter="url(#softGlow)" r="450" />
              <circle cx="1080" cy="400" fill="url(#meshGrad2)" filter="url(#softGlow)" r="500" />
              <path
                className="opacity-75"
                d="M-100,180 C320,80 500,480 880,360 C1200,260 1380,480 1600,420"
                fill="none"
                stroke="url(#ribbonLine1)"
                strokeWidth="2.5"
              />
              <path
                className="opacity-60"
                d="M-50,260 C260,340 600,160 980,280 C1300,380 1420,220 1620,310"
                fill="none"
                stroke="url(#ribbonLine2)"
                strokeWidth="1.5"
              />
            </svg>
          </div>

          {/* Hero Section */}
          <section className="relative z-10 w-full px-gutter-mobile md:px-margin pt-space-md md:pt-space-xl pb-space-xl">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-space-lg lg:gap-space-xl items-center">
              {/* Left Column */}
              <div className="lg:col-span-6 flex flex-col items-start text-left">
                <h1 className="font-headline-xl-mobile sm:font-headline-xl text-headline-xl-mobile sm:text-headline-xl font-bold tracking-tight text-white mb-space-xs">
                  TruthLens
                </h1>
                <p className="font-headline-sm text-headline-sm font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#CE8ABC] via-[#AD4FA4] to-[#783BB7] mb-space-sm">
                  Verify More. Trust Smarter.
                </p>
                <p className="font-body-md text-body-md text-[#B5B3C0] leading-relaxed max-w-md mb-space-lg">
                  Assess deepfakes, suspicious content and digital threats using AI-powered digital forensics. Understand what you see, hear and trust online.
                </p>
                <div className="flex flex-wrap items-center gap-space-sm w-full sm:w-auto">
                  <Link
                    to="/signup"
                    className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-full font-label-md text-label-md font-semibold bg-white text-[#08090B] shadow-[0_4px_24px_rgba(255,255,255,0.18)] hover:bg-[#e3e2e6] hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Sign Up
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 rounded-full font-label-md text-label-md font-medium text-white bg-transparent shadow-[inset_0_0_0_1px_#303038] hover:shadow-[inset_0_0_0_1px_#783BB7] hover:bg-[#783BB7]/10 active:scale-[0.98] transition-all"
                  >
                    Login
                  </Link>
                </div>
              </div>

              {/* Right Column: Architecture Overview */}
              <div className="lg:col-span-6 w-full">
                <div className="w-full bg-[#18191D]/90 backdrop-blur-xl rounded-2xl p-space-md sm:p-space-lg shadow-[0_24px_64px_-12px_rgba(0,0,0,0.85)] relative overflow-hidden border border-[#303038]/60">
                  <div className="absolute -top-16 -right-16 w-36 h-36 bg-[#783BB7]/20 rounded-full blur-2xl pointer-events-none" />

                  {/* Card Top Bar */}
                  <div className="flex items-center justify-between mb-space-md relative z-10">
                    <div className="flex items-center gap-space-xs">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#5145E5]" />
                      <span className="font-label-sm text-label-sm text-[#B5B3C0] font-medium tracking-wide">
                        System Architecture
                      </span>
                    </div>
                    <span className="font-label-sm text-[10px] text-[#CE8ABC] bg-[#32174D]/80 px-2.5 py-0.5 rounded-full uppercase tracking-widest font-mono">
                      Integration Pending
                    </span>
                  </div>

                  {/* Visualizer */}
                  <div className="grid grid-cols-11 gap-1 sm:gap-2 items-center relative z-10 py-space-xs">
                    {/* Left Inputs */}
                    <div className="col-span-3 flex flex-col gap-space-xs">
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-[#101114] shadow-[inset_0_0_0_1px_#303038]">
                        <span className="material-symbols-outlined text-[#CE8ABC] text-[18px]">image</span>
                        <span className="font-label-sm text-label-sm font-medium text-white truncate">Image</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-[#101114] shadow-[inset_0_0_0_1px_#303038]">
                        <span className="material-symbols-outlined text-[#AD4FA4] text-[18px]">mic</span>
                        <span className="font-label-sm text-label-sm font-medium text-white truncate">Audio</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-[#101114] shadow-[inset_0_0_0_1px_#303038]">
                        <span className="material-symbols-outlined text-[#783BB7] text-[18px]">videocam</span>
                        <span className="font-label-sm text-label-sm font-medium text-white truncate">Video</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-[#101114] shadow-[inset_0_0_0_1px_#303038]">
                        <span className="material-symbols-outlined text-[#5145E5] text-[18px]">link</span>
                        <span className="font-label-sm text-label-sm font-medium text-white truncate">Link</span>
                      </div>
                    </div>

                    {/* Vector Interconnects Left */}
                    <div className="col-span-1 h-36 flex items-center justify-center pointer-events-none">
                      <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30 140">
                        <path d="M 0,22 C 18,22 12,70 30,70" opacity="0.8" stroke="#783BB7" strokeDasharray="3 3" strokeWidth="1.5" />
                        <path d="M 0,55 C 18,55 12,70 30,70" opacity="0.9" stroke="#AD4FA4" strokeWidth="1.5" />
                        <path d="M 0,85 C 18,85 12,70 30,70" opacity="0.9" stroke="#783BB7" strokeWidth="1.5" />
                        <path d="M 0,118 C 18,118 12,70 30,70" opacity="0.8" stroke="#5145E5" strokeDasharray="3 3" strokeWidth="1.5" />
                      </svg>
                    </div>

                    {/* Center Core */}
                    <div className="col-span-3 flex flex-col items-center justify-center">
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#101114] shadow-[0_0_28px_rgba(120,59,183,0.35),inset_0_0_0_1px_#783BB7] flex flex-col items-center justify-center p-2 group">
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#783BB7]/20 to-transparent pointer-events-none" />
                        <span className="material-symbols-outlined text-[#CE8ABC] text-[32px] drop-shadow-[0_0_12px_rgba(206,138,188,0.5)]">
                          verified_user
                        </span>
                      </div>
                      <span className="font-label-sm text-[11px] text-[#CE8ABC] font-semibold tracking-wider uppercase mt-2 text-center">
                        TruthLens Core
                      </span>
                    </div>

                    {/* Vector Interconnects Right */}
                    <div className="col-span-1 h-36 flex items-center justify-center pointer-events-none">
                      <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30 140">
                        <path d="M 0,70 C 18,70 12,30 30,30" opacity="0.9" stroke="#CE8ABC" strokeWidth="1.5" />
                        <path d="M 0,70 C 18,70 15,70 30,70" opacity="0.8" stroke="#783BB7" strokeDasharray="3 3" strokeWidth="1.5" />
                        <path d="M 0,70 C 18,70 12,110 30,110" opacity="0.9" stroke="#5145E5" strokeWidth="1.5" />
                      </svg>
                    </div>

                    {/* Right Outputs */}
                    <div className="col-span-3 flex flex-col justify-between h-36">
                      <div className="p-2 rounded-xl bg-[#101114] shadow-[inset_0_0_0_1px_#303038] flex flex-col">
                        <span className="font-label-sm text-[11px] font-semibold text-white leading-tight">Authenticity</span>
                        <span className="font-label-sm text-[10px] text-[#B5B3C0]">Assessment</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#101114] shadow-[inset_0_0_0_1px_#303038] flex flex-col">
                        <span className="font-label-sm text-[11px] font-semibold text-white leading-tight">Risk Vector</span>
                        <span className="font-label-sm text-[10px] text-[#B5B3C0]">Assessment</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#101114] shadow-[inset_0_0_0_1px_#303038] flex flex-col">
                        <span className="font-label-sm text-[11px] font-semibold text-white leading-tight">Digital Trail</span>
                        <span className="font-label-sm text-[10px] text-[#B5B3C0]">Evidence Log</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Bar */}
                  <div className="mt-space-md pt-space-xs flex items-center justify-between text-[#B5B3C0] border-t border-[#303038]/40">
                    <span className="font-label-sm text-[11px] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[#783BB7] text-[14px]">shield</span>
                      Forensic Engine
                    </span>
                    <span className="font-label-sm text-[11px] font-mono text-[#CE8ABC]">Standalone Mode</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Core Features Section */}
          <section id="features" className="relative z-10 w-full px-gutter-mobile md:px-margin py-space-xl">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-space-lg">
                <h2 className="font-headline-lg text-headline-lg font-bold text-white tracking-tight">
                  Powerful Tools. Smarter Verification.
                </h2>
              </div>

              {/* Exactly 5 Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
                {/* Feature 1: OmniScan */}
                <div className="bg-[#18191D] p-space-lg rounded-2xl shadow-[inset_0_0_0_1px_#303038] flex flex-col">
                  <div className="w-12 h-12 rounded-full bg-[#101114] shadow-[inset_0_0_0_1px_#303038] flex items-center justify-center mb-space-md">
                    <span className="material-symbols-outlined text-[#CE8ABC] text-[24px]">troubleshoot</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm font-semibold text-white mb-space-xs">
                    OmniScan
                  </h3>
                  <p className="font-body-sm text-body-sm text-[#B5B3C0] leading-relaxed">
                    AI-assisted assessment of potentially manipulated images, cloned audio and deepfake videos.
                  </p>
                </div>

                {/* Feature 2: LinkLens */}
                <div className="bg-[#18191D] p-space-lg rounded-2xl shadow-[inset_0_0_0_1px_#303038] flex flex-col">
                  <div className="w-12 h-12 rounded-full bg-[#101114] shadow-[inset_0_0_0_1px_#303038] flex items-center justify-center mb-space-md">
                    <span className="material-symbols-outlined text-[#AD4FA4] text-[24px]">hub</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm font-semibold text-white mb-space-xs">
                    LinkLens
                  </h3>
                  <p className="font-body-sm text-body-sm text-[#B5B3C0] leading-relaxed">
                    Analyze supported YouTube and Instagram content for suspicious digital indicators.
                  </p>
                </div>

                {/* Feature 3: WebSentinel */}
                <div className="bg-[#18191D] p-space-lg rounded-2xl shadow-[inset_0_0_0_1px_#303038] flex flex-col">
                  <div className="w-12 h-12 rounded-full bg-[#101114] shadow-[inset_0_0_0_1px_#303038] flex items-center justify-center mb-space-md">
                    <span className="material-symbols-outlined text-[#783BB7] text-[24px]">security</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm font-semibold text-white mb-space-xs">
                    WebSentinel
                  </h3>
                  <p className="font-body-sm text-body-sm text-[#B5B3C0] leading-relaxed">
                    Assess websites for phishing indicators and potential security risks.
                  </p>
                </div>

                {/* Feature 4: QRGuard */}
                <div className="bg-[#18191D] p-space-lg rounded-2xl shadow-[inset_0_0_0_1px_#303038] flex flex-col">
                  <div className="w-12 h-12 rounded-full bg-[#101114] shadow-[inset_0_0_0_1px_#303038] flex items-center justify-center mb-space-md">
                    <span className="material-symbols-outlined text-[#5145E5] text-[24px]">qr_code_scanner</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm font-semibold text-white mb-space-xs">
                    QRGuard
                  </h3>
                  <p className="font-body-sm text-body-sm text-[#B5B3C0] leading-relaxed">
                    Decode QR codes and assess potentially unsafe destinations without auto-navigating.
                  </p>
                </div>

                {/* Feature 5: ReOrigin */}
                <div className="bg-[#18191D] p-space-lg rounded-2xl shadow-[inset_0_0_0_1px_#303038] flex flex-col md:col-span-2 lg:col-span-1">
                  <div className="w-12 h-12 rounded-full bg-[#101114] shadow-[inset_0_0_0_1px_#303038] flex items-center justify-center mb-space-md">
                    <span className="material-symbols-outlined text-[#CE8ABC] text-[24px]">history_edu</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm font-semibold text-white mb-space-xs">
                    ReOrigin
                  </h3>
                  <p className="font-body-sm text-body-sm text-[#B5B3C0] leading-relaxed">
                    Experimental inpainting/reconstruction of a hypothetical pre-edit image. Never claims recovery of a verified original.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Pricing Section */}
          <section id="pricing" className="relative z-10 w-full px-gutter-mobile md:px-margin py-space-xl">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-space-lg">
                <h2 className="font-headline-lg text-headline-lg font-bold text-white tracking-tight mb-space-xs">
                  Simple Pricing. Powerful Protection.
                </h2>
                <p className="font-body-md text-body-md text-[#B5B3C0]">
                  Choose your LensCredits package and access TruthLens AI tools.
                </p>
              </div>

              {/* Exactly 4 Equal-Sized Pricing Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
                {/* Starter Plan */}
                <div className="bg-[#18191D] p-space-lg rounded-2xl shadow-[inset_0_0_0_1px_#303038] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-space-sm">
                      <span className="font-label-sm text-label-sm font-semibold text-[#B5B3C0] uppercase tracking-wider">
                        Starter
                      </span>
                      <span className="font-label-sm text-[10px] text-[#CE8ABC] bg-[#32174D]/80 px-2 py-0.5 rounded-full font-mono">
                        Free
                      </span>
                    </div>
                    <div className="mb-space-md">
                      <div className="font-headline-xl text-headline-xl font-bold text-white leading-none">₹0</div>
                      <div className="font-label-md text-label-md font-semibold text-[#CE8ABC] mt-space-xs">
                        100 LensCredits
                      </div>
                    </div>
                    <p className="font-body-sm text-body-sm text-[#B5B3C0] leading-relaxed mb-space-lg">
                      One-time welcome reward upon first login.
                    </p>
                  </div>
                  <Link
                    to="/signup"
                    className="w-full min-h-[44px] inline-flex items-center justify-center rounded-full font-label-md text-label-md font-semibold bg-white text-[#08090B] hover:bg-[#e3e2e6] transition-all"
                  >
                    Sign Up
                  </Link>
                </div>

                {/* Explorer Plan */}
                <div className="bg-[#18191D] p-space-lg rounded-2xl shadow-[inset_0_0_0_1px_#303038] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-space-sm">
                      <span className="font-label-sm text-label-sm font-semibold text-[#B5B3C0] uppercase tracking-wider">
                        Explorer
                      </span>
                      <span className="font-label-sm text-[10px] text-white bg-[#5145E5]/40 px-2 py-0.5 rounded-full font-mono">
                        Boost
                      </span>
                    </div>
                    <div className="mb-space-md">
                      <div className="font-headline-xl text-headline-xl font-bold text-white leading-none">₹49</div>
                      <div className="font-label-md text-label-md font-semibold text-[#CE8ABC] mt-space-xs">
                        150 LensCredits
                      </div>
                    </div>
                    <p className="font-body-sm text-body-sm text-[#B5B3C0] leading-relaxed mb-space-lg">
                      One-time credit package.
                    </p>
                  </div>
                  <Link
                    to="/signup"
                    className="w-full min-h-[44px] inline-flex items-center justify-center rounded-full font-label-md text-label-md font-semibold bg-white text-[#08090B] hover:bg-[#e3e2e6] transition-all"
                  >
                    Get Credits
                  </Link>
                </div>

                {/* Protector Plan */}
                <div className="bg-[#18191D] p-space-lg rounded-2xl shadow-[inset_0_0_0_1px_#783BB7] flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#783BB7]/30 rounded-full blur-xl pointer-events-none" />
                  <div>
                    <div className="flex items-center justify-between mb-space-sm relative z-10">
                      <span className="font-label-sm text-label-sm font-semibold text-white uppercase tracking-wider">
                        Protector
                      </span>
                      <span className="font-label-sm text-[10px] text-white bg-[#783BB7] px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wide">
                        Popular
                      </span>
                    </div>
                    <div className="mb-space-md relative z-10">
                      <div className="font-headline-xl text-headline-xl font-bold text-white leading-none">₹99</div>
                      <div className="font-label-md text-label-md font-semibold text-[#CE8ABC] mt-space-xs">
                        350 LensCredits
                      </div>
                    </div>
                    <p className="font-body-sm text-body-sm text-[#B5B3C0] leading-relaxed mb-space-lg relative z-10">
                      One-time credit package.
                    </p>
                  </div>
                  <Link
                    to="/signup"
                    className="w-full min-h-[44px] inline-flex items-center justify-center rounded-full font-label-md text-label-md font-semibold bg-white text-[#08090B] hover:bg-[#e3e2e6] transition-all relative z-10"
                  >
                    Get Credits
                  </Link>
                </div>

                {/* Guardian Plan */}
                <div className="bg-[#18191D] p-space-lg rounded-2xl shadow-[inset_0_0_0_1px_#303038] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-space-sm">
                      <span className="font-label-sm text-label-sm font-semibold text-[#B5B3C0] uppercase tracking-wider">
                        Guardian
                      </span>
                      <span className="font-label-sm text-[10px] text-[#CE8ABC] bg-[#32174D]/80 px-2 py-0.5 rounded-full font-mono">
                        Max
                      </span>
                    </div>
                    <div className="mb-space-md">
                      <div className="font-headline-xl text-headline-xl font-bold text-white leading-none">₹199</div>
                      <div className="font-label-md text-label-md font-semibold text-[#CE8ABC] mt-space-xs">
                        800 LensCredits
                      </div>
                    </div>
                    <p className="font-body-sm text-body-sm text-[#B5B3C0] leading-relaxed mb-space-lg">
                      One-time credit package.
                    </p>
                  </div>
                  <Link
                    to="/signup"
                    className="w-full min-h-[44px] inline-flex items-center justify-center rounded-full font-label-md text-label-md font-semibold bg-white text-[#08090B] hover:bg-[#e3e2e6] transition-all"
                  >
                    Get Credits
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <div className="w-full h-px bg-[#303038]/60 my-space-md" />
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-space-lg px-gutter-mobile pb-safe flex flex-col items-center justify-center gap-space-xs text-center bg-surface">
        <p className="font-label-sm text-label-sm text-on-surface-variant tracking-wide">
          TruthLens — Verify More. Trust Smarter.
        </p>
        <p className="font-label-sm text-label-sm text-outline tracking-wider">
          © 2026 TruthLens.
        </p>
      </footer>
    </div>
  );
};
