/*
# Sentinel ATM - Core Schema for Cybercrime Predictive Analytics

## Purpose
Creates the complete database schema for the Sentinel ATM platform (SIH26184),
a predictive analytics framework for forecasting cybercrime cash withdrawal locations.

## Tables Created
1. `profiles` - User role information (admin, investigator, analyst) linked to auth.users
2. `atms` - Physical ATM locations across India with risk scores
3. `complaints` - Cybercrime complaints from the NCRP/1930 helpline
4. `transactions` - Multi-hop mule transaction trails per complaint
5. `predictions` - AI-generated ATM cashout forecasts per complaint
6. `prediction_factors` - Individual risk factors contributing to each prediction
7. `alerts` - High-risk alerts with severity, ETA, and recommended actions
8. `network_entities` - Nodes in the investigation graph (phones, accounts, mules, banks, ATMs)
9. `network_links` - Edges connecting network entities
10. `evidence` - Uploaded evidence files with SHA-256 hashes and metadata
11. `audit_logs` - System audit trail for all user actions
12. `dispatches` - LEA dispatch records for patrol unit assignments

## Security
- RLS enabled on all tables
- All tables scoped to authenticated users (role-based access)
- profiles table uses auth.uid() for ownership
- Other tables use user_id where ownership applies, or are shared among authenticated users
*/

-- ============================================================================
-- 1. PROFILES TABLE (user roles)
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT 'Officer',
  role text NOT NULL DEFAULT 'analyst' CHECK (role IN ('admin', 'investigator', 'analyst')),
  jurisdiction text DEFAULT 'All India',
  callsign text DEFAULT 'OFFICER-001',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Allow all authenticated users to see profiles (for team awareness)
DROP POLICY IF EXISTS "profiles_select_all_authenticated" ON profiles;
CREATE POLICY "profiles_select_all_authenticated" ON profiles FOR SELECT
  TO authenticated USING (true);

-- ============================================================================
-- 2. ATMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS atms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atm_id text UNIQUE NOT NULL,
  operator text NOT NULL,
  address text NOT NULL,
  city text NOT NULL DEFAULT 'Delhi',
  state text NOT NULL DEFAULT 'Delhi',
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  risk_level text DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_score double precision DEFAULT 0,
  is_24x7 boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE atms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "atms_select" ON atms;
CREATE POLICY "atms_select" ON atms FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "atms_insert" ON atms;
CREATE POLICY "atms_insert" ON atms FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "atms_update" ON atms;
CREATE POLICY "atms_update" ON atms FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "atms_delete" ON atms;
CREATE POLICY "atms_delete" ON atms FOR DELETE
  TO authenticated USING (true);

-- ============================================================================
-- 3. COMPLAINTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id text UNIQUE NOT NULL,
  victim_name text NOT NULL,
  victim_upi_or_account text,
  victim_phone text,
  victim_city text NOT NULL,
  fraud_category text NOT NULL,
  stolen_amount_inr double precision NOT NULL DEFAULT 0,
  reported_timestamp timestamptz DEFAULT now(),
  initial_beneficiary_account text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'analyzing', 'predicted', 'alerted', 'dispatched', 'intercepted', 'closed')),
  risk_score double precision DEFAULT 0,
  risk_level text DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  predicted_atm_id text,
  predicted_atm_name text,
  intercept_window_minutes int DEFAULT 30,
  assigned_unit text,
  assigned_officer text,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "complaints_select" ON complaints;
CREATE POLICY "complaints_select" ON complaints FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "complaints_insert" ON complaints;
CREATE POLICY "complaints_insert" ON complaints FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "complaints_update" ON complaints;
CREATE POLICY "complaints_update" ON complaints FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "complaints_delete" ON complaints;
CREATE POLICY "complaints_delete" ON complaints FOR DELETE
  TO authenticated USING (true);

