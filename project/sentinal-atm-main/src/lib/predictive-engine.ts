import type {
  TransactionHopData,
  MuleTrail,
  PredictedATM,
  InterceptForecast,
  RiskFactor,
  ATM,
} from './types'

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371.0
  const dlat = (lat2 - lat1) * (Math.PI / 180)
  const dlon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dlon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c * 1000) / 1000
}

export function analyzeMuleTransactionGraph(
  complaintId: string,
  stolenAmount: number,
  rawTransactions: TransactionHopData[]
): MuleTrail {
  const hops: TransactionHopData[] = rawTransactions.map((tx) => ({
    ...tx,
    is_terminal_cashout_account: tx.is_terminal_cashout_account || false,
  }))

  const accounts = new Set<string>()
  const outDegree = new Map<string, number>()
  const inDegree = new Map<string, number>()

  for (const hop of hops) {
    accounts.add(hop.from_account)
    accounts.add(hop.to_account)
    outDegree.set(hop.from_account, (outDegree.get(hop.from_account) || 0) + 1)
    inDegree.set(hop.to_account, (inDegree.get(hop.to_account) || 0) + 1)
  }

  const sinkNodes = [...accounts].filter(
    (n) => (outDegree.get(n) || 0) === 0 && (inDegree.get(n) || 0) > 0
  )

  const terminalAccount = sinkNodes[0] || hops[hops.length - 1]?.to_account || ''
  const terminalHop =
    [...hops].reverse().find((h) => h.to_account === terminalAccount) || hops[hops.length - 1]

  if (terminalHop) terminalHop.is_terminal_cashout_account = true

  let durationMinutes = 8.5
  try {
    const tFirst = new Date(hops[0].timestamp).getTime()
    const tLast = new Date(hops[hops.length - 1].timestamp).getTime()
    durationMinutes = Math.max((tLast - tFirst) / 60000, 1.0)
  } catch {
    durationMinutes = 8.5
  }

  const velocityScore = Math.min(Math.max(100.0 - durationMinutes * 2.5, 40.0), 98.0)
  const estimatedCashoutWindow = Math.max(Math.round(40.0 - velocityScore * 0.25), 15)

  const anchorCity = 'Delhi NCR (South East District / Badarpur Border)'
  const anchorLat = 28.5085
  const anchorLon = 77.3012

  return {
    complaint_id: complaintId,
    total_stolen_inr: stolenAmount,
    hops,
    terminal_mule_account: terminalAccount,
    terminal_mule_name: terminalHop?.beneficiary_name || 'Unknown Mule',
    terminal_bank: terminalHop?.bank_name || 'Unknown Bank',
    terminal_branch_city: anchorCity,
    terminal_branch_lat: anchorLat,
    terminal_branch_lon: anchorLon,
    transaction_velocity_score: Math.round(velocityScore * 10) / 10,
    estimated_cashout_window_minutes: estimatedCashoutWindow,
  }
}

