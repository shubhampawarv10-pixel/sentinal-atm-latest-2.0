import { useState, useEffect, useCallback } from 'react'
import { Network, Database, User, Building2, CreditCard, Phone, FolderOpen, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { LoadingSpinner, EmptyState, RiskBadge, DemoBadge } from '../components/Shared'
import { formatINR } from '../lib/utils'
import type { Complaint, NetworkEntity, NetworkLink } from '../lib/types'

const entityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  complaint: FolderOpen,
  victim: User,
  account: CreditCard,
  mule: CreditCard,
  bank: Building2,
  phone: Phone,
  atm: Network,
}

const entityColors: Record<string, string> = {
  complaint: '#3b82f6',
  victim: '#10b981',
  account: '#64748b',
  mule: '#ef4444',
  bank: '#f59e0b',
  phone: '#a78bfa',
  atm: '#06b6d4',
}

export default function NetworkIntelligence() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [entities, setEntities] = useState<NetworkEntity[]>([])
  const [links, setLinks] = useState<NetworkLink[]>([])
  const [loading, setLoading] = useState(true)

  const loadComplaints = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('complaints').select('*').order('created_at', { ascending: false })
    if (data) setComplaints(data as Complaint[])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadComplaints()
  }, [loadComplaints])

  const handleSelect = async (complaintId: string) => {
    setSelectedId(complaintId)
    const [eRes, lRes] = await Promise.all([
      supabase.from('network_entities').select('*').eq('complaint_id', complaintId),
      supabase.from('network_links').select('*').eq('complaint_id', complaintId),
    ])
    if (eRes.data) setEntities(eRes.data as NetworkEntity[])
    if (lRes.data) setLinks(lRes.data as NetworkLink[])
  }

  // Build graph layout in a circle
  const nodeCount = entities.length
  const positions = new Map<string, { x: number; y: number }>()
  entities.forEach((e, idx) => {
    const angle = (idx / Math.max(nodeCount, 1)) * 2 * Math.PI - Math.PI / 2
    const radius = 38
    positions.set(e.entity_id, {
      x: 50 + radius * Math.cos(angle),
      y: 50 + radius * Math.sin(angle),
    })
  })

  if (loading) return <LoadingSpinner label="Loading network intelligence..." />

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-100">Network Intelligence</h2>
          <DemoBadge />
        </div>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Investigation graph: entities and transaction links per complaint
        </p>
      </div>

      {complaints.length === 0 ? (
        <div className="defense-card rounded-2xl p-8">
          <EmptyState icon={Database} title="No data available" description="Seed demo data from the Command Center." />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="defense-card rounded-2xl p-4">
            <h3 className="text-sm font-bold text-slate-200 mb-3">Select Complaint</h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {complaints.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelect(c.complaint_id)}
                  className={`w-full p-3 rounded-xl border text-left transition-all ${
                    selectedId === c.complaint_id
                      ? 'bg-blue-600/20 border-blue-500/40'
                      : 'bg-[#0a0f1d] border-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-mono font-bold text-slate-200">{c.complaint_id}</span>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{c.fraud_category}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] font-mono text-slate-400">{formatINR(c.stolen_amount_inr)}</span>
                    <RiskBadge level={c.risk_level} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 defense-card rounded-2xl p-5">
            {!selectedId ? (
              <EmptyState icon={Network} title="Select a complaint" description="Choose a complaint to view its investigation graph." />
            ) : entities.length === 0 ? (
              <EmptyState icon={Network} title="No graph data" description="No network entities found for this complaint." />
            ) : (
              <>
                <h3 className="text-sm font-bold text-slate-200 mb-4">Investigation Graph</h3>
                <div className="relative w-full rounded-xl bg-[#040711] border border-slate-800/60 overflow-hidden tactical-grid" style={{ aspectRatio: '1 / 1' }}>
                  <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                    {/* Links */}
                    {links.map((link) => {
                      const src = positions.get(link.source_entity_id)
                      const tgt = positions.get(link.target_entity_id)
                      if (!src || !tgt) return null
                      const isTransfer = link.link_type === 'transfer'
                      return (
                        <g key={link.id}>
                          <line
                            x1={src.x}
                            y1={src.y}
                            x2={tgt.x}
                            y2={tgt.y}
                            stroke={isTransfer ? 'rgba(59,130,246,0.35)' : 'rgba(100,116,139,0.25)'}
                            strokeWidth="0.3"
                            strokeDasharray={isTransfer ? '0' : '0.5 0.5'}
                          />
                          {isTransfer && link.label && (
                            <text
                              x={(src.x + tgt.x) / 2}
                              y={(src.y + tgt.y) / 2}
                              fill="rgba(148,163,184,0.6)"
                              fontSize="1.5"
                              textAnchor="middle"
                              dy="0.5"
                            >
                              {link.label}
                            </text>
                          )}
                        </g>
                      )
                    })}

                    {/* Nodes */}
                    {entities.map((e) => {
                      const pos = positions.get(e.entity_id)
                      if (!pos) return null
                      const color = entityColors[e.entity_type] || '#64748b'
                      const radius = e.entity_type === 'complaint' ? 3 : e.entity_type === 'mule' ? 2.5 : 2
                      return (
                        <g key={e.id}>
                          {e.risk_score > 80 && (
                            <circle cx={pos.x} cy={pos.y} r={radius + 1.5} fill={color} opacity="0.15" className="pulse-ring-active" />
                          )}
                          <circle cx={pos.x} cy={pos.y} r={radius} fill={color} stroke="#0a0f1d" strokeWidth="0.3" />
                          <text x={pos.x} y={pos.y + radius + 2.5} fill="rgba(203,213,225,0.7)" fontSize="1.8" textAnchor="middle">
                            {e.label.length > 20 ? e.label.slice(0, 18) + '...' : e.label}
                          </text>
                        </g>
                      )
                    })}
                  </svg>
                </div>

                {/* Entity list */}
                <div className="mt-4">
                  <p className="text-[10px] text-slate-500 font-mono uppercase mb-2">Entities ({entities.length})</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {entities.map((e) => {
                      const Icon = entityIcons[e.entity_type] || CreditCard
                      return (
                        <div key={e.id} className="p-2 rounded-lg bg-[#0a0f1d] border border-slate-800/60">
                          <div className="flex items-center gap-2">
                            <Icon className="w-3 h-3 shrink-0" style={{ color: entityColors[e.entity_type] }} />
                            <span className="text-[10px] font-mono text-slate-300 truncate">{e.label}</span>
                          </div>
                          {e.sub_label && <p className="text-[9px] text-slate-600 truncate mt-0.5">{e.sub_label}</p>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
