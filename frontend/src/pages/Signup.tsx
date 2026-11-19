import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PublicHeader } from '../components/PublicHeader';
import { useAuth } from '../contexts/AuthContext';

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage('');
    setSuccessInfo(null);

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signUp(email.trim(), password, fullName.trim());

      if (result.error) {
        setErrorMessage(result.error.message);
        setIsSubmitting(false);
        return;
      }

      if (result.emailConfirmationRequired) {
        setSuccessInfo(`Registration successful! A confirmation email has been sent to ${email}. Please confirm your account before logging in.`);
        setIsSubmitting(false);
        return;
      }

      if (result.session) {
        navigate('/omniscan');
      } else {
        navigate('/login');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected registration error occurred.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface font-body-md text-body-md flex flex-col min-h-screen antialiased selection:bg-primary-container selection:text-on-primary-container">
      <PublicHeader />

      <main className="flex-1 flex items-center justify-center relative w-full pt-20 pb-12 px-gutter-mobile md:px-margin bg-surface">
        {/* Subtle Ambient Radial Lighting Background */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-1/3 left-1/4 w-[600px] h-[500px] bg-primary-container/15 rounded-full blur-[140px]" />
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

            <div className="mt-space-md flex items-center gap-space-sm text-outline border-t border-surface-variant/30 pt-space-md max-w-md">
              <span className="material-symbols-outlined text-[20px] text-primary">security</span>
              <span className="font-label-sm text-label-sm tracking-wide">
                Enterprise grade forensic data verification standard • Zero Log Identity
              </span>
            </div>
          </div>

          {/* Right Column: Registration Card */}
          <div className="lg:col-span-6 flex justify-center items-center px-2 sm:px-4">
            <div className="w-full max-w-[460px] bg-surface-container-low rounded-lg p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md border border-surface-variant/40">
              <div className="absolute -top-24 -right-24 w-60 h-60 bg-primary-container/20 rounded-full blur-[80px] pointer-events-none" />

              {/* Header */}
              <div className="space-y-space-xs mb-space-md relative z-10">
                <h2 className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight">
                  Create your account.
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Start your digital verification journey with TruthLens.
                </p>
              </div>

              {/* Welcome Reward Strip */}
              <div className="flex items-center gap-space-sm p-3.5 rounded-DEFAULT bg-surface-container-high shadow-sm mb-space-lg relative overflow-hidden group border border-surface-variant/30">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-container/20 via-transparent to-tertiary-container/10 pointer-events-none" />
                <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center shrink-0 shadow-inner">
                  <span className="material-symbols-outlined text-primary text-[20px]">workspace_premium</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-label-md text-label-md text-on-surface font-semibold">100 Free LensCredits</span>
                    <span className="inline-block px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-label-sm font-bold uppercase tracking-wider">
                      Bonus
                    </span>
                  </div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant truncate">
                    Automatically awarded to your wallet on registration.
                  </p>
                </div>
              </div>

              {/* Success Notification / Email Verification */}
              {successInfo ? (
                <div className="flex flex-col gap-space-md text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-[28px]">mark_email_read</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    Verification Email Dispatched
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    {successInfo}
                  </p>
                  <Link
                    to="/login"
                    className="w-full mt-2 py-2.5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold transition-colors shadow-md hover:bg-primary-container"
                  >
                    Proceed to Login
                  </Link>
                </div>
              ) : (
                /* Form */
                <form className="space-y-space-md relative z-10" onSubmit={handleSubmit}>
                  {/* Full Name */}
                  <div className="space-y-1.5 text-left">
                    <label className="block font-label-md text-label-md text-on-surface font-medium" htmlFor="full-name">
                      Full name
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-[20px] text-outline pointer-events-none">
                        person
                      </span>
                      <input
                        className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-md text-body-md rounded-DEFAULT pl-11 pr-4 py-2.5 outline-none border border-surface-variant/30 focus:border-primary-container transition-all"
                        id="full-name"
                        placeholder="Enter your full name"
                        required
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div className="space-y-1.5 text-left">
                    <label className="block font-label-md text-label-md text-on-surface font-medium" htmlFor="email-address">
                      Email address
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-[20px] text-outline pointer-events-none">
                        mail
                      </span>
                      <input
                        className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-md text-body-md rounded-DEFAULT pl-11 pr-4 py-2.5 outline-none border border-surface-variant/30 focus:border-primary-container transition-all"
                        id="email-address"
                        placeholder="Enter your email address"
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5 text-left">
                    <label className="block font-label-md text-label-md text-on-surface font-medium" htmlFor="password">
                      Password
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-[20px] text-outline pointer-events-none">
                        lock
                      </span>
                      <input
                        className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-md text-body-md rounded-DEFAULT pl-11 pr-11 py-2.5 outline-none border border-surface-variant/30 focus:border-primary-container transition-all"
                        id="password"
                        placeholder="Create a password"
                        required
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        aria-label="Toggle password visibility"
                        className="absolute right-3.5 text-outline hover:text-on-surface transition-colors"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                    <p className="font-label-sm text-label-sm text-outline flex items-center gap-1.5 pt-0.5">
                      <span className="w-1 h-1 rounded-full bg-primary inline-block" />
                      8+ characters, including letters and numbers
                    </p>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5 text-left">
                    <label className="block font-label-md text-label-md text-on-surface font-medium" htmlFor="confirm-password">
                      Confirm password
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-[20px] text-outline pointer-events-none">
                        lock_reset
                      </span>
                      <input
                        className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-md text-body-md rounded-DEFAULT pl-11 pr-11 py-2.5 outline-none border border-surface-variant/30 focus:border-primary-container transition-all"
                        id="confirm-password"
                        placeholder="Confirm your password"
                        required
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        aria-label="Toggle confirm password visibility"
                        className="absolute right-3.5 text-outline hover:text-on-surface transition-colors"
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showConfirmPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Error Notification */}
                  {errorMessage && (
                    <div className="p-3 rounded-lg bg-error-container/20 border border-error/30 text-error font-label-sm text-label-sm text-center">
                      {errorMessage}
                    </div>
                  )}

                  <div className="pt-space-sm">
                    <button
                      disabled={isSubmitting}
                      className="w-full py-3 px-6 rounded-full bg-white text-surface-container-lowest font-label-md text-label-md font-semibold flex items-center justify-center gap-space-xs hover:bg-[#e3e2e6] shadow-md hover:shadow-[0_0_24px_rgba(255,255,255,0.2)] transition-all active:scale-[0.99] disabled:opacity-60"
                      type="submit"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                          <span>Creating Account...</span>
                        </>
                      ) : (
                        <>
                          <span>Create Account</span>
                          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-space-lg text-center border-t border-surface-variant/20 pt-space-md">
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Already have an account?
                  <Link to="/login" className="text-tertiary hover:text-tertiary-fixed font-medium hover:underline ml-1">
                    Login
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full py-space-md px-gutter-mobile flex items-center justify-center text-center bg-surface border-t border-surface-variant/20">
        <p className="font-label-sm text-label-sm text-outline tracking-wider">
          © 2026 TruthLens. Forensic Isolation Layer Active.
        </p>
      </footer>
    </div>
  );
};