const FALLBACK_ATMS: Omit<ATM, 'id' | 'created_at' | 'risk_level' | 'risk_score'>[] = [
  {
    atm_id: 'ATM-SBI-BD01',
    operator: 'State Bank of India (24x7 e-Corner)',
    address: 'Opposite Metro Pillar 182, Mathura Road, Badarpur',
    city: 'Delhi',
    state: 'Delhi',
    latitude: 28.5034,
    longitude: 77.3045,
    is_24x7: true,
  },
  {
    atm_id: 'ATM-HDFC-TK04',
    operator: 'HDFC Bank ATM & Cash Recycler',
    address: 'Shop 12, Main Market, Tughlakabad Extension',
    city: 'Delhi',
    state: 'Delhi',
    latitude: 28.5142,
    longitude: 77.291,
    is_24x7: false,
  },
  {
    atm_id: 'ATM-PNB-MB02',
    operator: 'Punjab National Bank ATM',
    address: 'Near Mohan Cooperative Industrial Area Gate 2',
    city: 'Delhi',
    state: 'Delhi',
    latitude: 28.5195,
    longitude: 77.3115,
    is_24x7: false,
  },
  {
    atm_id: 'ATM-ICICI-BP09',
    operator: 'ICICI Bank ATM Kiosk',
    address: 'Plot 45, Sarita Vihar Commercial Complex',
    city: 'Delhi',
    state: 'Delhi',
    latitude: 28.528,
    longitude: 77.299,
    is_24x7: false,
  },
  {
    atm_id: 'ATM-BOB-BD07',
    operator: 'Bank of Baroda Micro-ATM Center',
    address: 'Badarpur Border Chowk, Mehrauli-Badarpur Road',
    city: 'Delhi',
    state: 'Delhi',
    latitude: 28.498,
    longitude: 77.307,
    is_24x7: false,
  },
  {
    atm_id: 'ATM-SBI-FTD02',
    operator: 'State Bank of India ATM',
    address: 'Sector 16A, Faridabad Main Road',
    city: 'Faridabad',
    state: 'Haryana',
    latitude: 28.4089,
    longitude: 77.3178,
    is_24x7: false,
  },
  {
    atm_id: 'ATM-AXIS-MG01',
    operator: 'Axis Bank ATM',
    address: 'M.G. Road, Near Metro Station, Faridabad',
    city: 'Faridabad',
    state: 'Haryana',
    latitude: 28.4211,
    longitude: 77.305,
    is_24x7: false,
  },
  {
    atm_id: 'ATM-HDFC-NSP01',
    operator: 'HDFC Bank Smart ATM',
    address: 'Nehru Place District Center, New Delhi',
    city: 'Delhi',
    state: 'Delhi',
    latitude: 28.5495,
    longitude: 77.2528,
    is_24x7: true,
  },
  {
    atm_id: 'ATM-KOTAK-CP01',
    operator: 'Kotak Mahindra Bank ATM',
    address: 'Connaught Place Inner Circle, New Delhi',
    city: 'Delhi',
    state: 'Delhi',
    latitude: 28.6315,
    longitude: 77.2167,
    is_24x7: false,
  },
  {
    atm_id: 'ATM-SBI-JMR01',
    operator: 'State Bank of India e-Corner',
    address: 'Jama Masjid Area, Old Delhi',
    city: 'Delhi',
    state: 'Delhi',
    latitude: 28.6501,
    longitude: 77.2335,
    is_24x7: true,
  },
  {
    atm_id: 'ATM-ICICI-ND01',
    operator: 'ICICI Bank 24x7 ATM',
    address: 'Noida Sector 18, Atta Market',
    city: 'Noida',
    state: 'Uttar Pradesh',
    latitude: 28.5707,
    longitude: 77.326,
    is_24x7: true,
  },
  {
    atm_id: 'ATM-YES-GGN01',
    operator: 'Yes Bank Micro ATM',
    address: 'Cyber City, Gurugram',
    city: 'Gurugram',
    state: 'Haryana',
    latitude: 28.4949,
    longitude: 77.0894,
    is_24x7: false,
  },
]