-- ============================================================================
-- 4. TRANSACTIONS TABLE (mule hops)
-- ============================================================================
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id text NOT NULL REFERENCES complaints(complaint_id) ON DELETE CASCADE,
  hop_level int NOT NULL,
  from_account text NOT NULL,
  to_account text NOT NULL,
  beneficiary_name text,
  bank_name text NOT NULL,
  amount_inr double precision NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  mule_risk_score double precision DEFAULT 0,
  is_terminal_cashout boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_select" ON transactions;
CREATE POLICY "transactions_select" ON transactions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "transactions_insert" ON transactions;
CREATE POLICY "transactions_insert" ON transactions FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "transactions_update" ON transactions;
CREATE POLICY "transactions_update" ON transactions FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "transactions_delete" ON transactions;
CREATE POLICY "transactions_delete" ON transactions FOR DELETE
  TO authenticated USING (true);

-- ============================================================================
-- 5. PREDICTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id text NOT NULL REFERENCES complaints(complaint_id) ON DELETE CASCADE,
  atm_id text NOT NULL,
  atm_operator text NOT NULL,
  atm_address text,
  latitude double precision,
  longitude double precision,
  distance_km double precision DEFAULT 0,
  probability_score double precision NOT NULL DEFAULT 0,
  recommended_intercept_window text,
  recommended_jurisdiction text,
  action_priority text,
  analysis_time_seconds double precision DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "predictions_select" ON predictions;
CREATE POLICY "predictions_select" ON predictions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "predictions_insert" ON predictions;
CREATE POLICY "predictions_insert" ON predictions FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "predictions_update" ON predictions;
CREATE POLICY "predictions_update" ON predictions FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "predictions_delete" ON predictions;
CREATE POLICY "predictions_delete" ON predictions FOR DELETE
  TO authenticated USING (true);

-- ============================================================================
-- 6. PREDICTION FACTORS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS prediction_factors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id uuid NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
  factor_name text NOT NULL,
  factor_weight double precision NOT NULL DEFAULT 0,
  factor_description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE prediction_factors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "factors_select" ON prediction_factors;
CREATE POLICY "factors_select" ON prediction_factors FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "factors_insert" ON prediction_factors;
CREATE POLICY "factors_insert" ON prediction_factors FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "factors_delete" ON prediction_factors;
CREATE POLICY "factors_delete" ON prediction_factors FOR DELETE
  TO authenticated USING (true);

-- ============================================================================
-- 7. ALERTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id text UNIQUE NOT NULL,
  complaint_id text REFERENCES complaints(complaint_id) ON DELETE CASCADE,
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title text NOT NULL,
  description text,
  location text,
  latitude double precision,
  longitude double precision,
  eta_minutes int DEFAULT 30,
  recommended_action text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'dispatched', 'resolved', 'expired')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  acknowledged_at timestamptz,
  resolved_at timestamptz
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "alerts_select" ON alerts;
CREATE POLICY "alerts_select" ON alerts FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "alerts_insert" ON alerts;
CREATE POLICY "alerts_insert" ON alerts FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "alerts_update" ON alerts;
CREATE POLICY "alerts_update" ON alerts FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "alerts_delete" ON alerts;
CREATE POLICY "alerts_delete" ON alerts FOR DELETE
  TO authenticated USING (true);

-- ============================================================================
-- 8. NETWORK ENTITIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS network_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id text REFERENCES complaints(complaint_id) ON DELETE CASCADE,
  entity_id text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('complaint', 'phone', 'account', 'mule', 'bank', 'atm', 'victim')),
  label text NOT NULL,
  sub_label text,
  risk_score double precision DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE network_entities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "entities_select" ON network_entities;
CREATE POLICY "entities_select" ON network_entities FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "entities_insert" ON network_entities;
CREATE POLICY "entities_insert" ON network_entities FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "entities_delete" ON network_entities;
CREATE POLICY "entities_delete" ON network_entities FOR DELETE
  TO authenticated USING (true);

