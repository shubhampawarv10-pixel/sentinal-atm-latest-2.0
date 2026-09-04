import { supabase } from './supabase'
import { getFallbackATMs } from './predictive-engine'
import type { Complaint, TransactionHop, Alert, NetworkEntity, NetworkLink } from './types'

interface DemoComplaintSeed {
  complaint_id: string
  victim_name: string
  victim_upi_or_account: string
  victim_phone: string
  victim_city: string
  fraud_category: string
  stolen_amount_inr: number
  initial_beneficiary_account: string
  transactions: {
    hop_level: number
    from_account: string
    to_account: string
    beneficiary_name: string
    bank_name: string
    amount: number
    risk_score: number
    is_terminal: boolean
  }[]
}

const DEMO_COMPLAINTS: DemoComplaintSeed[] = [
  {
    complaint_id: 'NCRP-2026-DEL-8841',
    victim_name: 'Dr. Rajeshwar Sharma',
    victim_upi_or_account: 'dr.rajesh@okhdfcbank',
    victim_phone: '+91-98100-12345',
    victim_city: 'New Delhi',
    fraud_category: 'Digital Arrest / Fake CBI Extortion',
    stolen_amount_inr: 450000,
    initial_beneficiary_account: '9182390231@paytm',
    transactions: [
      {
        hop_level: 1,
        from_account: 'dr.rajesh@okhdfcbank',
        to_account: '9182390231@paytm',
        beneficiary_name: 'Ramesh Kumar (Layer 1 Mule)',
        bank_name: 'Paytm Payments Bank',
        amount: 450000,
        risk_score: 88,
        is_terminal: false,
      },
      {
        hop_level: 2,
        from_account: '9182390231@paytm',
        to_account: '50100412894102',
        beneficiary_name: 'Suresh Trading Corp (Layer 2 Mule)',
        bank_name: 'HDFC Bank',
        amount: 220000,
        risk_score: 92.5,
        is_terminal: false,
      },
      {
        hop_level: 3,
        from_account: '50100412894102',
        to_account: '0382000100849210',
        beneficiary_name: 'Manoj Rawat (Terminal Cashout Mule)',
        bank_name: 'Punjab National Bank (Badarpur)',
        amount: 220000,
        risk_score: 97,
        is_terminal: true,
      },
    ],
  },
  {
    complaint_id: 'NCRP-2026-MUM-4190',
    victim_name: 'Ananya Kulkarni',
    victim_upi_or_account: 'ananya.k@icici',
    victim_phone: '+91-98200-67890',
    victim_city: 'Mumbai',
    fraud_category: 'Telegram Work-From-Home Rating Scam',
    stolen_amount_inr: 185000,
    initial_beneficiary_account: '9821039912@ybl',
    transactions: [
      {
        hop_level: 1,
        from_account: 'ananya.k@icici',
        to_account: '9821039912@ybl',
        beneficiary_name: 'Dinesh Enterprises',
        bank_name: 'Yes Bank',
        amount: 185000,
        risk_score: 84,
        is_terminal: false,
      },
      {
        hop_level: 2,
        from_account: '9821039912@ybl',
        to_account: '620194820194',
        beneficiary_name: 'Vikram Singh (Terminal Mule)',
        bank_name: 'State Bank of India',
        amount: 185000,
        risk_score: 94,
        is_terminal: true,
      },
    ],
  },
  {
    complaint_id: 'NCRP-2026-BLR-9022',
    victim_name: 'Priya Nair',
    victim_upi_or_account: 'priya.nair@okaxis',
    victim_phone: '+91-99800-33221',
    victim_city: 'Bengaluru',
    fraud_category: 'Fake Trading App Investment',
    stolen_amount_inr: 820000,
    initial_beneficiary_account: '7302019384@ibl',
    transactions: [
      {
        hop_level: 1,
        from_account: 'priya.nair@okaxis',
        to_account: '7302019384@ibl',
        beneficiary_name: 'QuickProfit Trading LLC',
        bank_name: 'ICICI Bank',
        amount: 820000,
        risk_score: 89,
        is_terminal: false,
      },
      {
        hop_level: 2,
        from_account: '7302019384@ibl',
        to_account: '39201948201',
        beneficiary_name: 'Arjun Mehta (Layer 2 Mule)',
        bank_name: 'Kotak Mahindra Bank',
        amount: 600000,
        risk_score: 91,
        is_terminal: false,
      },
      {
        hop_level: 3,
        from_account: '39201948201',
        to_account: '0291040102938',
        beneficiary_name: 'Faisal Khan (Terminal Mule)',
        bank_name: 'Bank of Baroda',
        amount: 600000,
        risk_score: 96,
        is_terminal: true,
      },
    ],
  },
  {
    complaint_id: 'NCRP-2026-SUR-2810',
    victim_name: 'Meera Patel',
    victim_upi_or_account: 'meera.patel@oksbi',
    victim_phone: '+91-97120-44556',
    victim_city: 'Surat',
    fraud_category: 'FedEx Parcel / Courier Phishing Scam',
    stolen_amount_inr: 310000,
    initial_beneficiary_account: '8294010293@ybl',
    transactions: [
      {
        hop_level: 1,
        from_account: 'meera.patel@oksbi',
        to_account: '8294010293@ybl',
        beneficiary_name: 'Courier Service (Fake)',
        bank_name: 'PhonePe',
        amount: 310000,
        risk_score: 82,
        is_terminal: false,
      },
      {
        hop_level: 2,
        from_account: '8294010293@ybl',
        to_account: '620194820194',
        beneficiary_name: 'Sameer Khan (Shared Mule)',
        bank_name: 'State Bank of India',
        amount: 310000,
        risk_score: 93,
        is_terminal: true,
      },
    ],
  },
  {
    complaint_id: 'NCRP-2026-HYD-5512',
    victim_name: 'Karthik Reddy',
    victim_upi_or_account: 'karthik.r@okhdfcbank',
    victim_phone: '+91-90100-22118',
    victim_city: 'Hyderabad',
    fraud_category: 'Loan App Extortion / Data Theft',
    stolen_amount_inr: 95000,
    initial_beneficiary_account: '7291038401@ibl',
    transactions: [
      {
        hop_level: 1,
        from_account: 'karthik.r@okhdfcbank',
        to_account: '7291038401@ibl',
        beneficiary_name: 'QuickLoan Pro (Shell)',
        bank_name: 'Razorpay',
        amount: 95000,
        risk_score: 78,
        is_terminal: false,
      },
      {
        hop_level: 2,
        from_account: '7291038401@ibl',
        to_account: '0382019201938',
        beneficiary_name: 'Deepak Yadav (Terminal Mule)',
        bank_name: 'Punjab National Bank',
        amount: 95000,
        risk_score: 90,
        is_terminal: true,
      },
    ],
  },
  {
    complaint_id: 'NCRP-2026-KOL-3340',
    victim_name: 'Shreya Bose',
    victim_upi_or_account: 'shreya.b@okicici',
    victim_phone: '+91-98300-88221',
    victim_city: 'Kolkata',
    fraud_category: 'UPI QR Code Phishing',
    stolen_amount_inr: 145000,
    initial_beneficiary_account: '9120394810@ybl',
    transactions: [
      {
        hop_level: 1,
        from_account: 'shreya.b@okicici',
        to_account: '9120394810@ybl',
        beneficiary_name: 'Unknown Beneficiary (QR Scan)',
        bank_name: 'BHIM UPI',
        amount: 145000,
        risk_score: 80,
        is_terminal: false,
      },
      {
        hop_level: 2,
        from_account: '9120394810@ybl',
        to_account: '39201049201',
        beneficiary_name: 'Rohit Das (Terminal Mule)',
        bank_name: 'Axis Bank',
        amount: 145000,
        risk_score: 91,
        is_terminal: true,
      },
    ],
  },
]

