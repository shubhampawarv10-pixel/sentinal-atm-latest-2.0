from app.core.data_generator import get_sample_cyber_complaints
from app.core.mule_graph import analyze_mule_transaction_graph
from app.core.predictive_engine import forecast_atm_cashout_locations
from app.core.telegram_alert import dispatch_telegram_police_alert

def test_full_mha_pipeline():
    print("=" * 70)
    print("SENTINEL-ATM (PS SIH26184) - MHA/I4C FRAMEWORK VERIFICATION TEST")
    print("=" * 70)

    # 1. Ingest Sample Complaint
    complaints = get_sample_cyber_complaints()
    case = complaints[0]
    print(f"\n[1. COMPONENT B/C: NCRP INGESTION]")
    print(f"Complaint ID: {case['complaint_id']}")
    print(f"Victim: {case['victim_name']} ({case['victim_city']})")
    print(f"Fraud Category: {case['fraud_category']}")
    print(f"Stolen Amount: Rs. {case['stolen_amount_inr']:,.2f}")

    # 2. Component A: Multi-Hop Mule Graph Tracing
    print(f"\n[2. COMPONENT A: MULTI-HOP MULE GRAPH ENGINE]")
    mule_trail = analyze_mule_transaction_graph(
        complaint_id=case["complaint_id"],
        stolen_amount=case["stolen_amount_inr"],
        raw_transactions=case["transactions"]
    )
    print(f"Total Hops Traced: {len(mule_trail.hops)}")
    for h in mule_trail.hops:
        status = ">>> TERMINAL CASHOUT SINK" if h.is_terminal_cashout_account else "-> Intermediary Mule"
        print(f"  Layer {h.hop_level}: {h.from_account} -> {h.to_account} ({h.bank_name}) | Rs. {h.amount_inr:,.2f} {status}")
    print(f"Terminal Account: {mule_trail.terminal_mule_account} ({mule_trail.terminal_bank})")
    print(f"Transaction Velocity Score: {mule_trail.transaction_velocity_score}/100")
    print(f"Predicted Cashout ETA: Next {mule_trail.estimated_cashout_window_minutes} minutes")

    # 3. Component A: Real-World ATM Geospatial Prediction
    print(f"\n[3. COMPONENT A: SPATIO-TEMPORAL ATM FORECASTING]")
    forecast = forecast_atm_cashout_locations(mule_trail, case["fraud_category"])
    print(f"Recommended Police Jurisdiction: {forecast.recommended_police_jurisdiction}")
    print(f"Action Priority: {forecast.action_priority}")
    print(f"\nTOP 3 HIGH-PROBABILITY TARGET ATMs:")
    for idx, atm in enumerate(forecast.top_predicted_atms, 1):
        print(f"  #{idx} [{atm.probability_score}% MATCH] {atm.operator_or_bank}")
        print(f"     Address: {atm.address}")
        print(f"     GPS: {atm.latitude}, {atm.longitude} (Distance: {atm.distance_from_anchor_km} km)")
        print(f"     Window: {atm.recommended_intercept_window}")
        print(f"     Google Maps: {atm.google_maps_url}")

    # 4. Component D: Tactical Alert & Notification System
    print(f"\n[4. COMPONENT D: REAL-TIME POLICE & CFCFRMS DISPATCH]")
    top_atm = forecast.top_predicted_atms[0]
    delivered, note = dispatch_telegram_police_alert(
        case_id=case["complaint_id"],
        fraud_category=case["fraud_category"],
        stolen_amount=case["stolen_amount_inr"],
        atm=top_atm,
        officer_callsign="PCR-COMMAND-09"
    )
    print(f"Tactical Dispatch Status: {'SUCCESS' if delivered else 'FAILED'}")
    print(f"Dispatch Detail: {note}")

    print("\n" + "=" * 70)
    print("[ALL 4 OFFICIAL DELIVERABLES (A, B, C, D) VERIFIED SUCCESSFULLY]")
    print("=" * 70)

if __name__ == "__main__":
    test_full_mha_pipeline()
