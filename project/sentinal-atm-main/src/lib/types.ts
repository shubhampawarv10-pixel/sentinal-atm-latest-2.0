export type UserRole = 'admin' | 'investigator' | 'analyst'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  jurisdiction: string
  callsign: string
  created_at: string
}

export interface ATM {
  id: string
  atm_id: string
  operator: string
  address: string
  city: string
  state: string
  latitude: number
  longitude: number
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  risk_score: number
  is_24x7: boolean
  created_at: string
}

export interface Complaint {
  id: string
  complaint_id: string
  victim_name: string
  victim_upi_or_account: string | null
  victim_phone: string | null
  victim_city: string
  fraud_category: string
  stolen_amount_inr: number
  reported_timestamp: string
  initial_beneficiary_account: string | null
  status: 'new' | 'analyzing' | 'predicted' | 'alerted' | 'dispatched' | 'intercepted' | 'closed'
  risk_score: number
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  predicted_atm_id: string | null
  predicted_atm_name: string | null
  intercept_window_minutes: number
  assigned_unit: string | null
  assigned_officer: string | null
  user_id: string | null
  created_at: string
}

export interface TransactionHop {
  id: string
  complaint_id: string
  hop_level: number
  from_account: string
  to_account: string
  beneficiary_name: string | null
  bank_name: string
  amount_inr: number
  timestamp: string
  mule_risk_score: number
  is_terminal_cashout: boolean
  created_at: string
}

export interface Prediction {
  id: string
  complaint_id: string
  atm_id: string
  atm_operator: string
  atm_address: string | null
  latitude: number | null
  longitude: number | null
  distance_km: number
  probability_score: number
  recommended_intercept_window: string | null
  recommended_jurisdiction: string | null
  action_priority: string | null
  analysis_time_seconds: number
  created_at: string
}

export interface PredictionFactor {
  id: string
  prediction_id: string
  factor_name: string
  factor_weight: number
  factor_description: string | null
  created_at: string
}

export interface Alert {
  id: string
  alert_id: string
  complaint_id: string | null
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string | null
  location: string | null
  latitude: number | null
  longitude: number | null
  eta_minutes: number
  recommended_action: string | null
  status: 'active' | 'acknowledged' | 'dispatched' | 'resolved' | 'expired'
  created_by: string | null
  created_at: string
  acknowledged_at: string | null
  resolved_at: string | null
}

export interface NetworkEntity {
  id: string
  complaint_id: string | null
  entity_id: string
  entity_type: 'complaint' | 'phone' | 'account' | 'mule' | 'bank' | 'atm' | 'victim'
  label: string
  sub_label: string | null
  risk_score: number
  metadata: Record<string, unknown>
  created_at: string
}

export interface NetworkLink {
  id: string
  complaint_id: string | null
  source_entity_id: string
  target_entity_id: string
  link_type: 'transfer' | 'calls' | 'owns' | 'linked' | 'reported' | 'located_at'
  amount_inr: number
  label: string | null
  created_at: string
}

export interface Evidence {
  id: string
  complaint_id: string | null
  file_name: string
  file_type: string | null
  file_size_bytes: number
  sha256_hash: string
  storage_path: string | null
  uploaded_by: string | null
  description: string | null
  metadata: Record<string, unknown>
  section_65b_ref: string | null
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string | null
  user_email: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  details: Record<string, unknown>
  ip_address: string | null
  created_at: string
}

export interface Dispatch {
  id: string
  dispatch_id: string
  complaint_id: string
  atm_id: string | null
  atm_name: string | null
  police_station: string
  officer_callsign: string
  status: 'dispatched' | 'en_route' | 'on_scene' | 'intercepted' | 'failed' | 'cancelled'
  channel: 'telegram' | 'whatsapp' | 'sms' | 'radio'
  delivery_note: string | null
  dispatched_by: string | null
  dispatched_at: string
  arrived_at: string | null
}

export interface InterceptForecast {
  complaint_id: string
  fraud_category: string
  stolen_amount: number
  mule_trail: MuleTrail
  top_predicted_atms: PredictedATM[]
  recommended_police_jurisdiction: string
  action_priority: string
  analysis_time_seconds: number
}

export interface MuleTrail {
  complaint_id: string
  total_stolen_inr: number
  hops: TransactionHopData[]
  terminal_mule_account: string
  terminal_mule_name: string
  terminal_bank: string
  terminal_branch_city: string
  terminal_branch_lat: number
  terminal_branch_lon: number
  transaction_velocity_score: number
  estimated_cashout_window_minutes: number
}

export interface TransactionHopData {
  hop_level: number
  from_account: string
  to_account: string
  beneficiary_name: string
  bank_name: string
  amount_inr: number
  timestamp: string
  mule_risk_score: number
  is_terminal_cashout_account: boolean
}

export interface PredictedATM {
  atm_id: string
  operator_or_bank: string
  address: string
  latitude: number
  longitude: number
  distance_from_anchor_km: number
  probability_score: number
  recommended_intercept_window: string
  google_maps_url: string
}

export interface RiskFactor {
  factor_name: string
  factor_weight: number
  factor_description: string
}