export async function seedDemoData(): Promise<{ success: boolean; message: string }> {
  try {
    const atms = getFallbackATMs()

    for (const atm of atms) {
      await supabase.from('atms').upsert({
        atm_id: atm.atm_id,
        operator: atm.operator,
        address: atm.address,
        city: atm.city,
        state: atm.state,
        latitude: atm.latitude,
        longitude: atm.longitude,
        is_24x7: atm.is_24x7,
        risk_level: 'low',
        risk_score: 0,
      }, { onConflict: 'atm_id' })
    }

    for (const seed of DEMO_COMPLAINTS) {
      const now = new Date()
      const reportedTime = new Date(now.getTime() - Math.random() * 3600000 - 600000)

      const { data: complaint } = await supabase.from('complaints').upsert({
        complaint_id: seed.complaint_id,
        victim_name: seed.victim_name,
        victim_upi_or_account: seed.victim_upi_or_account,
        victim_phone: seed.victim_phone,
        victim_city: seed.victim_city,
        fraud_category: seed.fraud_category,
        stolen_amount_inr: seed.stolen_amount_inr,
        reported_timestamp: reportedTime.toISOString(),
        initial_beneficiary_account: seed.initial_beneficiary_account,
        status: 'new',
        risk_score: 0,
        risk_level: 'low',
        intercept_window_minutes: 30,
      }, { onConflict: 'complaint_id' }).select().single()

      if (!complaint) continue

      for (const tx of seed.transactions) {
        const txTime = new Date(reportedTime.getTime() + tx.hop_level * 4 * 60000)
        await supabase.from('transactions').upsert({
          complaint_id: seed.complaint_id,
          hop_level: tx.hop_level,
          from_account: tx.from_account,
          to_account: tx.to_account,
          beneficiary_name: tx.beneficiary_name,
          bank_name: tx.bank_name,
          amount_inr: tx.amount,
          timestamp: txTime.toISOString(),
          mule_risk_score: tx.risk_score,
          is_terminal_cashout: tx.is_terminal,
        }, { onConflict: 'complaint_id,hop_level' })
      }

      await seedNetworkEntities(seed)
    }

    await seedInitialAlerts()

    return { success: true, message: `Seeded ${DEMO_COMPLAINTS.length} complaints and ${atms.length} ATMs` }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, message: `Seeding failed: ${msg}` }
  }
}

