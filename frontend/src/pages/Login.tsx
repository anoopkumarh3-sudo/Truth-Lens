import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PublicHeader } from '../components/PublicHeader';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetFeedback, setResetFeedback] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const from = (location.state as any)?.from?.pathname || '/omniscan';

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signIn(email.trim(), password);

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      // Successful login
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred during login.');
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;

    setIsResetting(true);
    setResetFeedback('');

    try {
      const { error } = await resetPassword(resetEmail.trim());
      if (error) {
        setResetFeedback(error.message);
      } else {
        setResetFeedback(`Password reset link dispatched to ${resetEmail}. Check your inbox.`);
        setTimeout(() => {
          setIsResetOpen(false);
          setResetFeedback('');
          setResetEmail('');
        }, 3000);
      }
    } catch (err: any) {
      setResetFeedback(err.message || 'Failed to dispatch password recovery link.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface font-body-md text-body-md flex flex-col min-h-screen antialiased selection:bg-primary-container selection:text-on-primary-container">
      <PublicHeader />

      <main className="flex-1 flex items-center justify-center relative w-full pt-20 pb-12 px-gutter-mobile md:px-margin bg-surface">
        {/* Subtle Ambient Radial Lighting Background */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[500px] bg-primary-container/15 rounded-full blur-[140px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[450px] bg-secondary-container/20 rounded-full blur-[140px]" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-space-lg lg:gap-space-xl items-center">
          {/* Left Column: Brand Context */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-space-xs mb-space-sm">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="font-label-sm text-label-sm tracking-widest uppercase text-secondary">
                Sovereign Intelligence Engine
              </span>
            </div>

            <h1 className="font-display-lg text-display-lg font-bold text-on-surface tracking-tight mb-space-xs">
              TruthLens
            </h1>
            <p className="font-headline-md text-headline-md font-semibold text-primary mb-space-md tracking-tight">
              Verify More. Trust Smarter.
            </p>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl leading-relaxed mb-space-xl">
              Your AI-powered workspace for digital verification, authenticity assessment and cybersecurity.
            </p>

            <div className="flex items-center gap-space-lg pt-space-lg border-t border-surface-variant/30 w-full max-w-md">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">System State</span>
                <span className="font-body-md text-body-md text-on-surface font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-tertiary" />
                  Operational Active
                </span>
              </div>
              <div className="w-px h-8 bg-surface-container-highest" />
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">Protocol</span>
                <span className="font-body-md text-body-md text-on-surface font-medium mt-0.5">TLS 1.3 / E2EE</span>
              </div>
            </div>
          </div>

          {/* Right Column: Charcoal Login Card */}
          <div className="lg:col-span-6 flex items-center justify-center lg:justify-end">
            <div className="w-full max-w-[440px] bg-surface-container-low rounded-lg p-space-lg sm:p-space-xl shadow-xl shadow-surface-container-lowest/80 relative backdrop-blur-2xl border border-surface-variant/40">
              <div className="flex flex-col mb-space-lg">
                <h2 className="font-headline-md text-headline-md font-bold text-on-surface">Welcome back.</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-1">Log in to your TruthLens account.</p>
              </div>

              <form className="flex flex-col gap-space-md" onSubmit={handleLoginSubmit}>
                {/* Email Input */}
                <div className="flex flex-col gap-space-xs text-left">
                  <label className="font-label-md text-label-md text-on-surface font-medium" htmlFor="emailInput">
                    Email address
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-space-md text-outline pointer-events-none text-[20px]">
                      mail
                    </span>
                    <input
                      className="w-full h-12 pl-11 pr-space-md rounded-full bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-md text-body-md transition-all duration-200 outline-none focus:bg-surface-container border border-surface-variant/30 focus:border-primary-container"
                      id="emailInput"
                      placeholder="Enter your email address"
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="flex flex-col gap-space-xs text-left">
                  <label className="font-label-md text-label-md text-on-surface font-medium" htmlFor="passwordInput">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-space-md text-outline pointer-events-none text-[20px]">
                      lock
                    </span>
                    <input
                      className="w-full h-12 pl-11 pr-12 rounded-full bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-md text-body-md transition-all duration-200 outline-none focus:bg-surface-container border border-surface-variant/30 focus:border-primary-container"
                      id="passwordInput"
                      placeholder="Enter your password"
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      aria-label="Toggle password visibility"
                      className="absolute right-space-md p-1 rounded-full text-outline hover:text-on-surface transition-colors"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-space-xs cursor-pointer group select-none">
                    <div className="relative flex items-center">
                      <input
                        className="sr-only peer"
                        id="rememberMe"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <div className="w-4 h-4 rounded bg-surface-container-lowest peer-checked:bg-primary-container flex items-center justify-center border border-surface-variant/50 transition-all">
                        {rememberMe && (
                          <span className="material-symbols-outlined text-white text-[14px] font-bold">check</span>
                        )}
                      </div>
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                      Remember me
                    </span>
                  </label>
                  <button
                    className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors"
                    type="button"
                    onClick={() => setIsResetOpen(true)}
                  >
                    Forgot password?
                  </button>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-lg bg-error-container/20 border border-error/30 text-error font-label-sm text-label-sm text-center">
                    {errorMessage}
                  </div>
                )}

                <button
                  disabled={isLoading}
                  className="w-full h-12 mt-space-xs rounded-full bg-white text-surface-container-lowest font-body-md text-body-md font-semibold flex items-center justify-center gap-space-xs shadow-md hover:shadow-[0_0_24px_rgba(255,255,255,0.3)] active:scale-[0.99] transition-all disabled:opacity-60"
                  type="submit"
                >
                  {isLoading ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Login</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-space-lg pt-space-md text-center border-t border-surface-variant/20">
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Don't have an account?
                  <Link to="/signup" className="text-tertiary hover:text-tertiary-fixed font-medium transition-colors ml-1">
                    Sign Up
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Reset Password Modal */}
        {isResetOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-gutter-mobile">
            <div
              className="absolute inset-0 bg-surface-container-lowest/80 backdrop-blur-md"
              onClick={() => setIsResetOpen(false)}
            />
            <div className="relative w-full max-w-[460px] bg-surface-container rounded-lg p-space-lg sm:p-space-xl shadow-2xl border border-surface-variant/40">
              <button
                className="absolute top-space-md right-space-md w-8 h-8 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors"
                type="button"
                onClick={() => setIsResetOpen(false)}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
              <div className="flex items-center gap-space-sm mb-space-sm">
                <div className="w-10 h-10 rounded-full bg-primary-container/30 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[22px]">lock_reset</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Reset Password</h3>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-lg">
                Enter your verified email address to receive secure recovery instructions.
              </p>
              <form className="flex flex-col gap-space-md" onSubmit={handleResetSubmit}>
                <div className="flex flex-col gap-space-xs text-left">
                  <label className="font-label-md text-label-md text-on-surface font-medium" htmlFor="resetEmailInput">
                    Account email
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-space-md text-outline pointer-events-none text-[20px]">
                      mail
                    </span>
                    <input
                      className="w-full h-12 pl-11 pr-space-md rounded-full bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-md text-body-md outline-none focus:bg-surface-container-high border border-surface-variant/40"
                      id="resetEmailInput"
                      placeholder="name@enterprise.com"
                      required
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                    />
                  </div>
                </div>

                {resetFeedback && (
                  <p className="text-primary font-body-sm text-body-sm text-center">{resetFeedback}</p>
                )}

                <button
                  disabled={isResetting}
                  className="w-full h-12 rounded-full bg-primary-container hover:bg-primary text-on-primary-container hover:text-on-primary font-body-md text-body-md font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  type="submit"
                >
                  {isResetting && <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>}
                  <span>Send Recovery Link</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      <footer className="w-full py-space-md px-gutter-mobile flex items-center justify-center text-center bg-surface border-t border-surface-variant/20">
        <p className="font-label-sm text-label-sm text-outline tracking-wider">
          © 2026 TruthLens. Forensic Isolation Layer Active.
        </p>
      </footer>
    </div>
  );
};
