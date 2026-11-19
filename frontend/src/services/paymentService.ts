import { supabase } from '../lib/supabase';
import { CreditPack, Payment, CreditTransaction } from '../types/database';

export interface RazorpayOrderResponse {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  payment_id_internal?: string;
}

export interface RazorpayVerificationPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  amount: number;
  credits: number;
}

export interface RazorpayVerificationResult {
  success: boolean;
  message: string;
  credits_added?: number;
  new_balance?: number;
}

/**
 * Dynamically loads the official Razorpay Checkout SDK.
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof (window as any).Razorpay === 'function') {
      resolve(true);
      return;
    }

    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]') as HTMLScriptElement | null;
    if (existing) {
      if (typeof (window as any).Razorpay === 'function') {
        resolve(true);
        return;
      }
      existing.addEventListener('load', () => resolve(typeof (window as any).Razorpay === 'function'), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
      setTimeout(() => resolve(typeof (window as any).Razorpay === 'function'), 1500);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(typeof (window as any).Razorpay === 'function');
    script.onerror = () => {
      script.remove();
      resolve(false);
    };

    document.head.appendChild(script);
  });
}

export async function createRazorpayOrder(
  pack: CreditPack,
  _userId: string
): Promise<{ data: RazorpayOrderResponse | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.functions.invoke('purchase-credits', {
      body: { action: 'create_order', amount: pack.priceINR, credits: pack.credits },
    });
    if (error) return { data: null, error };
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function verifyRazorpayPayment(
  payload: RazorpayVerificationPayload
): Promise<{ data: RazorpayVerificationResult | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.functions.invoke('purchase-credits', {
      body: {
        action: 'verify_payment',
        order_id: payload.razorpay_order_id,
        payment_id: payload.razorpay_payment_id,
        signature: payload.razorpay_signature,
      },
    });
    if (error) return { data: null, error };
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function getUserPayments(
  userId: string
): Promise<{ data: Payment[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return { data: [], error };
    return { data: (data as Payment[]) || [], error: null };
  } catch (err: any) {
    return { data: [], error: err };
  }
}

export async function getUserCreditTransactions(
  userId: string
): Promise<{ data: CreditTransaction[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return { data: [], error };
    return { data: (data as CreditTransaction[]) || [], error: null };
  } catch (err: any) {
    return { data: [], error: err };
  }
}