async function seedNetworkEntities(seed: DemoComplaintSeed) {
  const entities: Omit<NetworkEntity, 'id' | 'created_at'>[] = []
  const links: Omit<NetworkLink, 'id' | 'created_at'>[] = []

  entities.push({
    complaint_id: seed.complaint_id,
    entity_id: `complaint-${seed.complaint_id}`,
    entity_type: 'complaint',
    label: seed.complaint_id,
    sub_label: seed.fraud_category,
    risk_score: 85,
    metadata: {},
  })

  entities.push({
    complaint_id: seed.complaint_id,
    entity_id: `victim-${seed.complaint_id}`,
    entity_type: 'victim',
    label: seed.victim_name,
    sub_label: seed.victim_city,
    risk_score: 0,
    metadata: { upi: seed.victim_upi_or_account, phone: seed.victim_phone },
  })

  links.push({
    complaint_id: seed.complaint_id,
    source_entity_id: `victim-${seed.complaint_id}`,
    target_entity_id: `complaint-${seed.complaint_id}`,
    link_type: 'reported',
    amount_inr: 0,
    label: 'filed complaint',
  })

  const seenAccounts = new Set<string>()
  for (const tx of seed.transactions) {
    if (!seenAccounts.has(tx.from_account)) {
      seenAccounts.add(tx.from_account)
      const isMule = tx.hop_level > 1
      entities.push({
        complaint_id: seed.complaint_id,
        entity_id: `account-${tx.from_account}`,
        entity_type: isMule ? 'mule' : 'account',
        label: tx.from_account,
        sub_label: tx.bank_name,
        risk_score: tx.risk_score - 10,
        metadata: {},
      })
    }
    if (!seenAccounts.has(tx.to_account)) {
      seenAccounts.add(tx.to_account)
      entities.push({
        complaint_id: seed.complaint_id,
        entity_id: `account-${tx.to_account}`,
        entity_type: tx.is_terminal ? 'mule' : 'account',
        label: tx.to_account,
        sub_label: tx.beneficiary_name,
        risk_score: tx.risk_score,
        metadata: { bank: tx.bank_name, is_terminal: tx.is_terminal },
      })
    }

    entities.push({
      complaint_id: seed.complaint_id,
      entity_id: `bank-${tx.bank_name}`,
      entity_type: 'bank',
      label: tx.bank_name,
      sub_label: 'Banking Institution',
      risk_score: 0,
      metadata: {},
    })

    links.push({
      complaint_id: seed.complaint_id,
      source_entity_id: `account-${tx.from_account}`,
      target_entity_id: `account-${tx.to_account}`,
      link_type: 'transfer',
      amount_inr: tx.amount,
      label: `₹${tx.amount.toLocaleString('en-IN')}`,
    })

    links.push({
      complaint_id: seed.complaint_id,
      source_entity_id: `account-${tx.to_account}`,
      target_entity_id: `bank-${tx.bank_name}`,
      link_type: 'owns',
      amount_inr: 0,
      label: 'account at',
    })
  }

  for (const e of entities) {
    await supabase.from('network_entities').upsert(e, { onConflict: 'complaint_id,entity_id' })
  }
  for (const l of links) {
    await supabase.from('network_links').insert(l)
  }
}

