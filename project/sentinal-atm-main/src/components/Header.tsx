import { useState, useEffect } from 'react'
import { Search, Bell, Volume2, Play } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { formatTime } from '../lib/utils'
import type { Alert } from '../lib/types'

export default function Header() {
  const { profile } = useAuth()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [showAlerts, setShowAlerts] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  useEffect(() => {
    loadAlerts()
    const interval = setInterval(loadAlerts, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadAlerts() {
    const { data } = await supabase
      .from('alerts')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10)
    if (data) setAlerts(data as Alert[])
  }

  const triggerVoiceBriefing = () => {
    if (!('speechSynthesis' in window)) return
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }
    const text =
      'National Cybercrime Intelligence Alert. High-velocity Digital Arrest fraud detected. Four lakh fifty thousand rupees routed to terminal Punjab National Bank account. Top predicted cashout location: State Bank of India e-Corner, Badarpur. Intercept window: eighteen minutes. Dispatch recommended.'
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.05
    utterance.onend = () => setIsSpeaking(false)
    setIsSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  const activeCount = alerts.filter((a) => a.severity === 'critical' || a.severity === 'high').length

  return (
    <header className="h-20 bg-[#0a0f1d]/80 backdrop-blur-xl border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-40">
      <div>
        <h2 className="text-lg font-bold text-slate-100">
          Welcome back, {profile?.full_name || 'Officer'}
        </h2>
        <p className="text-xs text-slate-400 font-mono mt-0.5">
          NCRP & 1930 Incident Response Dashboard • {profile?.jurisdiction || 'All India'}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search case ID, ATM, account..."
            className="w-64 pl-10 pr-4 py-2 rounded-xl bg-[#0e162b] border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <button
          onClick={triggerVoiceBriefing}
          className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 border transition-all ${
            isSpeaking
              ? 'bg-blue-600 border-blue-400 text-white animate-pulse'
              : 'bg-[#0e162b] border-slate-800 text-blue-400 hover:bg-slate-800'
          }`}
        >
          {isSpeaking ? <Volume2 className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span className="hidden sm:inline">
            {isSpeaking ? 'BRIEFING...' : 'AI VOICE BRIEF'}
          </span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="w-10 h-10 rounded-xl bg-[#0e162b] border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          >
            <Bell className="w-4 h-4" />
          </button>
          {activeCount > 0 && (
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-[#0a0f1d] absolute top-2 right-2"></span>
          )}

          {showAlerts && (
            <div className="absolute right-0 top-12 w-96 bg-[#0b1224] border border-slate-800 rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto fade-in">
              <div className="p-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-slate-200">Active Alerts</h3>
              </div>
              {alerts.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">No active alerts</div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="p-3 border-b border-slate-800/60 hover:bg-slate-900/60">
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                          alert.severity === 'critical'
                            ? 'bg-red-500'
                            : alert.severity === 'high'
                            ? 'bg-orange-500'
                            : 'bg-amber-500'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate">{alert.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{alert.location}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {formatTime(alert.created_at)} • ETA {alert.eta_minutes}m
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-sm text-white shadow-md">
            {profile?.full_name?.[0] || 'O'}
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-bold text-slate-200">{profile?.callsign || 'OFFICER'}</div>
            <div className="text-[10px] text-slate-400 font-mono uppercase">
              {profile?.role || 'analyst'}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
