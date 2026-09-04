import { AlertTriangle } from 'lucide-react'

export function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-10 h-10 border-3 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
      {label && <p className="mt-4 text-xs text-slate-400 font-mono">{label}</p>}
    </div>
  )
}

export function EmptyState({
  icon: Icon = AlertTriangle,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-slate-500 mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-sm font-bold text-slate-300">{title}</h3>
      {description && <p className="text-xs text-slate-500 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h3 className="text-sm font-bold text-red-300">Something went wrong</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  )
}

export function DemoBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
      Demo / Simulated Data
    </div>
  )
}

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendColor = 'text-blue-400',
  iconBg = 'bg-blue-500/15 border-blue-500/30 text-blue-400',
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  trend?: string
  trendColor?: string
  iconBg?: string
}) {
  return (
    <div className="bg-[#0b1224] border border-slate-800/90 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-xs font-mono text-slate-400 uppercase tracking-wider font-medium">{label}</div>
      <div className="text-3xl font-extrabold text-slate-100 font-mono mt-1">{value}</div>
      {trend && (
        <div className={`text-xs flex items-center gap-1 font-mono font-medium mt-2 ${trendColor}`}>
          {trend}
        </div>
      )}
    </div>
  )
}

export function RiskBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  }
  return (
    <span
      className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase ${colors[level] || colors.low}`}
    >
      {level}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    analyzing: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    predicted: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    alerted: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    dispatched: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    intercepted: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    closed: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  }
  return (
    <span
      className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase ${colors[status] || colors.new}`}
    >
      {status}
    </span>
  )
}
