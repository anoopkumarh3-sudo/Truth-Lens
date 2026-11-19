import React from 'react';
import { Link } from 'react-router-dom';

export const PublicHeader: React.FC = () => {
  return (
    <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-variant/20">
      <div className="h-16 px-gutter-mobile md:px-margin flex items-center justify-between gap-space-xs max-w-7xl mx-auto">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-space-sm group">
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container shadow-[0_0_16px_rgba(120,59,183,0.35)]">
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
          </div>
          <span className="font-label-md text-label-md font-bold text-on-surface tracking-tight">TruthLens</span>
        </Link>

        {/* Links */}
        <nav className="flex items-center gap-space-xs">
          <a
            className="min-h-[44px] px-space-xs flex items-center transition-colors text-primary font-semibold text-body-sm"
            href="/#features"
          >
            Features
          </a>
          <a
            className="min-h-[44px] px-space-xs flex items-center font-label-md text-label-md text-on-surface-variant hover:text-on-surface transition-colors"
            href="/#pricing"
          >
            Pricing
          </a>
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-space-xs">
          <Link
            className="min-h-[40px] px-space-md flex items-center justify-center rounded-full font-label-md text-label-md text-on-surface bg-surface-container-high/60 hover:bg-surface-container-highest transition-colors"
            to="/login"
          >
            Login
          </Link>
          <Link
            className="min-h-[40px] px-space-md flex items-center justify-center rounded-full font-label-md text-label-md font-semibold bg-on-surface text-surface-container-lowest hover:opacity-90 transition-opacity"
            to="/signup"
          >
            Sign Up
          </Link>
          <Link
            to="/home"
            title="Go to App"
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 hover:opacity-90"
          >
            <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