async function seedInitialAlerts() {
  const alertSeeds: {
    alert_id: string
    complaint_id: string
    severity: 'critical' | 'high' | 'medium'
    title: string
    description: string
    location: string
    latitude: number
    longitude: number
    eta_minutes: number
    recommended_action: string
    status: 'active'
  }[] = [
    {
      alert_id: 'ALERT-2026-001',
      complaint_id: 'NCRP-2026-DEL-8841',
      severity: 'critical',
      title: 'Critical: Digital Arrest Cashout Imminent',
      description: '₹4,50,000 routed through 3 mule hops to PNB Badarpur. Cashout predicted within 18 minutes.',
      location: 'SBI e-Corner, Mathura Road, Badarpur',
      latitude: 28.5034,
      longitude: 77.3045,
      eta_minutes: 18,
      recommended_action: 'Dispatch PCR unit immediately. Coordinate with bank to freeze mule card.',
      status: 'active',
    },
    {
      alert_id: 'ALERT-2026-002',
      complaint_id: 'NCRP-2026-BLR-9022',
      severity: 'high',
      title: 'High: Fake Trading App - Large Cashout Predicted',
      description: '₹8,20,000 routed through 3 hops. Terminal mule at Bank of Baroda. Cashout predicted within 25 minutes.',
      location: 'BoB Micro-ATM, Badarpur Border',
      latitude: 28.498,
      longitude: 77.307,
      eta_minutes: 25,
      recommended_action: 'Alert bank branch. Dispatch patrol unit to monitor ATM.',
      status: 'active',
    },
    {
      alert_id: 'ALERT-2026-003',
      complaint_id: 'NCRP-2026-MUM-4190',
      severity: 'medium',
      title: 'Medium: Telegram Task Fraud Cashout',
      description: '₹1,85,000 routed through 2 hops to SBI terminal mule.',
      location: 'SBI ATM, Faridabad',
      latitude: 28.4089,
      longitude: 77.3178,
      eta_minutes: 30,
      recommended_action: 'Monitor ATM. Alert bank compliance team.',
      status: 'active',
    },
  ]

  for (const a of alertSeeds) {
    await supabase.from('alerts').upsert(a, { onConflict: 'alert_id' })
  }
}

export async function resetDemoData(): Promise<{ success: boolean; message: string }> {
  try {
    await supabase.from('network_links').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('network_entities').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('dispatches').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('alerts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('prediction_factors').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('predictions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('evidence').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('complaints').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('atms').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    return await seedDemoData()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, message: `Reset failed: ${msg}` }
  }
}

export async function logAudit(
  userId: string | null,
  userEmail: string | null,
  action: string,
  entityType?: string,
  entityId?: string,
  details?: Record<string, unknown>
) {
  try {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      user_email: userEmail,
      action,
      entity_type: entityType || null,
      entity_id: entityId || null,
      details: details || {},
    })
  } catch (e) {
    console.error('Failed to log audit:', e)
  }
}