export function forecastAtmCashoutLocations(
  muleTrail: MuleTrail,
  fraudCategory: string,
  dbAtms?: ATM[]
): InterceptForecast {
  const candidateAtms = (dbAtms && dbAtms.length > 0 ? dbAtms : FALLBACK_ATMS).map((a) => ({
    atm_id: a.atm_id,
    operator: a.operator,
    address: a.address,
    latitude: a.latitude,
    longitude: a.longitude,
    distance_km: haversineDistanceKm(
      muleTrail.terminal_branch_lat,
      muleTrail.terminal_branch_lon,
      a.latitude,
      a.longitude
    ),
  }))

  candidateAtms.sort((a, b) => a.distance_km - b.distance_km)

  const velocity = muleTrail.transaction_velocity_score
  const predictedResults: PredictedATM[] = []

  const now = new Date()
  const startWindow = new Date(
    now.getTime() + muleTrail.estimated_cashout_window_minutes * 0.4 * 60000
  )
  const endWindow = new Date(
    now.getTime() + muleTrail.estimated_cashout_window_minutes * 1.3 * 60000
  )
  const windowStr = `${startWindow.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} - ${endWindow.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST (Next ${muleTrail.estimated_cashout_window_minutes} mins)`

  for (let idx = 0; idx < Math.min(candidateAtms.length, 5); idx++) {
    const atm = candidateAtms[idx]
    const dist = atm.distance_km

    const decay = Math.exp(-0.85 * dist)
    let rawProb = decay * 68.0 + velocity * 0.32

    if (atm.operator.toLowerCase().includes('sbi') || atm.operator.toLowerCase().includes('hdfc')) {
      rawProb += 6.5
    }

    const probScore = Math.round(Math.min(Math.max(rawProb - idx * 5.0, 20.0), 96.5) * 10) / 10
    const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${atm.latitude},${atm.longitude}`

    predictedResults.push({
      atm_id: atm.atm_id,
      operator_or_bank: atm.operator,
      address: atm.address,
      latitude: atm.latitude,
      longitude: atm.longitude,
      distance_from_anchor_km: dist,
      probability_score: probScore,
      recommended_intercept_window: windowStr,
      google_maps_url: gmapsUrl,
    })
  }

  predictedResults.sort((a, b) => b.probability_score - a.probability_score)

  const actionPriority =
    velocity > 75.0 || muleTrail.total_stolen_inr >= 200000.0
      ? 'CRITICAL / IMMEDIATE POLICE DISPATCH REQUIRED'
      : 'ELEVATED SURVEILLANCE / PATROL INTERCEPT'

  return {
    complaint_id: muleTrail.complaint_id,
    fraud_category: fraudCategory,
    stolen_amount: muleTrail.total_stolen_inr,
    mule_trail: muleTrail,
    top_predicted_atms: predictedResults.slice(0, 3),
    recommended_police_jurisdiction: 'South East District Cyber Police Station / PS Badarpur',
    action_priority: actionPriority,
    analysis_time_seconds: 0.18,
  }
}

export function calculateRiskFactors(
  forecast: InterceptForecast,
  complaint: { stolen_amount_inr: number; fraud_category: string }
): RiskFactor[] {
  const factors: RiskFactor[] = []
  const trail = forecast.mule_trail

  factors.push({
    factor_name: 'Transaction Velocity',
    factor_weight: Math.round(trail.transaction_velocity_score * 0.3) / 10,
    factor_description: `Money moved through ${trail.hops.length} hops in under ${trail.estimated_cashout_window_minutes} minutes. Velocity score: ${trail.transaction_velocity_score}/100. Higher velocity indicates faster cashout intent.`,
  })

  factors.push({
    factor_name: 'Stolen Amount Severity',
    factor_weight: Math.round(Math.min(complaint.stolen_amount_inr / 100000, 10)) / 10,
    factor_description: `₹${complaint.stolen_amount_inr.toLocaleString('en-IN')} stolen. Amounts above ₹2,00,000 trigger critical priority threshold for immediate dispatch.`,
  })

  factors.push({
    factor_name: 'Terminal Mule Risk',
    factor_weight: 0.25,
    factor_description: `Terminal account ${trail.terminal_mule_account} at ${trail.terminal_bank} identified as cashout sink. Mule risk score: ${trail.hops[trail.hops.length - 1]?.mule_risk_score || 95}/100.`,
  })

  factors.push({
    factor_name: 'ATM Proximity',
    factor_weight: 0.2,
    factor_description: `Top predicted ATM is ${forecast.top_predicted_atms[0]?.distance_from_anchor_km || 0} km from the terminal mule anchor location. Closer ATMs have exponentially higher cashout probability.`,
  })

  factors.push({
    factor_name: 'Fraud Category Risk',
    factor_weight: 0.15,
    factor_description: `"${complaint.fraud_category}" patterns show high cashout correlation based on historical NCRP/1930 complaint analysis (simulated).`,
  })

  return factors
}

export function getFallbackATMs(): Omit<ATM, 'id' | 'created_at' | 'risk_level' | 'risk_score'>[] {
  return FALLBACK_ATMS
}
