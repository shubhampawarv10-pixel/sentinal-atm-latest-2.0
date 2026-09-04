import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Brain, ChevronRight, MapPin, Clock, TrendingUp, AlertTriangle,
  Zap, Target, Navigation, ArrowRight, Database, RotateCcw,
  CheckCircle2, FileSearch,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { seedDemoData } from '../lib/demo-data'
import {
  analyzeMuleTransactionGraph,
  forecastAtmCashoutLocations,
  calculateRiskFactors,
} from '../lib/predictive-engine'
import { formatINR, formatDateTime, timeAgo } from '../lib/utils'
import { LoadingSpinner, EmptyState, RiskBadge, StatusBadge, DemoBadge } from '../components/Shared'
import type { Complaint, TransactionHop, ATM, InterceptForecast, RiskFactor } from '../lib/types'

export default function Predictions() {
  const navigate = useNavigate()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [transactions, setTransactions] = useState<TransactionHop[]>([])
  const [atms, setAtms] = useState<ATM[]>([])
  const [forecast, setForecast] = useState<InterceptForecast | null>(null)
  const [riskFactors, setRiskFactors] = useState<RiskFactor[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [expandedAtm, setExpandedAtm] = useState<string | null>(null)
  const [savedPrediction, setSavedPrediction] = useState(false)

  const loadComplaints = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setComplaints(data as Complaint[])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadComplaints()
  }, [loadComplaints])

  const handleSeed = async () => {
    setSeeding(true)
    await seedDemoData()
    setSeeding(false)
    await loadComplaints()
  }

  const handleSelectComplaint = async (complaint: Complaint) => {
    setSelectedComplaint(complaint)
    setForecast(null)
    setRiskFactors([])
    setSavedPrediction(false)
    setExpandedAtm(null)

    const [txRes, atmRes] = await Promise.all([
      supabase
        .from('transactions')
        .select('*')
        .eq('complaint_id', complaint.complaint_id)
        .order('hop_level', { ascending: true }),
      supabase.from('atms').select('*'),
    ])

    if (txRes.data) setTransactions(txRes.data as TransactionHop[])
    if (atmRes.data) setAtms(atmRes.data as ATM[])
  }

  const handleRunAnalysis = async () => {
    if (!selectedComplaint || transactions.length === 0) return
    setAnalyzing(true)
    setSavedPrediction(false)

    await supabase
      .from('complaints')
      .update({ status: 'analyzing' })
      .eq('complaint_id', selectedComplaint.complaint_id)

    await new Promise((r) => setTimeout(r, 800))

    const hopData = transactions.map((tx) => ({
      hop_level: tx.hop_level,
      from_account: tx.from_account,
      to_account: tx.to_account,
      beneficiary_name: tx.beneficiary_name || 'Unknown',
      bank_name: tx.bank_name,
      amount_inr: tx.amount_inr,
      timestamp: tx.timestamp,
      mule_risk_score: tx.mule_risk_score,
      is_terminal_cashout_account: tx.is_terminal_cashout,
    }))

    const muleTrail = analyzeMuleTransactionGraph(
      selectedComplaint.complaint_id,
      selectedComplaint.stolen_amount_inr,
      hopData
    )

    const atmList = atms.map((a) => ({
      id: a.id,
      atm_id: a.atm_id,
      operator: a.operator,
      address: a.address,
      city: a.city,
      state: a.state,
      latitude: a.latitude,
      longitude: a.longitude,
      risk_level: a.risk_level,
      risk_score: a.risk_score,
      is_24x7: a.is_24x7,
      created_at: a.created_at,
    }))

    const result = forecastAtmCashoutLocations(
      muleTrail,
      selectedComplaint.fraud_category,
      atmList
    )

    const factors = calculateRiskFactors(result, {
      stolen_amount_inr: selectedComplaint.stolen_amount_inr,
      fraud_category: selectedComplaint.fraud_category,
    })

    setForecast(result)
    setRiskFactors(factors)
    setAnalyzing(false)

    const topAtm = result.top_predicted_atms[0]
    if (topAtm) {
      const { data: predData } = await supabase
        .from('predictions')
        .insert({
          complaint_id: selectedComplaint.complaint_id,
          atm_id: topAtm.atm_id,
          atm_operator: topAtm.operator_or_bank,
          atm_address: topAtm.address,
          latitude: topAtm.latitude,
          longitude: topAtm.longitude,
          distance_km: topAtm.distance_from_anchor_km,
          probability_score: topAtm.probability_score,
          recommended_intercept_window: topAtm.recommended_intercept_window,
          recommended_jurisdiction: result.recommended_police_jurisdiction,
          action_priority: result.action_priority,
          analysis_time_seconds: result.analysis_time_seconds,
        })
        .select()
        .single()

      if (predData) {
        for (const factor of factors) {
          await supabase.from('prediction_factors').insert({
            prediction_id: predData.id,
            factor_name: factor.factor_name,
            factor_weight: factor.factor_weight,
            factor_description: factor.factor_description,
          })
        }
      }

      await supabase
        .from('complaints')
        .update({
          status: 'predicted',
          risk_score: topAtm.probability_score,
          risk_level:
            topAtm.probability_score >= 80
              ? 'critical'
              : topAtm.probability_score >= 60
              ? 'high'
              : topAtm.probability_score >= 40
              ? 'medium'
              : 'low',
          predicted_atm_id: topAtm.atm_id,
          predicted_atm_name: topAtm.operator_or_bank,
          intercept_window_minutes: result.mule_trail.estimated_cashout_window_minutes,
        })
        .eq('complaint_id', selectedComplaint.complaint_id)

      setSavedPrediction(true)
      await loadComplaints()
    }
  }

  const handleEscalateAlert = async () => {
    if (!forecast || !selectedComplaint) return
    const topAtm = forecast.top_predicted_atms[0]
    if (!topAtm) return

    await supabase.from('alerts').upsert({
      alert_id: `ALERT-${selectedComplaint.complaint_id.split('-').pop()}`,
      complaint_id: selectedComplaint.complaint_id,
      severity: topAtm.probability_score >= 80 ? 'critical' : 'high',
      title: `Predicted Cashout: ${selectedComplaint.fraud_category}`,
      description: `₹${selectedComplaint.stolen_amount_inr.toLocaleString('en-IN')} routed through ${forecast.mule_trail.hops.length} mule hops. Top ATM: ${topAtm.operator_or_bank}. Probability: ${topAtm.probability_score}%`,
      location: topAtm.address,
      latitude: topAtm.latitude,
      longitude: topAtm.longitude,
      eta_minutes: forecast.mule_trail.estimated_cashout_window_minutes,
      recommended_action: forecast.action_priority,
      status: 'active',
    }, { onConflict: 'alert_id' })

    await supabase
      .from('complaints')
      .update({ status: 'alerted' })
      .eq('complaint_id', selectedComplaint.complaint_id)

    navigate('/alerts')
  }

  if (loading) return <LoadingSpinner label="Loading complaints..." />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-100">Predictive Engine</h2>
            <DemoBadge />
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Complaint → Mule Trail Analysis → ATM Cashout Prediction → Risk Factors
          </p>
        </div>
        {complaints.length === 0 && (
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-xs font-bold text-blue-400 hover:bg-blue-600/30 transition-all disabled:opacity-50"
          >
            {seeding ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            Seed Demo Data
          </button>
        )}
      </div>

      {complaints.length === 0 ? (
        <div className="defense-card rounded-2xl p-8">
          <EmptyState
            icon={Database}
            title="No complaints available"
            description="Seed demo data to load synthetic cybercrime complaints with mule transaction trails."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Complaint list */}
          <div className="defense-card rounded-2xl p-4">
            <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-blue-400" />
              Select Complaint
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {complaints.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectComplaint(c)}
                  className={`w-full p-3 rounded-xl border text-left transition-all ${
                    selectedComplaint?.id === c.id
                      ? 'bg-blue-600/20 border-blue-500/40'
                      : 'bg-[#0a0f1d] border-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold text-slate-200">{c.complaint_id}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">{c.fraud_category}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] font-mono text-slate-400">{formatINR(c.stolen_amount_inr)}</span>
                    <RiskBadge level={c.risk_level} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Analysis area */}
          <div className="lg:col-span-2 space-y-6">
            {!selectedComplaint ? (
              <div className="defense-card rounded-2xl p-8">
                <EmptyState
                  icon={Brain}
                  title="Select a complaint to begin"
                  description="Choose a complaint from the list to run the predictive ATM cashout analysis."
                />
              </div>
            ) : (
              <>
                {/* Complaint detail */}
                <div className="defense-card rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-200">{selectedComplaint.complaint_id}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{selectedComplaint.fraud_category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <RiskBadge level={selectedComplaint.risk_level} />
                      <StatusBadge status={selectedComplaint.status} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-500 font-mono uppercase">Victim</p>
                      <p className="text-slate-300 mt-0.5">{selectedComplaint.victim_name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-mono uppercase">City</p>
                      <p className="text-slate-300 mt-0.5">{selectedComplaint.victim_city}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-mono uppercase">Stolen</p>
                      <p className="text-slate-300 mt-0.5">{formatINR(selectedComplaint.stolen_amount_inr)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-mono uppercase">Reported</p>
                      <p className="text-slate-300 mt-0.5">{timeAgo(selectedComplaint.reported_timestamp)}</p>
                    </div>
                  </div>

                  {/* Mule transaction trail */}
                  {transactions.length > 0 && (
                    <div className="mt-5">
                      <p className="text-[10px] text-slate-500 font-mono uppercase mb-2">Mule Transaction Trail</p>
                      <div className="space-y-2">
                        {transactions.map((tx, idx) => (
                          <div
                            key={tx.id}
                            className={`p-3 rounded-xl border ${
                              tx.is_terminal_cashout
                                ? 'bg-red-500/10 border-red-500/30'
                                : 'bg-[#0a0f1d] border-slate-800/60'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-mono font-bold text-slate-400">
                                  {tx.hop_level}
                                </span>
                                <div>
                                  <p className="text-xs font-mono text-slate-300">
                                    {tx.from_account} → {tx.to_account}
                                  </p>
                                  <p className="text-[10px] text-slate-500">
                                    {tx.beneficiary_name} • {tx.bank_name}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-slate-400">{formatINR(tx.amount_inr)}</span>
                                {tx.is_terminal_cashout && (
                                  <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[9px] font-bold uppercase">
                                    Terminal
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleRunAnalysis}
                    disabled={analyzing || transactions.length === 0}
                    className="w-full mt-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {analyzing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Analyzing transaction graph...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4" />
                        Run Predictive Analysis
                      </>
                    )}
                  </button>
                </div>

                {/* Forecast results */}
                {forecast && (
                  <div className="space-y-6 fade-in">
                    {/* Top predicted ATM */}
                    <div className={`rounded-2xl p-5 ${forecast.action_priority.includes('CRITICAL') ? 'defense-card-critical' : 'defense-card'}`}>
                      <div className="flex items-center gap-2 mb-4">
                        <Target className={`w-5 h-5 ${forecast.action_priority.includes('CRITICAL') ? 'text-red-400' : 'text-blue-400'}`} />
                        <h3 className="text-sm font-bold text-slate-100">Predicted ATM Cashout Location</h3>
                        {savedPrediction && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                            <CheckCircle2 className="w-3 h-3" /> Saved to database
                          </span>
                        )}
                      </div>

                      {forecast.top_predicted_atms.map((atm, idx) => (
                        <div key={atm.atm_id} className="mb-3">
                          <button
                            onClick={() => setExpandedAtm(expandedAtm === atm.atm_id ? null : atm.atm_id)}
                            className={`w-full p-4 rounded-xl border text-left transition-all ${
                              idx === 0
                                ? 'bg-blue-600/10 border-blue-500/40'
                                : 'bg-[#0a0f1d] border-slate-800/60 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${
                                  idx === 0 ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
                                }`}>
                                  {idx + 1}
                                </span>
                                <div>
                                  <p className="text-sm font-bold text-slate-200">{atm.operator_or_bank}</p>
                                  <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3" /> {atm.address}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <p className="text-lg font-extrabold font-mono text-slate-100">
                                    {atm.probability_score}%
                                  </p>
                                  <p className="text-[10px] text-slate-500 font-mono">probability</p>
                                </div>
                                <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${expandedAtm === atm.atm_id ? 'rotate-90' : ''}`} />
                              </div>
                            </div>

                            {expandedAtm === atm.atm_id && (
                              <div className="mt-4 pt-4 border-t border-slate-800/60 space-y-2 fade-in">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-500 flex items-center gap-1">
                                    <Navigation className="w-3 h-3" /> Distance from anchor
                                  </span>
                                  <span className="text-slate-300 font-mono">{atm.distance_from_anchor_km} km</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Intercept window
                                  </span>
                                  <span className="text-slate-300 font-mono">{atm.recommended_intercept_window}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-500">Coordinates</span>
                                  <span className="text-slate-300 font-mono">{atm.latitude}, {atm.longitude}</span>
                                </div>
                                <a
                                  href={atm.google_maps_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-2"
                                >
                                  <Navigation className="w-3 h-3" /> Open in Google Maps
                                </a>
                              </div>
                            )}
                          </button>
                        </div>
                      ))}

                      <div className="mt-4 p-3 rounded-xl bg-[#0a0f1d] border border-slate-800/60">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] text-slate-500 font-mono uppercase">Action Priority</span>
                          <span className={`text-xs font-bold ${forecast.action_priority.includes('CRITICAL') ? 'text-red-400' : 'text-amber-400'}`}>
                            {forecast.action_priority}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 font-mono uppercase">Jurisdiction</span>
                          <span className="text-xs text-slate-300">{forecast.recommended_police_jurisdiction}</span>
                        </div>
                      </div>

                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={handleEscalateAlert}
                          className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all"
                        >
                          <AlertTriangle className="w-4 h-4" />
                          Escalate to Alert
                        </button>
                        <button
                          onClick={() => navigate('/map')}
                          className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                        >
                          <MapPin className="w-4 h-4" />
                          View on Risk Map
                        </button>
                      </div>
                    </div>

                    {/* Why This ATM? - Risk Factors */}
                    <div className="defense-card rounded-2xl p-5">
                      <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400" />
                        Why This ATM? — Risk Factor Breakdown
                      </h3>
                      <div className="space-y-3">
                        {riskFactors.map((factor, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-[#0a0f1d] border border-slate-800/60">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-slate-200">{factor.factor_name}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-blue-500"
                                    style={{ width: `${factor.factor_weight * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs font-mono text-slate-400">{factor.factor_weight}</span>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed">{factor.factor_description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mule trail summary */}
                    <div className="defense-card rounded-2xl p-5">
                      <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-400" />
                        Mule Trail Analysis Summary
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <p className="text-[10px] text-slate-500 font-mono uppercase">Hops</p>
                          <p className="text-lg font-bold text-slate-200 mt-0.5">{forecast.mule_trail.hops.length}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 font-mono uppercase">Velocity Score</p>
                          <p className="text-lg font-bold text-slate-200 mt-0.5">{forecast.mule_trail.transaction_velocity_score}/100</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 font-mono uppercase">Cashout Window</p>
                          <p className="text-lg font-bold text-slate-200 mt-0.5">{forecast.mule_trail.estimated_cashout_window_minutes} min</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 font-mono uppercase">Analysis Time</p>
                          <p className="text-lg font-bold text-slate-200 mt-0.5">{forecast.analysis_time_seconds}s</p>
                        </div>
                      </div>
                      <div className="mt-4 p-3 rounded-xl bg-[#0a0f1d] border border-slate-800/60">
                        <p className="text-[10px] text-slate-500 font-mono uppercase mb-1">Terminal Mule</p>
                        <p className="text-xs text-slate-300">{forecast.mule_trail.terminal_mule_name}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {forecast.mule_trail.terminal_mule_account} • {forecast.mule_trail.terminal_bank}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
