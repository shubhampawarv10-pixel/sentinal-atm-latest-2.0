import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BellRing, AlertTriangle, CheckCircle2, Navigation, MapPin,
  Clock, Zap, Send, Database,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { logAudit } from '../lib/demo-data'
import { LoadingSpinner, EmptyState, DemoBadge } from '../components/Shared'
import { formatDateTime, timeAgo } from '../lib/utils'
import type { Alert, Complaint, Dispatch } from '../lib/types'

export default function Alerts() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [dispatches, setDispatches] = useState<Dispatch[]>([])
  const [loading, setLoading] = useState(true)
  const [dispatching, setDispatching] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [aRes, cRes, dRes] = await Promise.all([
      supabase.from('alerts').select('*').order('created_at', { ascending: false }),
      supabase.from('complaints').select('*'),
      supabase.from('dispatches').select('*').order('dispatched_at', { ascending: false }),
    ])
    if (aRes.data) setAlerts(aRes.data as Alert[])
    if (cRes.data) setComplaints(cRes.data as Complaint[])
    if (dRes.data) setDispatches(dRes.data as Dispatch[])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAcknowledge = async (alertId: string) => {
    await supabase
      .from('alerts')
      .update({ status: 'acknowledged', acknowledged_at: new Date().toISOString() })
      .eq('alert_id', alertId)
    await loadData()
  }

  const handleDispatch = async (alert: Alert) => {
    setDispatching(alert.id)
    const dispatchId = `DSP-${alert.alert_id.split('-').pop()}-${Date.now().toString().slice(-4)}`

    await supabase.from('dispatches').insert({
      dispatch_id: dispatchId,
      complaint_id: alert.complaint_id || '',
      atm_id: null,
      atm_name: alert.location,
      police_station: 'PS Badarpur / South East District Cyber Cell',
      officer_callsign: 'PCR-UNIT-7',
      status: 'dispatched',
      channel: 'telegram',
      delivery_note: `Dispatched for ${alert.title}. ETA ${alert.eta_minutes} min.`,
      dispatched_by: profile?.id || null,
    })

    await supabase
      .from('alerts')
      .update({ status: 'dispatched' })
      .eq('alert_id', alert.alert_id)

    if (alert.complaint_id) {
      await supabase
        .from('complaints')
        .update({ status: 'dispatched', assigned_unit: 'PCR-UNIT-7', assigned_officer: 'PS Badarpur' })
        .eq('complaint_id', alert.complaint_id)
    }

    await logAudit(profile?.id || null, profile?.email || null, 'dispatch_created', 'alert', alert.alert_id, {
      dispatch_id: dispatchId,
      complaint_id: alert.complaint_id,
    })

    setDispatching(null)
    await loadData()
  }

  const handleResolve = async (alertId: string) => {
    await supabase
      .from('alerts')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('alert_id', alertId)
    await loadData()
  }

  if (loading) return <LoadingSpinner label="Loading alerts..." />

  const severityColor = (sev: string) => {
    switch (sev) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-100">Alert & Response</h2>
          <DemoBadge />
        </div>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Active alerts, acknowledgment, and LEA dispatch coordination
        </p>
      </div>

      {alerts.length === 0 ? (
        <div className="defense-card rounded-2xl p-8">
          <EmptyState
            icon={Database}
            title="No alerts"
            description="Seed demo data or escalate a prediction from the Predictive Engine to generate alerts."
            action={
              <button
                onClick={() => navigate('/predictions')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-all"
              >
                Go to Predictive Engine
              </button>
            }
          />
        </div>
      ) : (
        <>
          {/* Active alerts */}
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-2xl p-5 border ${
                  alert.severity === 'critical' && alert.status === 'active'
                    ? 'defense-card-critical'
                    : 'defense-card'
                }`}
              >
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${severityColor(alert.severity)}`}>
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-100">{alert.title}</p>
                      <p className="text-xs text-slate-400 mt-1">{alert.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500 font-mono">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {alert.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> ETA {alert.eta_minutes}m
                        </span>
                        <span>{timeAgo(alert.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase ${severityColor(alert.severity)}`}>
                      {alert.severity}
                    </span>
                    <span className="px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase bg-slate-800/60 text-slate-400 border-slate-700">
                      {alert.status}
                    </span>
                  </div>
                </div>

                {alert.recommended_action && (
                  <div className="mt-3 p-3 rounded-xl bg-[#0a0f1d] border border-slate-800/60">
                    <p className="text-[10px] text-slate-500 font-mono uppercase mb-1">Recommended Action</p>
                    <p className="text-xs text-slate-300 flex items-start gap-2">
                      <Zap className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                      {alert.recommended_action}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/60">
                  {alert.status === 'active' && (
                    <button
                      onClick={() => handleAcknowledge(alert.alert_id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledge
                    </button>
                  )}
                  {(alert.status === 'acknowledged' || alert.status === 'active') && (
                    <button
                      onClick={() => handleDispatch(alert)}
                      disabled={dispatching === alert.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-all disabled:opacity-50"
                    >
                      {dispatching === alert.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      Dispatch LEA Unit
                    </button>
                  )}
                  {alert.status === 'dispatched' && (
                    <button
                      onClick={() => handleResolve(alert.alert_id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30 text-xs font-bold text-emerald-400 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved
                    </button>
                  )}
                  {alert.latitude && alert.longitude && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${alert.latitude},${alert.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0a0f1d] border border-slate-800 hover:border-slate-700 text-xs font-bold text-blue-400 transition-all"
                    >
                      <Navigation className="w-3.5 h-3.5" /> Directions
                    </a>
                  )}
                  <button
                    onClick={() => navigate('/map')}
                    className="ml-auto flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300"
                  >
                    View Map
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Dispatch records */}
          {dispatches.length > 0 && (
            <div className="defense-card rounded-2xl p-5">
              <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-400" />
                Dispatch Records ({dispatches.length})
              </h3>
              <div className="space-y-2">
                {dispatches.map((d) => (
                  <div key={d.id} className="p-3 rounded-xl bg-[#0a0f1d] border border-slate-800/60">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-mono font-bold text-slate-200">{d.dispatch_id}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {d.police_station} • {d.officer_callsign} • {d.channel}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-mono">{formatDateTime(d.dispatched_at)}</span>
                        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase ${
                          d.status === 'intercepted'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : d.status === 'dispatched'
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                            : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                        }`}>
                          {d.status}
                        </span>
                      </div>
                    </div>
                    {d.delivery_note && (
                      <p className="text-[10px] text-slate-600 mt-1.5">{d.delivery_note}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
