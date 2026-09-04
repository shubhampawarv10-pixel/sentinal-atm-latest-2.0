import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, Brain, BellRing, MapPin, TrendingUp,
  Activity, Zap, Database, RotateCcw, ChevronRight,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { seedDemoData } from '../lib/demo-data'
import { formatINR, timeAgo } from '../lib/utils'
import { LoadingSpinner, EmptyState, StatCard, RiskBadge, StatusBadge, DemoBadge } from '../components/Shared'
import type { Complaint, Alert, ATM } from '../lib/types'

export default function Dashboard() {
  const navigate = useNavigate()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [atms, setAtms] = useState<ATM[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [seedMsg, setSeedMsg] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    const [cRes, aRes, atmRes] = await Promise.all([
      supabase.from('complaints').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('alerts').select('*').eq('status', 'active').order('created_at', { ascending: false }),
      supabase.from('atms').select('*'),
    ])
    if (cRes.data) setComplaints(cRes.data as Complaint[])
    if (aRes.data) setAlerts(aRes.data as Alert[])
    if (atmRes.data) setAtms(atmRes.data as ATM[])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSeed = async () => {
    setSeeding(true)
    const result = await seedDemoData()
    setSeedMsg(result.message)
    setSeeding(false)
    setTimeout(() => setSeedMsg(''), 4000)
    await loadData()
  }

  const newComplaints = complaints.filter((c) => c.status === 'new').length
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical').length
  const predictedCount = complaints.filter((c) => c.status === 'predicted' || c.status === 'alerted').length
  const totalStolen = complaints.reduce((sum, c) => sum + c.stolen_amount_inr, 0)

  if (loading) return <LoadingSpinner label="Loading command center data..." />

  const hasData = complaints.length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-100">Command Center</h2>
            <DemoBadge />
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Real-time cybercrime complaint monitoring and predictive dispatch overview
          </p>
        </div>
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-xs font-bold text-blue-400 hover:bg-blue-600/30 transition-all disabled:opacity-50"
        >
          {seeding ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
          {seeding ? 'Seeding...' : hasData ? 'Re-seed Demo Data' : 'Seed Demo Data'}
        </button>
      </div>

      {seedMsg && (
        <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400">
          {seedMsg}
        </div>
      )}

      {!hasData && (
        <div className="defense-card rounded-2xl p-8">
          <EmptyState
            icon={Database}
            title="No demo data loaded"
            description="Click 'Seed Demo Data' to populate the platform with synthetic cybercrime complaints, mule transaction trails, ATM locations, and active alerts."
            action={
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-all disabled:opacity-50"
              >
                <Database className="w-4 h-4" />
                Seed Demo Data Now
              </button>
            }
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={AlertTriangle}
          label="New Complaints"
          value={newComplaints}
          trend="Awaiting analysis"
          iconBg="bg-amber-500/15 border-amber-500/30 text-amber-400"
        />
        <StatCard
          icon={BellRing}
          label="Active Alerts"
          value={alerts.length}
          trend={`${criticalAlerts} critical`}
          trendColor="text-red-400"
          iconBg="bg-red-500/15 border-red-500/30 text-red-400"
        />
        <StatCard
          icon={Brain}
          label="Predicted ATMs"
          value={predictedCount}
          trend="Predictions generated"
          iconBg="bg-blue-500/15 border-blue-500/30 text-blue-400"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Stolen"
          value={formatINR(totalStolen)}
          trend="Across all complaints"
          iconBg="bg-orange-500/15 border-orange-500/30 text-orange-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 defense-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              Recent Complaints
            </h3>
            <button
              onClick={() => navigate('/predictions')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              Run Analysis <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {complaints.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No complaints loaded</p>
          ) : (
            <div className="space-y-2">
              {complaints.slice(0, 6).map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate('/predictions')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#0a0f1d] border border-slate-800/60 hover:border-slate-700 transition-all text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex flex-col">
                      <span className="text-xs font-mono font-bold text-slate-200">{c.complaint_id}</span>
                      <span className="text-[10px] text-slate-500 truncate">{c.fraud_category}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono text-slate-400 hidden sm:block">
                      {formatINR(c.stolen_amount_inr)}
                    </span>
                    <RiskBadge level={c.risk_level} />
                    <StatusBadge status={c.status} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="defense-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Zap className="w-4 h-4 text-red-400" />
              Active Alerts
            </h3>
            <button
              onClick={() => navigate('/alerts')}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              View All
            </button>
          </div>
          {alerts.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No active alerts</p>
          ) : (
            <div className="space-y-2">
              {alerts.slice(0, 4).map((a) => (
                <div
                  key={a.id}
                  className="p-3 rounded-xl bg-[#0a0f1d] border border-slate-800/60"
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                        a.severity === 'critical'
                          ? 'bg-red-500'
                          : a.severity === 'high'
                          ? 'bg-orange-500'
                          : 'bg-amber-500'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate">{a.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {a.location}
                      </p>
                      <p className="text-[10px] text-slate-600 font-mono mt-0.5">
                        {timeAgo(a.created_at)} • ETA {a.eta_minutes}m
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="defense-card rounded-2xl p-5">
        <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-400" />
          ATM Network ({atms.length} ATMs)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {atms.slice(0, 12).map((atm) => (
            <div
              key={atm.id}
              className="p-3 rounded-xl bg-[#0a0f1d] border border-slate-800/60 hover:border-slate-700 transition-all"
            >
              <p className="text-[10px] font-mono font-bold text-slate-300 truncate">{atm.atm_id}</p>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">{atm.operator}</p>
              <p className="text-[10px] text-slate-600 truncate">{atm.city}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
