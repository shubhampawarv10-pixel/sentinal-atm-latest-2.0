import { useState, useEffect, useCallback } from 'react'
import { FileText, Database, Hash, FileCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { LoadingSpinner, EmptyState, DemoBadge } from '../components/Shared'
import { formatDateTime } from '../lib/utils'
import type { Evidence, Complaint } from '../lib/types'

export default function Evidence() {
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [eRes, cRes] = await Promise.all([
      supabase.from('evidence').select('*').order('created_at', { ascending: false }),
      supabase.from('complaints').select('*'),
    ])
    if (eRes.data) setEvidence(eRes.data as Evidence[])
    if (cRes.data) setComplaints(cRes.data as Complaint[])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) return <LoadingSpinner label="Loading evidence records..." />

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-100">Evidence & Reports</h2>
          <DemoBadge />
        </div>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Chain-of-custody evidence records with SHA-256 integrity hashes
        </p>
      </div>

      {evidence.length === 0 ? (
        <div className="defense-card rounded-2xl p-8">
          <EmptyState
            icon={Database}
            title="No evidence records"
            description="Evidence files linked to complaints will appear here. In this demo, evidence records are created as part of the investigation workflow."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {evidence.map((e) => {
            const complaint = complaints.find((c) => c.complaint_id === e.complaint_id)
            return (
              <div key={e.id} className="defense-card rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-200 truncate">{e.file_name}</p>
                    {complaint && (
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{complaint.complaint_id}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  {e.file_type && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Type</span>
                      <span className="text-slate-300 font-mono">{e.file_type}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Size</span>
                    <span className="text-slate-300 font-mono">{(e.file_size_bytes / 1024).toFixed(1)} KB</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Hash className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
                    <span className="text-[10px] text-slate-500 font-mono break-all">{e.sha256_hash}</span>
                  </div>
                  {e.section_65b_ref && (
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="text-[10px] text-emerald-400 font-mono">{e.section_65b_ref}</span>
                    </div>
                  )}
                  {e.description && (
                    <p className="text-[10px] text-slate-500 mt-2">{e.description}</p>
                  )}
                  <p className="text-[10px] text-slate-600 font-mono pt-2 border-t border-slate-800/60">
                    {formatDateTime(e.created_at)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
