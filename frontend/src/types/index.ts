export type AnalysisType =
  | 'image'
  | 'audio'
  | 'video'
  | 'linklens'
  | 'websentinel'
  | 'qrguard'
  | 'reorigin';

export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export type RiskLevel = 'low' | 'medium' | 'high' | 'unknown';

export interface AnalysisRecord {
  id: string;
  user_id?: string;
  analysis_type: AnalysisType;
  input_file_path?: string;
  input_url?: string;
  status: AnalysisStatus;
  risk_score?: number | null;
  risk_level?: RiskLevel;
  result?: any;
  credit_cost: number;
  created_at: string;
  completed_at?: string;
}

export interface WalletState {
  free_credits: number;
  purchased_credits: number;
  total_credits: number;
  welcome_reward_claimed: boolean;
}

export interface CreditPack {
  id: string;
  priceINR: number;
  credits: number;
  popular?: boolean;
  tag?: string;
}

export const LENS_CREDIT_PACKS: CreditPack[] = [
  { id: 'welcome', priceINR: 0, credits: 100, tag: 'One-time Welcome Gift' },
  { id: 'starter', priceINR: 49, credits: 150 },
  { id: 'pro', priceINR: 99, credits: 350, popular: true, tag: 'Most Popular' },
  { id: 'enterprise', priceINR: 199, credits: 800, tag: 'Best Value' },
];

export const FEATURE_COSTS: Record<AnalysisType, number> = {
  image: 5,
  audio: 10,
  video: 20,
  linklens: 15,
  websentinel: 20,
  qrguard: 10,
  reorigin: 25,
};
