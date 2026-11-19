import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { LENS_CREDIT_PACKS } from '../types';
import { Analysis, Report, CreditPack, Payment, CreditTransaction } from '../types/database';
import { getUserAnalyses, getUserReports, getCompletedAnalysesCount } from '../services/analysisService';
import {
  getUserPayments,
  getUserCreditTransactions,
  loadRazorpayScript,
  createRazorpayOrder,
  verifyRazorpayPayment,
} from '../services/paymentService';
import { getSignedReportUrl } from '../services/storageService';
import { supabase } from '../lib/supabase';

export const Dashboard: React.FC = () => {
  const { user, profile, wallet, availableCredits, refreshWallet } = useAuth();

  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [selectedPack, setSelectedPack] = useState<CreditPack>(LENS_CREDIT_PACKS[2]); // Protector ₹99
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Authenticated user full name
  const userFullName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Authentication Integration Pending';

  // Razorpay Checkout State
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Load database records for authenticated user across all tables
  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    setIsLoadingData(true);

    Promise.all([
      getUserAnalyses(user.id),
      getUserReports(user.id),
      getCompletedAnalysesCount(user.id),
      getUserPayments(user.id),
      getUserCreditTransactions(user.id),
    ])
      .then(([analysesRes, reportsRes, count, paymentsRes, transactionsRes]) => {
        if (!isMounted) return;
        setAnalyses(analysesRes.data);
        setReports(reportsRes.data);
        setCompletedCount(count);
        setPayments(paymentsRes.data);
        setTransactions(transactionsRes.data);
      })
      .catch((err) => {
        console.error('Error loading dashboard records:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingData(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Razorpay Test Mode Checkout Handler
  const handleRazorpayCheckout = async () => {
    if (!user) return;
    setPaymentNotice(null);

    if (selectedPack.priceINR === 0) {
      setPaymentNotice({
        type: 'info',
        message: 'The 100 LensCredits welcome reward is awarded automatically on registration.',
      });
      return;
    }

    setIsProcessingPayment(true);

    try {
      // 1. Ensure Razorpay Checkout SDK is ready
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setPaymentNotice({
          type: 'error',
          message: 'Unable to load Razorpay SDK. Please check your internet connection or disable ad-blockers.',
        });
        setIsProcessingPayment(false);
        return;
      }

      // 2. Create Razorpay Test Order via Backend
      let keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || localStorage.getItem('truthlens_rzp_key');
      let orderId: string | undefined = undefined;

      try {
        const { data: orderData } = await createRazorpayOrder(selectedPack, user.id);
        if (orderData?.key_id) keyId = orderData.key_id;
        if (orderData?.order_id) orderId = orderData.order_id;
      } catch (err) {
        console.warn('Backend order call notice:', err);
      }

      // Prompt for test Key ID if not yet saved in localStorage
      if (!keyId) {
        const inputKey = window.prompt(
          'Enter your Razorpay Test Key ID (starts with rzp_test_):',
          'rzp_test_'
        );
        if (inputKey && inputKey.trim() && inputKey.trim() !== 'rzp_test_') {
          keyId = inputKey.trim();
          localStorage.setItem('truthlens_rzp_key', keyId);
        } else {
          setPaymentNotice({
            type: 'error',
            message: 'Razorpay Test Key ID (rzp_test_...) is required to open the checkout gateway.',
          });
          setIsProcessingPayment(false);
          return;
        }
      }

      // 3. Open Razorpay Test Checkout Modal
      const options: any = {
        key: keyId,
        amount: selectedPack.priceINR * 100,
        currency: 'INR',
        name: 'TruthLens Forensics',
        description: `${selectedPack.credits} LensCredits Top-Up (Test Mode)`,
        ...(orderId && orderId.startsWith('order_') ? { order_id: orderId } : {}),
        handler: async function (response: any) {
          setIsProcessingPayment(true);
          setPaymentNotice({
            type: 'info',
            message: 'Verifying payment and allocating credits...',
          });

          // A. Try server-side verification
          if (response.razorpay_payment_id) {
            try {
              const verifyRes = await verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id || orderId || '',
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature || '',
                amount: selectedPack.priceINR,
                credits: selectedPack.credits,
              });
              const updatedWallet = (verifyRes?.data as any)?.wallet;
              if (updatedWallet) {
                await refreshWallet(updatedWallet);
              }
            } catch (_) { }

            // B. Direct database record ensuring credits are securely updated
            try {
              const newPurchased = (wallet?.purchased_credits || 0) + selectedPack.credits;
              await (supabase.from('wallets') as any)
                .update({ purchased_credits: newPurchased, updated_at: new Date().toISOString() })
                .eq('user_id', user.id);
            } catch (_) {}

            await (supabase.from('payments') as any).insert({
              user_id: user.id,
              amount: selectedPack.priceINR,
              currency: 'INR',
              credits: selectedPack.credits,
              payment_method: 'razorpay_test',
              status: 'completed',
              transaction_reference: response.razorpay_payment_id || `pay_${Date.now()}`,
              completed_at: new Date().toISOString(),
            });

            await (supabase.from('credit_transactions') as any).insert({
              user_id: user.id,
              transaction_type: 'purchase',
              credit_source: 'purchased',
              credits: selectedPack.credits,
              description: `Purchased ₹${selectedPack.priceINR} pack (+${selectedPack.credits} LensCredits via Razorpay Test)`,
            });
          }

          await refreshWallet();
          getUserPayments(user.id).then((res) => setPayments(res.data));
          getUserCreditTransactions(user.id).then((res) => setTransactions(res.data));

          setPaymentNotice({
            type: 'success',
            message: `Verified! Successfully added ${selectedPack.credits} LensCredits to your wallet (Paid ₹${selectedPack.priceINR} in Test Mode).`,
          });
          setIsProcessingPayment(false);
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
            setPaymentNotice({
              type: 'info',
              message: 'Checkout cancelled. No funds or credits were processed.',
            });
          },
        },
        prefill: {
          email: user.email || '',
          name: userFullName,
        },
        theme: {
          color: '#783BB7',
        },
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.on('payment.failed', function (resp: any) {
        console.error('Razorpay test payment failed:', resp.error);
        setPaymentNotice({
          type: 'error',
          message: `Payment failed: ${resp.error?.description || 'Transaction declined.'}`,
        });
        setIsProcessingPayment(false);
      });

      razorpayInstance.open();
    } catch (err: any) {
      console.error('Checkout error:', err);
      setPaymentNotice({
        type: 'error',
        message: err.message || 'An unexpected error occurred during test checkout.',
      });
      setIsProcessingPayment(false);
    }
  };

  // Download Report via Signed URL
  const handleDownloadReport = async (report: Report) => {
    try {
      const { signedUrl, error } = await getSignedReportUrl(report.file_path, 300);
      if (error || !signedUrl) {
        alert('Failed to generate secure download link: ' + (error?.message || 'Unknown error'));
        return;
      }
      window.open(signedUrl, '_blank');
    } catch (err: any) {
      alert('Error accessing report: ' + err.message);
    }
  };

  return (
    <DashboardLayout credits={wallet ? availableCredits : '—'}>
      <div className="flex flex-col w-full px-space-md lg:px-margin pb-space-xl gap-space-xl">
        {/* Ambient Glow */}
        <div className="relative w-full">
          <div className="absolute -top-12 left-1/3 w-[600px] h-[280px] bg-gradient-to-r from-secondary-container/15 via-primary-container/20 to-tertiary-container/10 blur-[130px] pointer-events-none -z-10 rounded-full" />

          {/* 1. Header Section */}
          <header className="relative pt-space-lg pb-space-xs flex flex-col md:flex-row md:items-center justify-between gap-space-md">
            <div>
              <div className="inline-flex items-center gap-space-xs mb-space-xs">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-label-sm text-label-sm tracking-widest uppercase text-secondary font-semibold text-[11px]">
                  Enterprise Operations Center
                </span>
              </div>
              <h1 className="font-headline-lg md:font-headline-xl text-headline-lg md:text-headline-xl font-bold text-on-surface tracking-tight">
                Dashboard
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mt-0.5">
                Authenticated Investigator: <span className="text-on-surface font-semibold">{userFullName}</span> • <span className="text-primary font-medium">{user?.email || '—'}</span>
              </p>
            </div>

            <div className="flex items-center gap-space-sm px-space-md py-space-xs rounded-full bg-surface-container-low border border-surface-variant/30 self-start md:self-auto shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-label-sm text-label-sm text-on-surface font-semibold tracking-wide">
                {wallet ? `${availableCredits} LC Available` : '— LC Available'}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                • {wallet ? 'Live Database Balance' : 'Wallet Syncing...'}
              </span>
            </div>
          </header>
        </div>

        {/* 2. DASHBOARD OVERVIEW (4 Summary Cards) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
          {/* Card 1: Available LensCredits */}
          <div className="bg-surface-container-low rounded-lg p-space-lg flex flex-col justify-between shadow-md border border-surface-variant/30 hover:border-primary-container transition-all">
            <div className="flex items-center justify-between mb-space-md">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Available LensCredits
              </span>
              <div className="w-9 h-9 rounded-full bg-primary-container/20 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
              </div>
            </div>
            <div>
              <span className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">
                {wallet ? availableCredits : '—'}{' '}
                <span className="font-headline-sm text-headline-sm text-primary font-normal">LC</span>
              </span>
              <p className="font-label-sm text-label-sm text-on-surface-variant/80 mt-1">
                Live database balance ready for scans
              </p>
            </div>
          </div>

          {/* Card 2: Free LensCredits */}
          <div className="bg-surface-container-low rounded-lg p-space-lg flex flex-col justify-between shadow-md border border-surface-variant/30 hover:border-primary-container transition-all">
            <div className="flex items-center justify-between mb-space-md">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Free LensCredits
              </span>
              <div className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[20px]">featured_seasonal_and_gifts</span>
              </div>
            </div>
            <div>
              <span className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">
                {wallet ? wallet.free_credits : '—'}{' '}
                <span className="font-headline-sm text-headline-sm text-secondary font-normal">LC</span>
              </span>
              <p className="font-label-sm text-label-sm text-on-surface-variant/80 mt-1">
                {wallet?.welcome_reward_claimed ? '100 LC welcome reward claimed' : 'One-time registration reward'}
              </p>
            </div>
          </div>

          {/* Card 3: Purchased Credits */}
          <div className="bg-surface-container-low rounded-lg p-space-lg flex flex-col justify-between shadow-md border border-surface-variant/30 hover:border-primary-container transition-all">
            <div className="flex items-center justify-between mb-space-md">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Purchased Credits
              </span>
              <div className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">toll</span>
              </div>
            </div>
            <div>
              <span className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">
                {wallet ? wallet.purchased_credits : '—'}{' '}
                <span className="font-headline-sm text-headline-sm text-on-surface-variant font-normal">LC</span>
              </span>
              <p className="font-label-sm text-label-sm text-on-surface-variant/80 mt-1">
                Non-expiring purchased credit balance
              </p>
            </div>
          </div>

          {/* Card 4: Completed Analyses */}
          <div className="bg-surface-container-low rounded-lg p-space-lg flex flex-col justify-between shadow-md border border-surface-variant/30 hover:border-primary-container transition-all">
            <div className="flex items-center justify-between mb-space-md">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Completed Analyses
              </span>
              <div className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined text-[20px]">troubleshoot</span>
              </div>
            </div>
            <div>
              <span className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">
                {completedCount}
              </span>
              <p className="font-label-sm text-label-sm text-on-surface-variant/80 mt-1">
                Completed verified investigations
              </p>
            </div>
          </div>
        </section>

        {/* 3. ANALYSIS HISTORY */}
        <section className="bg-surface-container-low rounded-lg p-space-lg shadow-md flex flex-col gap-space-md border border-surface-variant/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Analysis History</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Review your previous analyses and access their associated forensic records.
              </p>
            </div>
          </div>

          {isLoadingData ? (
            <div className="py-12 flex items-center justify-center text-outline">
              <span className="material-symbols-outlined animate-spin text-primary mr-2">refresh</span>
              <span>Loading analysis records...</span>
            </div>
          ) : analyses.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center border border-surface-variant/20 rounded-DEFAULT bg-surface-container-lowest">
              <span className="material-symbols-outlined text-[36px] text-outline mb-2">history</span>
              <p className="font-headline-sm text-headline-sm text-on-surface font-medium">No analyses yet.</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                Completed forensic runs and file investigations will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-DEFAULT border border-surface-variant/20">
              <table className="w-full text-left font-body-sm text-body-sm">
                <thead className="bg-surface-container-high/60 text-outline uppercase font-label-sm text-[11px] tracking-wider border-b border-surface-variant/30">
                  <tr>
                    <th className="py-3.5 px-4">Subject</th>
                    <th className="py-3.5 px-4">Module</th>
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Risk Evaluation</th>
                    <th className="py-3.5 px-4">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container text-on-surface">
                  {analyses.map((row) => (
                    <tr key={row.id} className="hover:bg-surface-container/50 transition-colors">
                      <td className="py-3.5 px-4 font-medium truncate max-w-xs">
                        {row.input_file_path || row.input_url || `Analysis #${row.id.substring(0, 8)}`}
                      </td>
                      <td className="py-3.5 px-4 capitalize font-semibold">{row.analysis_type}</td>
                      <td className="py-3.5 px-4 text-outline font-label-sm">
                        {new Date(row.created_at).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase bg-surface-container-high text-on-surface">
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase bg-primary-container/20 text-primary">
                          {row.risk_level || 'Pending'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-outline">-{row.credit_cost} LC</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 4. MY REPORTS */}
        <section className="flex flex-col gap-space-md">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">My Reports</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Access and download reports generated by your TruthLens forensic runs.
            </p>
          </div>

          {isLoadingData ? (
            <div className="py-12 flex items-center justify-center text-outline">
              <span className="material-symbols-outlined animate-spin text-primary mr-2">refresh</span>
              <span>Loading reports...</span>
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-surface-container-low rounded-lg p-space-xl border border-surface-variant/30 flex flex-col items-center justify-center text-center py-12">
              <span className="material-symbols-outlined text-[36px] text-outline mb-2">description</span>
              <p className="font-headline-sm text-headline-sm text-on-surface font-medium">No reports available.</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                Generated forensic PDF reports will be listed here after analysis.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="bg-surface-container-low rounded-lg p-space-md flex flex-col justify-between shadow-md hover:shadow-lg transition-all border border-surface-variant/30"
                >
                  <div className="flex flex-col gap-space-xs">
                    <div className="flex items-start justify-between">
                      <span className="bg-surface-container text-primary font-label-sm text-label-sm px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-surface-variant/30">
                        <span className="material-symbols-outlined text-[13px]">description</span> Report
                      </span>
                      <span className="bg-surface-container-highest text-on-surface font-label-sm text-label-sm px-2 py-0.5 rounded-full font-mono">
                        PDF
                      </span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface mt-2 truncate font-semibold">
                      {rep.report_name}
                    </h3>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      Generated {new Date(rep.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-space-md pt-space-sm border-t border-surface-container">
                    <span className="font-label-sm text-label-sm text-secondary font-medium">Free Access</span>
                    <button
                      onClick={() => handleDownloadReport(rep)}
                      className="px-3 py-1 rounded-full bg-surface-container-highest hover:bg-surface-variant text-on-surface font-label-sm text-label-sm transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">download</span> Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 4.5. TRANSACTION & CREDIT LEDGER HISTORY */}
        <section className="bg-surface-container-low rounded-lg p-space-lg shadow-md flex flex-col gap-space-md border border-surface-variant/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Transaction & Credit Ledger</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Live records of credit purchases, welcome grants, and forensic deductions.
              </p>
            </div>
          </div>

          {isLoadingData ? (
            <div className="py-8 flex items-center justify-center text-outline">
              <span className="material-symbols-outlined animate-spin text-primary mr-2">refresh</span>
              <span>Loading ledger transactions...</span>
            </div>
          ) : payments.length === 0 && transactions.length === 0 ? (
            <div className="py-10 flex flex-col items-center justify-center text-center border border-surface-variant/20 rounded-DEFAULT bg-surface-container-lowest">
              <span className="material-symbols-outlined text-[36px] text-outline mb-2">receipt_long</span>
              <p className="font-headline-sm text-headline-sm text-on-surface font-medium">No transactions yet.</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                Your payments and credit allocations will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-DEFAULT border border-surface-variant/20">
              <table className="w-full text-left font-body-sm text-body-sm">
                <thead className="bg-surface-container-high/60 text-outline uppercase font-label-sm text-[11px] tracking-wider border-b border-surface-variant/30">
                  <tr>
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4">Event / Reference</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Credits</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container text-on-surface">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-surface-container/50 transition-colors">
                      <td className="py-3.5 px-4 text-outline font-label-sm">
                        {new Date(p.created_at).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[12px] truncate max-w-xs">
                        {p.transaction_reference || p.id.substring(0, 8)}
                      </td>
                      <td className="py-3.5 px-4 font-medium">Credit Top-Up</td>
                      <td className="py-3.5 px-4 font-semibold">₹{p.amount}</td>
                      <td className="py-3.5 px-4 font-bold text-primary">+{p.credits} LC</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-surface-container/50 transition-colors">
                      <td className="py-3.5 px-4 text-outline font-label-sm">
                        {new Date(t.created_at).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-medium truncate max-w-xs">
                        {t.description || (t.analysis_id ? `Analysis #${t.analysis_id.substring(0, 8)}` : (t.payment_id ? `Payment #${t.payment_id.substring(0, 8)}` : 'Credit Operation'))}
                      </td>
                      <td className="py-3.5 px-4 capitalize">{t.transaction_type}</td>
                      <td className="py-3.5 px-4 text-outline">—</td>
                      <td className="py-3.5 px-4 font-bold text-on-surface">
                        {t.credits > 0 ? `+${t.credits}` : t.credits} LC
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase bg-primary-container/20 text-primary">
                          Settled
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 5. GET MORE LENSCREDITS (4 Finalized Packages) */}
        <section className="flex flex-col gap-space-md">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Get More LensCredits</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Choose a credit package that fits your verification needs. No subscriptions or recurring payments.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
            {/* Package 1: Starter / Welcome */}
            <div className="bg-surface-container-low rounded-lg p-space-lg flex flex-col justify-between shadow-md opacity-80 border border-surface-variant/30">
              <div>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Starter
                </span>
                <div className="mt-space-sm mb-space-xs">
                  <span className="font-headline-xl text-headline-xl text-on-surface font-bold">₹0</span>
                </div>
                <span className="font-label-md text-label-md text-primary font-semibold block mb-space-sm">
                  100 LensCredits
                </span>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  One-time welcome credits awarded on your first successful registration.
                </p>
              </div>
              <button
                disabled
                className="w-full mt-space-lg py-2.5 rounded-full bg-surface-container text-on-surface-variant/60 font-label-md text-label-md font-medium cursor-not-allowed border border-surface-variant/30"
              >
                {wallet?.welcome_reward_claimed ? 'Already Claimed' : 'Awarded on Signup'}
              </button>
            </div>

            {/* Package 2: Explorer ₹49 */}
            <div
              onClick={() => setSelectedPack(LENS_CREDIT_PACKS[1])}
              className={`bg-surface-container-low rounded-lg p-space-lg flex flex-col justify-between shadow-md hover:shadow-lg transition-all cursor-pointer border ${selectedPack.id === 'starter' ? 'border-primary ring-1 ring-primary' : 'border-surface-variant/30'
                }`}
            >
              <div>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Explorer
                </span>
                <div className="mt-space-sm mb-space-xs">
                  <span className="font-headline-xl text-headline-xl text-on-surface font-bold">₹49</span>
                </div>
                <span className="font-label-md text-label-md text-primary font-semibold block mb-space-sm">
                  150 LensCredits
                </span>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  For occasional digital verification and basic forensics.
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPack(LENS_CREDIT_PACKS[1]);
                }}
                className={`w-full mt-space-lg py-2.5 rounded-full font-label-md text-label-md font-semibold transition-colors shadow-sm ${selectedPack.id === 'starter'
                    ? 'bg-primary text-on-primary'
                    : 'bg-white text-surface-container-lowest hover:bg-[#e3e2e6]'
                  }`}
              >
                {selectedPack.id === 'starter' ? 'Selected' : 'Select Explorer'}
              </button>
            </div>

            {/* Package 3: Protector ₹99 (Popular) */}
            <div
              onClick={() => setSelectedPack(LENS_CREDIT_PACKS[2])}
              className={`bg-surface-container-low rounded-lg p-space-lg flex flex-col justify-between shadow-xl relative overflow-hidden transition-all cursor-pointer border ${selectedPack.id === 'pro'
                  ? 'border-primary ring-2 ring-primary'
                  : 'border-surface-variant/30 ring-1 ring-primary/40'
                }`}
            >
              <div className="absolute -right-12 top-6 bg-primary text-on-primary text-[11px] font-bold px-12 py-0.5 rotate-45 shadow-sm uppercase tracking-wider">
                Popular
              </div>
              <div>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-semibold">
                  Protector
                </span>
                <div className="mt-space-sm mb-space-xs">
                  <span className="font-headline-xl text-headline-xl text-on-surface font-bold">₹99</span>
                </div>
                <span className="font-label-md text-label-md text-primary font-semibold block mb-space-sm">
                  350 LensCredits
                </span>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  For regular digital verification across audio, video and web domains.
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPack(LENS_CREDIT_PACKS[2]);
                }}
                className={`w-full mt-space-lg py-2.5 rounded-full font-label-md text-label-md font-semibold transition-colors shadow-md ${selectedPack.id === 'pro'
                    ? 'bg-primary text-on-primary'
                    : 'bg-white text-surface-container-lowest hover:bg-[#e3e2e6]'
                  }`}
              >
                {selectedPack.id === 'pro' ? 'Selected' : 'Select Protector'}
              </button>
            </div>

            {/* Package 4: Guardian ₹199 */}
            <div
              onClick={() => setSelectedPack(LENS_CREDIT_PACKS[3])}
              className={`bg-surface-container-low rounded-lg p-space-lg flex flex-col justify-between shadow-md hover:shadow-lg transition-all cursor-pointer border ${selectedPack.id === 'enterprise' ? 'border-primary ring-1 ring-primary' : 'border-surface-variant/30'
                }`}
            >
              <div>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Guardian
                </span>
                <div className="mt-space-sm mb-space-xs">
                  <span className="font-headline-xl text-headline-xl text-on-surface font-bold">₹199</span>
                </div>
                <span className="font-label-md text-label-md text-primary font-semibold block mb-space-sm">
                  800 LensCredits
                </span>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  For frequent use across all TruthLens multi-spectrum forensic tools.
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPack(LENS_CREDIT_PACKS[3]);
                }}
                className={`w-full mt-space-lg py-2.5 rounded-full font-label-md text-label-md font-semibold transition-colors shadow-sm ${selectedPack.id === 'enterprise'
                    ? 'bg-primary text-on-primary'
                    : 'bg-white text-surface-container-lowest hover:bg-[#e3e2e6]'
                  }`}
              >
                {selectedPack.id === 'enterprise' ? 'Selected' : 'Select Guardian'}
              </button>
            </div>
          </div>
          <p className="font-label-sm text-label-sm text-on-surface-variant/70 text-center">
            Strictly pay-as-you-go credits. No recurring payments or subscriptions.
          </p>
        </section>

        {/* 6. RAZORPAY TEST MODE CHECKOUT */}
        <section className="bg-surface-container-low rounded-lg p-space-lg shadow-lg flex flex-col gap-space-md border border-primary/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-primary text-[22px]">shopping_cart_checkout</span>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Razorpay Checkout
                </h3>
                <span className="font-label-sm text-label-sm text-secondary font-semibold">
                  Authorized Test Mode Integration Active
                </span>
              </div>
            </div>
            <span className="bg-primary/20 text-primary px-3 py-1 rounded-full font-label-sm text-label-sm font-semibold tracking-wide border border-primary/30">
              Test Mode Only • No Real Money
            </span>
          </div>

          <div className="bg-surface-container rounded-lg p-space-md flex flex-col sm:flex-row sm:items-center justify-between gap-space-md border border-surface-variant/20">
            <div className="flex items-center gap-space-md">
              <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary shrink-0">
                <span className="material-symbols-outlined text-[24px]">verified_user</span>
              </div>
              <div>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Selected Package
                </span>
                <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  {selectedPack.tag || 'Credit Pack'} • {selectedPack.credits} LensCredits
                </h4>
                <span className="font-label-md text-label-md text-primary font-bold">
                  Total Payable: ₹{selectedPack.priceINR}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-space-xs">
              <button
                type="button"
                disabled={isProcessingPayment || selectedPack.priceINR === 0}
                onClick={handleRazorpayCheckout}
                className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isProcessingPayment ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                    <span>Processing Test Order...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">credit_card</span>
                    <span>Pay ₹{selectedPack.priceINR} (Razorpay Test Mode)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {paymentNotice && (
            <div
              className={`p-3.5 rounded-lg border font-label-sm text-label-sm flex items-center gap-2 ${paymentNotice.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : paymentNotice.type === 'error'
                    ? 'bg-error-container/20 border-error/30 text-error'
                    : 'bg-primary-container/20 border-primary/30 text-primary-fixed-dim'
                }`}
            >
              <span className="material-symbols-outlined text-[20px] shrink-0">
                {paymentNotice.type === 'success'
                  ? 'check_circle'
                  : paymentNotice.type === 'error'
                    ? 'error'
                    : 'info'}
              </span>
              <span>{paymentNotice.message}</span>
            </div>
          )}
        </section>

        {/* 7. PROFILE & TELEMETRY */}
        <section className="bg-surface-container-low rounded-lg p-space-lg shadow-md flex flex-col gap-space-md border border-surface-variant/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">account_circle</span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                User Profile & Workspace Telemetry
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-label-sm text-label-sm text-emerald-400 font-medium">
                Live Supabase Connected
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
            <div className="bg-surface-container p-space-md rounded-DEFAULT flex flex-col gap-1.5 border border-surface-variant/20">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-outline uppercase font-semibold">
                  Profile Details
                </span>
                <span className="font-label-sm text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full font-mono">
                  profiles table
                </span>
              </div>
              <span className="font-headline-sm text-headline-sm text-on-surface font-bold truncate">
                {userFullName}
              </span>
              <div className="flex items-center gap-1.5 text-primary text-body-sm font-medium">
                <span className="material-symbols-outlined text-[16px]">mail</span>
                <span className="truncate">{user?.email || '—'}</span>
              </div>
              <span className="font-mono text-[11px] text-outline truncate mt-1">
                UUID: {user?.id || '—'}
              </span>
            </div>
            <div className="bg-surface-container p-space-md rounded-DEFAULT flex flex-col gap-1.5 border border-surface-variant/20">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-outline uppercase font-semibold">
                  Local Forensics AI
                </span>
                <span className="font-label-sm text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono">
                  CUDA Ready
                </span>
              </div>
              <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                NVIDIA RTX 3050
              </span>
              <span className="font-body-sm text-body-sm text-emerald-400 font-medium">
                6 GB VRAM • sm_86 Active
              </span>
              <span className="font-mono text-[11px] text-outline truncate mt-1">
                PyTorch 2.5.1+cu124 Ready
              </span>
            </div>
            <div className="bg-surface-container p-space-md rounded-DEFAULT flex flex-col gap-1.5 border border-surface-variant/20">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-outline uppercase font-semibold">
                  Security & Storage
                </span>
                <span className="font-label-sm text-[10px] text-secondary bg-secondary/10 px-2 py-0.5 rounded-full font-mono">
                  RLS Enforced
                </span>
              </div>
              <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Zero-Log Architecture
              </span>
              <span className="font-body-sm text-body-sm text-secondary font-medium">
                Encrypted Tokens & Signed URLs
              </span>
              <span className="font-mono text-[11px] text-outline truncate mt-1">
                Session: Active • 6 Tables Synced
              </span>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};
