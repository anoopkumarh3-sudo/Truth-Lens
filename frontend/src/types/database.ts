export interface CreditPack {
  id: string;
  priceINR: number;
  credits: number;
  popular?: boolean;
  tag?: string;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  user_id: string;
  free_credits: number;
  purchased_credits: number;
  reserved_free_credits: number;
  reserved_purchased_credits: number;
  welcome_reward_claimed: boolean;
  last_daily_reward: string | null;
  created_at: string;
  updated_at: string;
}

export type AnalysisType =
  | 'image'
  | 'audio'
  | 'video'
  | 'linklens'
  | 'websentinel'
  | 'qrguard'
  | 'reorigin';

export type AnalysisStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type RiskLevel = 'low' | 'medium' | 'high' | 'unknown';

export type CreditStatus = 'unreserved' | 'reserved' | 'settled' | 'released';

export interface Analysis {
  id: string;
  user_id: string;
  analysis_type: AnalysisType;
  input_file_path: string | null;
  input_url: string | null;
  status: AnalysisStatus;
  risk_score: number | null;
  risk_level: RiskLevel | null;
  result: Json | null;
  credit_cost: number;
  reserved_free_credits: number;
  reserved_purchased_credits: number;
  credit_status: CreditStatus;
  idempotency_key: string | null;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface Report {
  id: string;
  user_id: string;
  analysis_id: string;
  report_name: string;
  file_path: string;
  created_at: string;
}

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  credits: number;
  payment_method: string | null;
  status: PaymentStatus;
  transaction_reference: string;
  created_at: string;
  completed_at: string | null;
}

export type CreditSource = 'free' | 'purchased';

export type TransactionType =
  | 'welcome_reward'
  | 'daily_reward'
  | 'purchase'
  | 'reservation'
  | 'deduction'
  | 'refund';

export interface CreditTransaction {
  id: string;
  user_id: string;
  analysis_id: string | null;
  payment_id: string | null;
  transaction_type: TransactionType;
  credit_source: CreditSource;
  credits: number;
  description: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      wallets: {
        Row: Wallet;
        Insert: {
          user_id: string;
          free_credits?: number;
          purchased_credits?: number;
          reserved_free_credits?: number;
          reserved_purchased_credits?: number;
          welcome_reward_claimed?: boolean;
          last_daily_reward?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          free_credits?: number;
          purchased_credits?: number;
          reserved_free_credits?: number;
          reserved_purchased_credits?: number;
          welcome_reward_claimed?: boolean;
          last_daily_reward?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      analyses: {
        Row: Analysis;
        Insert: Partial<Analysis> & {
          user_id: string;
          analysis_type: AnalysisType;
          credit_cost: number;
        };
        Update: Partial<Analysis>;
        Relationships: [];
      };
      reports: {
        Row: Report;
        Insert: Partial<Report> & {
          user_id: string;
          analysis_id: string;
          report_name: string;
          file_path: string;
        };
        Update: Partial<Report>;
        Relationships: [];
      };
      payments: {
        Row: Payment;
        Insert: Partial<Payment> & {
          user_id: string;
          amount: number;
          currency: string;
          credits: number;
          transaction_reference: string;
        };
        Update: Partial<Payment>;
        Relationships: [];
      };
      credit_transactions: {
        Row: CreditTransaction;
        Insert: Partial<CreditTransaction> & {
          user_id: string;
          transaction_type: TransactionType;
          credit_source: CreditSource;
          credits: number;
        };
        Update: Partial<CreditTransaction>;
        Relationships: [];
      };
    };
    Functions: {
      get_credit_cost: {
        Args: { p_analysis_type: string };
        Returns: number | null;
      };
      initialize_wallet: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
      reserve_credits: {
        Args: { p_analysis_id: string };
        Returns: boolean;
      };
      settle_credits: {
        Args: { p_analysis_id: string };
        Returns: boolean;
      };
      release_credits: {
        Args: { p_analysis_id: string };
        Returns: boolean;
      };
      add_purchased_credits: {
        Args: { p_payment_id: string };
        Returns: boolean;
      };
      process_credit_purchase: {
        Args: { p_user_id: string; p_amount: number; p_request_id: string };
        Returns: boolean;
      };
    };
  };
}
