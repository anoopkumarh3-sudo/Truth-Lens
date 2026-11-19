import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  credits?: number | string;
}

export const Sidebar: React.FC<SidebarProps> = ({ credits }) => {
  const { user, profile, wallet, availableCredits, signOut } = useAuth();
  const navigate = useNavigate();

  const displayCredits =
    credits !== undefined
      ? credits
      : wallet !== null
      ? availableCredits
      : '—';

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Investigator';

  const userInitial = displayName.trim() ? displayName.trim()[0].toUpperCase() : 'U';

  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'flex items-center gap-space-sm px-space-md py-3 rounded-full transition-all bg-primary-container text-on-primary-container font-semibold shadow-[0_0_16px_rgba(120,59,183,0.25)]'
      : 'flex items-center gap-space-sm px-space-md py-3 rounded-full text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-[248px] bg-surface-container-low border-r border-surface-variant/40 flex flex-col justify-between z-50 select-none">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="px-space-md pt-space-lg pb-space-md flex flex-col gap-space-xs">
          <Link to="/omniscan" className="flex items-center gap-space-sm group">
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container shadow-[0_0_16px_rgba(120,59,183,0.35)] group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
            </div>
            <span className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">
              TruthLens
            </span>
          </Link>
          <p className="font-label-sm text-label-sm text-on-surface-variant/80 pl-1 tracking-wide text-[11px]">
            Multimedia Digital Forensics
          </p>
        </div>

        {/* Simplified Navigation: OmniScan & Dashboard Only */}
        <nav className="flex flex-col px-space-sm pt-space-sm gap-2">
          <span className="px-space-sm font-label-sm text-label-sm uppercase tracking-wider text-outline text-[11px]">
            Primary Platform
          </span>

          <NavLink to="/omniscan" className={getNavClass}>
            <span className="material-symbols-outlined text-[20px]">document_scanner</span>
            <span className="font-body-sm text-body-sm">OmniScan</span>
          </NavLink>

          <NavLink to="/dashboard" className={getNavClass}>
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            <span className="font-body-sm text-body-sm">Dashboard</span>
          </NavLink>
        </nav>
      </div>

      {/* Bottom Credits & Account Box */}
      <div className="flex flex-col gap-space-sm p-space-sm border-t border-surface-variant/30">
        <div className="bg-surface-container rounded-DEFAULT p-space-sm border border-surface-variant/40 flex flex-col gap-space-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs text-on-surface">
              <span className="material-symbols-outlined text-primary text-[18px]">toll</span>
              <span className="font-body-sm text-body-sm font-semibold">LensCredits</span>
            </div>
            <span className="font-label-sm text-label-sm text-primary font-bold">
              {typeof displayCredits === 'number' ? `${displayCredits} LC` : displayCredits}
            </span>
          </div>
          <p className="font-label-sm text-label-sm text-outline text-[11px]">
            {wallet ? 'Live Database Balance' : 'Wallet Syncing...'}
          </p>
          <Link
            to="/dashboard"
            className="mt-space-xs w-full py-1.5 px-space-sm rounded-full bg-surface-container-high hover:bg-primary-container text-on-surface hover:text-on-primary-container font-label-sm text-label-sm text-center transition-all"
          >
            Get Credits
          </Link>
        </div>

        <div className="flex items-center justify-between p-space-xs rounded-xl hover:bg-surface-container text-on-surface transition-all">
          <Link to="/dashboard" className="flex items-center gap-space-sm flex-1 min-w-0 pr-1">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-label-sm text-label-sm font-bold text-primary shrink-0">
              {userInitial}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-body-sm text-body-sm font-medium truncate text-on-surface" title={displayName}>
                {displayName}
              </span>
              <span className="font-label-sm text-[11px] text-outline truncate" title={user?.email || ''}>
                {user?.email || '—'}
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            title="Log Out"
            className="p-1.5 rounded-full text-outline hover:text-error hover:bg-error/10 transition-colors shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
