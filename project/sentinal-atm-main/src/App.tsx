import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Predictions from './pages/Predictions'
import RiskMap from './pages/RiskMap'
import NetworkIntelligence from './pages/NetworkIntelligence'
import Incidents from './pages/Incidents'
import Alerts from './pages/Alerts'
import Evidence from './pages/Evidence'
import Admin from './pages/Admin'

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex font-sans antialiased selection:bg-blue-600/30">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header />
        <main className="p-6 space-y-6 max-w-[1600px] w-full mx-auto fade-in">{children}</main>
        <footer className="border-t border-slate-800/80 bg-[#0a0f1d] px-6 py-3 text-xs font-mono text-slate-500 flex items-center justify-between mt-auto">
          <div>MINISTRY OF HOME AFFAIRS (MHA) // INDIAN CYBER CRIME COORDINATION CENTRE (I4C)</div>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>SIH26184 FRAMEWORK ONLINE</span>
          </div>
        </footer>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />
  return <ProtectedLayout>{children}</ProtectedLayout>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/predictions"
        element={
          <ProtectedRoute>
            <Predictions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/map"
        element={
          <ProtectedRoute>
            <RiskMap />
          </ProtectedRoute>
        }
      />
      <Route
        path="/network"
        element={
          <ProtectedRoute>
            <NetworkIntelligence />
          </ProtectedRoute>
        }
      />
      <Route
        path="/incidents"
        element={
          <ProtectedRoute>
            <Incidents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/alerts"
        element={
          <ProtectedRoute>
            <Alerts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/evidence"
        element={
          <ProtectedRoute>
            <Evidence />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
