export interface TransactionHop {
  hop_level: number;
  from_account: string;
  to_account: string;
  beneficiary_name: string;
  bank_name: string;
  amount_inr: number;
  timestamp: string;
  mule_risk_score: number;
  is_terminal_cashout_account: boolean;
}

export interface MuleTrail {
  complaint_id: string;
  total_stolen_inr: number;
  hops: TransactionHop[];
  terminal_mule_account: string;
  terminal_mule_name: string;
  terminal_bank: string;
  terminal_branch_city: string;
  terminal_branch_lat: number;
  terminal_branch_lon: number;
  transaction_velocity_score: number;
  estimated_cashout_window_minutes: number;
}

export interface PredictedATM {
  atm_id: string;
  operator_or_bank: string;
  address: string;
  latitude: number;
  longitude: number;
  distance_from_anchor_km: number;
  probability_score: number;
  recommended_intercept_window: string;
  google_maps_url: string;
}

export interface InterceptForecastResponse {
  complaint_id: string;
  fraud_category: string;
  stolen_amount: number;
  mule_trail: MuleTrail;
  top_predicted_atms: PredictedATM[];
  recommended_police_jurisdiction: string;
  action_priority: string;
  analysis_time_seconds: number;
}

export interface CyberComplaint {
  complaint_id: string;
  victim_name: string;
  victim_upi_or_account: string;
  victim_city: string;
  fraud_category: string;
  stolen_amount_inr: number;
  reported_timestamp: string;
  initial_beneficiary_account: string;
}
