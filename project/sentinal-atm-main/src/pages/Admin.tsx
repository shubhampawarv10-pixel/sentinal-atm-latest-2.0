import { useState, useEffect, useCallback } from 'react'
import { Settings, Users, Shield, ScrollText, Database } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { LoadingSpinner, EmptyState, DemoBadge } from '../components/Shared'
import { formatDateTime } from '../lib/utils'
import type { AuditLog, Profile, UserRole } from '../lib/types'

export default function Admin() {
  const { profile, updateRole } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [lRes, pRes] = await Promise.all([
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    ])
    if (lRes.data) setLogs(lRes.data as AuditLog[])
    if (pRes.data) setProfiles(pRes.data as Profile[])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRoleChange = async (newRole: UserRole) => {
    await updateRole(newRole)
    await loadData()
  }

  if (loading) return <LoadingSpinner label="Loading admin panel..." />

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-100">Administration</h2>
          <DemoBadge />
        </div>
        <p className="text-xs text-slate-400 font-mono mt-1">
          User management, role assignment, and system audit trail
        </p>
      </div>

      {/* Current user profile */}
      <div className="defense-card rounded-2xl p-5">
        <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-400" />
          Your Profile
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <p className="text-[10px] text-slate-500 font-mono uppercase">Name</p>
            <p className="text-slate-300 mt-0.5">{profile?.full_name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-mono uppercase">Email</p>
            <p className="text-slate-300 mt-0.5 truncate">{profile?.email || 'N/A'}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-mono uppercase">Callsign</p>
            <p className="text-slate-300 mt-0.5">{profile?.callsign || 'N/A'}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-mono uppercase">Jurisdiction</p>
            <p className="text-slate-300 mt-0.5">{profile?.jurisdiction || 'N/A'}</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800/60">
          <p className="text-[10px] text-slate-500 font-mono uppercase mb-2">Role Assignment</p>
          <div className="flex items-center gap-2">
            {(['admin', 'investigator', 'analyst'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => handleRoleChange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  profile?.role === r
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#0a0f1d] border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Team members */}
      {profiles.length > 0 && (
        <div className="defense-card rounded-2xl p-5">
          <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            Team Members ({profiles.length})
          </h3>
          <div className="space-y-2">
            {profiles.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-[#0a0f1d] border border-slate-800/60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-[10px] text-white">
                    {p.full_name?.[0] || 'O'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200">{p.full_name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{p.email}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold uppercase">
                  {p.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit log */}
      <div className="defense-card rounded-2xl p-5">
        <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-blue-400" />
          Audit Trail
        </h3>
        {logs.length === 0 ? (
          <EmptyState icon={Database} title="No audit entries" description="Actions performed in the platform will be logged here." />
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-[#0a0f1d] border border-slate-800/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-200">{log.action}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{formatDateTime(log.created_at)}</span>
                </div>
                {log.user_email && (
                  <p className="text-[10px] text-slate-500 mt-0.5">{log.user_email}</p>
                )}
                {log.entity_type && (
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    {log.entity_type}: {log.entity_id}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
