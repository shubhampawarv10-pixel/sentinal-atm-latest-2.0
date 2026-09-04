import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query

from app.schemas import (
    CyberComplaint,
    InterceptForecastResponse,
    DispatchPoliceRequest,
    DispatchPoliceResponse,
    PredictedATM
)
from app.core.data_generator import get_sample_cyber_complaints
from app.core.mule_graph import analyze_mule_transaction_graph
from app.core.predictive_engine import forecast_atm_cashout_locations
from app.core.telegram_alert import dispatch_telegram_police_alert, dispatch_multi_channel_police_alert

router = APIRouter()

# In-memory storage for complaints and dispatches
complaints_db = get_sample_cyber_complaints()
dispatch_logs = []

@router.get("/health")
def health_check():
    return {
        "status": "OPERATIONAL",
        "service": "SentinelATM - MHA/I4C Cybercrime Intelligence Framework",
        "deliverables": {
            "a": "Predictive Analytics Engine [ACTIVE]",
            "b": "Risk Heatmap GIS Dashboard [ACTIVE]",
            "c": "Law Enforcement Interface [ACTIVE]",
            "d": "Alert & Notification Dispatcher [ACTIVE]"
        }
    }

# --------------------------------------------------------------------------
# Component B & C: Complaints Ingestion & Drill-Down Filtering
# --------------------------------------------------------------------------
@router.get("/complaints")
def list_complaints(
    category: Optional[str] = Query(None, description="Filter by fraud category"),
    city: Optional[str] = Query(None, description="Filter by city/district"),
    min_amount: Optional[float] = Query(None, description="Filter by minimum stolen amount")
):
    """
    Returns live cybercrime complaints from the National Cybercrime Reporting Portal (NCRP / 1930).
    Supports multi-axis drill-down filters (time, location, crime category).
    """
    results = complaints_db
    if category:
        results = [c for c in results if category.lower() in c["fraud_category"].lower()]
    if city:
        results = [c for c in results if city.lower() in c["victim_city"].lower()]
    if min_amount:
        results = [c for c in results if c["stolen_amount_inr"] >= min_amount]
    return results

# --------------------------------------------------------------------------
# Component A: Predictive Analytics Engine
# --------------------------------------------------------------------------
@router.post("/predict/{complaint_id}", response_model=InterceptForecastResponse)
def run_prediction_for_complaint(complaint_id: str):
    """
    Component A: AI/ML-based Predictive Analytics Engine.
    Traces multi-hop mule account transfers and forecasts likely cash withdrawal ATMs in advance.
    """
    complaint = next((c for c in complaints_db if c["complaint_id"] == complaint_id), None)
    if not complaint:
        raise HTTPException(status_code=404, detail=f"Complaint ID {complaint_id} not found in NCRP ledger.")

    # 1. Trace the multi-hop transaction graph
    mule_trail = analyze_mule_transaction_graph(
        complaint_id=complaint["complaint_id"],
        stolen_amount=complaint["stolen_amount_inr"],
        raw_transactions=complaint["transactions"]
    )

    # 2. Forecast ATM withdrawal locations using Overpass API + Spatial Velocity model
    forecast = forecast_atm_cashout_locations(
        mule_trail=mule_trail,
        fraud_category=complaint["fraud_category"]
    )

    return forecast

# --------------------------------------------------------------------------
# Component D: Alert & Notification System
# --------------------------------------------------------------------------
@router.post("/dispatch-alert", response_model=DispatchPoliceResponse)
def trigger_police_dispatch(req: DispatchPoliceRequest):
    """
    Component D: Real-time notification system.
    Dispatches tactical push alerts with live GPS directions to beat officers via Telegram/SMS.
    """
    complaint = next((c for c in complaints_db if c["complaint_id"] == req.complaint_id), None)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    # Reconstruct prediction to retrieve target ATM details
    mule_trail = analyze_mule_transaction_graph(
        complaint_id=complaint["complaint_id"],
        stolen_amount=complaint["stolen_amount_inr"],
        raw_transactions=complaint["transactions"]
    )
    forecast = forecast_atm_cashout_locations(mule_trail, complaint["fraud_category"])
    
    target_atm = next((a for a in forecast.top_predicted_atms if a.atm_id == req.atm_id), forecast.top_predicted_atms[0])

    # Dispatch to Multi-Channel (Telegram + WhatsApp)
    t_delivered, w_delivered, note = dispatch_multi_channel_police_alert(
        case_id=req.complaint_id,
        fraud_category=complaint["fraud_category"],
        stolen_amount=complaint["stolen_amount_inr"],
        atm=target_atm,
        officer_callsign=req.officer_callsign
    )

    dispatch_id = f"DISPATCH-MHA-{uuid.uuid4().hex[:6].upper()}"
    response = DispatchPoliceResponse(
        dispatch_id=dispatch_id,
        complaint_id=req.complaint_id,
        status="TACTICAL_ALERT_BROADCASTED",
        target_atm_name=target_atm.operator_or_bank,
        dispatched_timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S IST"),
        officer_callsign=req.officer_callsign,
        telegram_delivered=t_delivered,
        whatsapp_delivered=w_delivered,
        delivery_note=note
    )
    dispatch_logs.append(response.model_dump())
    return response

# --------------------------------------------------------------------------
# Component D (Bank Coordination): CFCFRMS Instant Fund Freeze
# --------------------------------------------------------------------------
@router.post("/cfcfrms/freeze-terminal-mule/{complaint_id}")
def trigger_cfcfrms_fund_freeze(complaint_id: str):
    """
    Simulates instantaneous fund-blocking communication with Bank Switches
    via Citizen Financial Cyber Fraud Reporting and Management System (CFCFRMS).
    """
    complaint = next((c for c in complaints_db if c["complaint_id"] == complaint_id), None)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    mule_trail = analyze_mule_transaction_graph(
        complaint_id=complaint["complaint_id"],
        stolen_amount=complaint["stolen_amount_inr"],
        raw_transactions=complaint["transactions"]
    )

    return {
        "status": "FUNDS_FREEZE_INITIATED",
        "protocol": "CFCFRMS-API-v3",
        "target_bank": mule_trail.terminal_bank,
        "target_mule_account": mule_trail.terminal_mule_account,
        "amount_blocked_inr": mule_trail.total_stolen_inr,
        "debit_freeze_active": True,
        "atm_withdrawal_blocked": True,
        "timestamp": datetime.now().isoformat()
    }
