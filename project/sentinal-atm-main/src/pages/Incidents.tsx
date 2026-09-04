import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderOpen, ChevronRight, Database } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { LoadingSpinner, EmptyState, RiskBadge, StatusBadge, DemoBadge } from '../components/Shared'
import { formatINR, formatDateTime, timeAgo } from '../lib/utils'
import type { Complaint } from '../lib/types'

const STATUS_OPTIONS = ['new', 'analyzing', 'predicted', 'alerted', 'dispatched', 'intercepted', 'closed'] as const

export default function Incidents() {
  const navigate = useNavigate()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  const loadComplaints = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('complaints').select('*').order('created_at', { ascending: false })
    if (data) setComplaints(data as Complaint[])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadComplaints()
  }, [loadComplaints])

  const handleStatusChange = async (complaintId: string, newStatus: string) => {
    await supabase.from('complaints').update({ status: newStatus }).eq('complaint_id', complaintId)
    await loadComplaints()
  }

  const filtered = filter === 'all' ? complaints : complaints.filter((c) => c.status === filter)

  if (loading) return <LoadingSpinner label="Loading incidents..." />

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-100">Incident Management</h2>
          <DemoBadge />
        </div>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Track and update complaint status through the response lifecycle
        </p>
      </div>

      {complaints.length === 0 ? (
        <div className="defense-card rounded-2xl p-8">
          <EmptyState icon={Database} title="No incidents" description="Seed demo data from the Command Center." />
        </div>
      ) : (
        <>
          {/* Filter bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-[#0a0f1d] border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({complaints.length})
            </button>
            {STATUS_OPTIONS.map((s) => {
              const count = complaints.filter((c) => c.status === s).length
              if (count === 0) return null
              return (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filter === s ? 'bg-blue-600 text-white' : 'bg-[#0a0f1d] border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s} ({count})
                </button>
              )
            })}
          </div>

          {/* Incident list */}
          <div className="defense-card rounded-2xl p-5">
            <div className="space-y-3">
              {filtered.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl bg-[#0a0f1d] border border-slate-800/60 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center shrink-0">
                        <FolderOpen className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-mono font-bold text-slate-200">{c.complaint_id}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{c.fraud_category}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500 font-mono">
                          <span>{c.victim_name} • {c.victim_city}</span>
                          <span>{formatINR(c.stolen_amount_inr)}</span>
                          <span>{timeAgo(c.reported_timestamp)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <RiskBadge level={c.risk_level} />
                      <StatusBadge status={c.status} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/60">
                    <select
                      value={c.status}
                      onChange={(e) => handleStatusChange(c.complaint_id, e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-[#040711] border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {c.predicted_atm_id && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        Predicted: {c.predicted_atm_id}
                      </span>
                    )}
                    <button
                      onClick={() => navigate('/predictions')}
                      className="ml-auto flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                    >
                      Analyze <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
