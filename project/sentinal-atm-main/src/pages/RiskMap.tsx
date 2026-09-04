import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Navigation, Crosshair, AlertTriangle, Map as MapIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { LoadingSpinner, EmptyState, RiskBadge, DemoBadge } from '../components/Shared'
import type { ATM, Complaint, Prediction } from '../lib/types'

export default function RiskMap() {
  const navigate = useNavigate()
  const [atms, setAtms] = useState<ATM[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    const [atmRes, cRes, predRes] = await Promise.all([
      supabase.from('atms').select('*'),
      supabase.from('complaints').select('*').order('created_at', { ascending: false }),
      supabase.from('predictions').select('*').order('created_at', { ascending: false }),
    ])
    if (atmRes.data) setAtms(atmRes.data as ATM[])
    if (cRes.data) setComplaints(cRes.data as Complaint[])
    if (predRes.data) setPredictions(predRes.data as Prediction[])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const predictedComplaints = complaints.filter((c) =>
    predictions.some((p) => p.complaint_id === c.complaint_id)
  )

  const selectedPredictions = selectedComplaintId
    ? predictions.filter((p) => p.complaint_id === selectedComplaintId)
    : predictions

  const predictedAtmIds = new Set(selectedPredictions.map((p) => p.atm_id))

  // Map projection: normalize lat/lon to SVG coordinates
  const minLat = Math.min(...atms.map((a) => a.latitude), 28.40)
  const maxLat = Math.max(...atms.map((a) => a.latitude), 28.66)
  const minLon = Math.min(...atms.map((a) => a.longitude), 77.08)
  const maxLon = Math.max(...atms.map((a) => a.longitude), 77.33)

  const project = (lat: number, lon: number) => {
    const x = ((lon - minLon) / (maxLon - minLon)) * 100
    const y = (1 - (lat - minLat) / (maxLat - minLat)) * 100
    return { x: Math.max(2, Math.min(98, x)), y: Math.max(2, Math.min(98, y)) }
  }

  if (loading) return <LoadingSpinner label="Loading geospatial data..." />

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-100">Geospatial Risk Map</h2>
          <DemoBadge />
        </div>
        <p className="text-xs text-slate-400 font-mono mt-1">
          ATM network overlay with predicted cashout locations and risk zones
        </p>
      </div>

      {atms.length === 0 ? (
        <div className="defense-card rounded-2xl p-8">
          <EmptyState
            icon={MapIcon}
            title="No ATM data available"
            description="Seed demo data from the Command Center to populate the ATM network map."
            action={
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-all"
              >
                Go to Command Center
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map visualization */}
          <div className="lg:col-span-2 defense-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-blue-400" />
                Delhi NCR ATM Network
              </h3>
              {predictedComplaints.length > 0 && (
                <select
                  value={selectedComplaintId || ''}
                  onChange={(e) => setSelectedComplaintId(e.target.value || null)}
                  className="px-3 py-1.5 rounded-lg bg-[#0a0f1d] border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                >
                  <option value="">All predictions</option>
                  {predictedComplaints.map((c) => (
                    <option key={c.id} value={c.complaint_id}>
                      {c.complaint_id}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="relative w-full rounded-xl bg-[#040711] border border-slate-800/60 overflow-hidden tactical-grid" style={{ aspectRatio: '1 / 1' }}>
              {/* Radar sweep effect */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-3/4 h-3/4">
                  <div className="radar-sweep-beam" />
                </div>
              </div>

              {/* ATM markers */}
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                {/* Connection lines from anchor to predicted ATMs */}
                {selectedPredictions.map((pred) => {
                  const atm = atms.find((a) => a.atm_id === pred.atm_id)
                  if (!atm || !pred.latitude || !pred.longitude) return null
                  const pos = project(atm.latitude, atm.longitude)
                  const anchor = project(28.5085, 77.3012)
                  return (
                    <line
                      key={`line-${pred.id}`}
                      x1={anchor.x}
                      y1={anchor.y}
                      x2={pos.x}
                      y2={pos.y}
                      stroke="rgba(59,130,246,0.4)"
                      strokeWidth="0.3"
                      strokeDasharray="0.5 0.5"
                    />
                  )
                })}

                {/* Anchor point (terminal mule location) */}
                {selectedPredictions.length > 0 && (() => {
                  const anchor = project(28.5085, 77.3012)
                  return (
                    <>
                      <circle cx={anchor.x} cy={anchor.y} r="1.5" fill="rgba(239,68,68,0.6)" className="pulse-ring-active" />
                      <circle cx={anchor.x} cy={anchor.y} r="0.8" fill="#ef4444" />
                    </>
                  )
                })()}

                {/* ATM markers */}
                {atms.map((atm) => {
                  const pos = project(atm.latitude, atm.longitude)
                  const isPredicted = predictedAtmIds.has(atm.atm_id)
                  const pred = selectedPredictions.find((p) => p.atm_id === atm.atm_id)
                  const color = isPredicted
                    ? pred && pred.probability_score >= 80
                      ? '#ef4444'
                      : '#f97316'
                    : atm.risk_level === 'critical'
                    ? '#ef4444'
                    : atm.risk_level === 'high'
                    ? '#f97316'
                    : atm.risk_level === 'medium'
                    ? '#f59e0b'
                    : '#3b82f6'
                  return (
                    <g key={atm.id}>
                      {isPredicted && (
                        <circle cx={pos.x} cy={pos.y} r="2.5" fill={color} opacity="0.2" className="pulse-ring-active" />
                      )}
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={isPredicted ? 1.2 : 0.7}
                        fill={color}
                        stroke="#0a0f1d"
                        strokeWidth="0.2"
                      />
                    </g>
                  )
                })}
              </svg>

              {/* Legend */}
              <div className="absolute bottom-3 left-3 defense-card rounded-xl px-3 py-2 space-y-1">
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span> Predicted / Critical
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span> High Risk
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> Medium Risk
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span> Low Risk ATM
                </div>
              </div>
            </div>
          </div>

          {/* Predicted ATM list */}
          <div className="defense-card rounded-2xl p-5">
            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Predicted Cashout ATMs
            </h3>
            {selectedPredictions.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">
                No predictions yet. Run analysis from the Predictive Engine.
              </p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {selectedPredictions
                  .sort((a, b) => b.probability_score - a.probability_score)
                  .map((pred) => (
                    <div
                      key={pred.id}
                      className={`p-3 rounded-xl border ${
                        pred.probability_score >= 80
                          ? 'bg-red-500/10 border-red-500/30'
                          : 'bg-[#0a0f1d] border-slate-800/60'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-xs font-bold text-slate-200">{pred.atm_operator}</p>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {pred.atm_address}
                          </p>
                        </div>
                        <span className={`text-lg font-extrabold font-mono ${
                          pred.probability_score >= 80 ? 'text-red-400' : 'text-amber-400'
                        }`}>
                          {Math.round(pred.probability_score)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>{pred.distance_km.toFixed(2)} km away</span>
                        {pred.latitude && pred.longitude && (
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${pred.latitude},${pred.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                          >
                            <Navigation className="w-3 h-3" /> Directions
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {selectedPredictions.length > 0 && (
              <button
                onClick={() => navigate('/alerts')}
                className="w-full mt-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                <AlertTriangle className="w-4 h-4" />
                Go to Alert & Dispatch
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
