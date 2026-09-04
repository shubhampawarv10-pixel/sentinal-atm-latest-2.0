import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Shield, LayoutDashboard, Brain, Map, Network, FolderOpen,
  BellRing, FileText, Settings, LogOut, RotateCcw, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { resetDemoData } from '../lib/demo-data'

const navItems = [
  { to: '/dashboard', label: 'Command Center', icon: LayoutDashboard },
  { to: '/predictions', label: 'Predictive Engine', icon: Brain },
  { to: '/map', label: 'Geospatial Risk Map', icon: Map },
  { to: '/network', label: 'Network Intelligence', icon: Network },
  { to: '/incidents', label: 'Incident Management', icon: FolderOpen },
  { to: '/alerts', label: 'Alert & Response', icon: BellRing },
  { to: '/evidence', label: 'Evidence & Reports', icon: FileText },
  { to: '/admin', label: 'Administration', icon: Settings },
]

export default function Sidebar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetMsg, setResetMsg] = useState('')

  const handleReset = async () => {
    setResetting(true)
    const result = await resetDemoData()
    setResetMsg(result.message)
    setResetting(false)
    setTimeout(() => setResetMsg(''), 3000)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <aside
      className={`${
        collapsed ? 'w-16' : 'w-64'
      } bg-[#0a0f1d] border-r border-slate-800/80 flex flex-col justify-between p-4 shrink-0 select-none transition-all duration-300`}
    >
      <div>
        <div className="flex items-center gap-3 px-1 py-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/20 shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-extrabold text-sm tracking-wide text-slate-100 flex items-center gap-1.5">
                Sentinel<span className="text-blue-500">ATM</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-mono">MHA // I4C Platform</p>
            </div>
          )}
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>

        <div className="pt-3 border-t border-slate-800/60 mt-3">
          <button
            onClick={handleReset}
            disabled={resetting}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-amber-400 hover:bg-amber-500/10 transition-colors"
            title={collapsed ? 'Reset Demo' : undefined}
          >
            <RotateCcw className={`w-4 h-4 shrink-0 ${resetting ? 'animate-spin' : ''}`} />
            {!collapsed && <span>{resetting ? 'Resetting...' : 'Reset Demo Data'}</span>}
          </button>
          {resetMsg && !collapsed && (
            <p className="text-[10px] text-emerald-400 px-3 mt-1">{resetMsg}</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-[#0e162b] border border-slate-800/90 rounded-2xl p-3">
          {!collapsed ? (
            <>
              <div className="text-[11px] font-bold text-slate-200 mb-1">{profile?.full_name || 'Officer'}</div>
              <div className="text-[10px] text-slate-400 font-mono mb-2">
                {profile?.email}
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono font-bold uppercase">
                  {profile?.role || 'analyst'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{profile?.callsign}</span>
              </div>
            </>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-[10px] text-white mx-auto">
              {profile?.full_name?.[0] || 'O'}
            </div>
          )}
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center px-2 py-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  )
}