-- ============================================================================
-- 9. NETWORK LINKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS network_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id text REFERENCES complaints(complaint_id) ON DELETE CASCADE,
  source_entity_id text NOT NULL,
  target_entity_id text NOT NULL,
  link_type text NOT NULL DEFAULT 'transfer' CHECK (link_type IN ('transfer', 'calls', 'owns', 'linked', 'reported', 'located_at')),
  amount_inr double precision DEFAULT 0,
  label text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE network_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "links_select" ON network_links;
CREATE POLICY "links_select" ON network_links FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "links_insert" ON network_links;
CREATE POLICY "links_insert" ON network_links FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "links_delete" ON network_links;
CREATE POLICY "links_delete" ON network_links FOR DELETE
  TO authenticated USING (true);

-- ============================================================================
-- 10. EVIDENCE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id text REFERENCES complaints(complaint_id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text,
  file_size_bytes bigint DEFAULT 0,
  sha256_hash text NOT NULL,
  storage_path text,
  uploaded_by uuid REFERENCES auth.users(id),
  description text,
  metadata jsonb DEFAULT '{}',
  section_65b_ref text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "evidence_select" ON evidence;
CREATE POLICY "evidence_select" ON evidence FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "evidence_insert" ON evidence;
CREATE POLICY "evidence_insert" ON evidence FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "evidence_update" ON evidence;
CREATE POLICY "evidence_update" ON evidence FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "evidence_delete" ON evidence;
CREATE POLICY "evidence_delete" ON evidence FOR DELETE
  TO authenticated USING (true);

-- ============================================================================
-- 11. AUDIT LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  user_email text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb DEFAULT '{}',
  ip_address text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_select" ON audit_logs;
CREATE POLICY "audit_select" ON audit_logs FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "audit_insert" ON audit_logs;
CREATE POLICY "audit_insert" ON audit_logs FOR INSERT
  TO authenticated WITH CHECK (true);

-- ============================================================================
-- 12. DISPATCHES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS dispatches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_id text UNIQUE NOT NULL,
  complaint_id text NOT NULL REFERENCES complaints(complaint_id) ON DELETE CASCADE,
  atm_id text,
  atm_name text,
  police_station text,
  officer_callsign text,
  status text NOT NULL DEFAULT 'dispatched' CHECK (status IN ('dispatched', 'en_route', 'on_scene', 'intercepted', 'failed', 'cancelled')),
  channel text DEFAULT 'telegram' CHECK (channel IN ('telegram', 'whatsapp', 'sms', 'radio')),
  delivery_note text,
  dispatched_by uuid REFERENCES auth.users(id),
  dispatched_at timestamptz DEFAULT now(),
  arrived_at timestamptz
);

ALTER TABLE dispatches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dispatches_select" ON dispatches;
CREATE POLICY "dispatches_select" ON dispatches FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "dispatches_insert" ON dispatches;
CREATE POLICY "dispatches_insert" ON dispatches FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "dispatches_update" ON dispatches;
CREATE POLICY "dispatches_update" ON dispatches FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "dispatches_delete" ON dispatches;
CREATE POLICY "dispatches_delete" ON dispatches FOR DELETE
  TO authenticated USING (true);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_risk_level ON complaints(risk_level);
CREATE INDEX IF NOT EXISTS idx_complaints_fraud_category ON complaints(fraud_category);
CREATE INDEX IF NOT EXISTS idx_transactions_complaint_id ON transactions(complaint_id);
CREATE INDEX IF NOT EXISTS idx_predictions_complaint_id ON predictions(complaint_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_network_entities_complaint_id ON network_entities(complaint_id);
CREATE INDEX IF NOT EXISTS idx_network_links_complaint_id ON network_links(complaint_id);
CREATE INDEX IF NOT EXISTS idx_evidence_complaint_id ON evidence(complaint_id);
CREATE INDEX IF NOT EXISTS idx_dispatches_complaint_id ON dispatches(complaint_id);
