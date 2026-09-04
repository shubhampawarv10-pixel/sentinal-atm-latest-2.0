from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class CyberComplaint(BaseModel):
    complaint_id: str
    victim_name: str
    victim_upi_or_account: str
    victim_city: str
    fraud_category: str  # e.g., "Digital Arrest", "UPI QR Code Phishing", "Part-time Task Fraud", "Fake Investment"
    stolen_amount_inr: float
    reported_timestamp: str
    initial_beneficiary_account: str

class TransactionHop(BaseModel):
    hop_level: int  # 1 for Layer 1, 2 for Layer 2, 3 for Terminal Mule
    from_account: str
    to_account: str
    beneficiary_name: str
    bank_name: str
    amount_inr: float
    timestamp: str
    mule_risk_score: float  # 0 to 100
    is_terminal_cashout_account: bool = False

class MuleTrail(BaseModel):
    complaint_id: str
    total_stolen_inr: float
    hops: List[TransactionHop]
    terminal_mule_account: str
    terminal_mule_name: str
    terminal_bank: str
    terminal_branch_city: str
    terminal_branch_lat: float
    terminal_branch_lon: float
    transaction_velocity_score: float  # Speed at which money bounced (higher = faster cashout)
    estimated_cashout_window_minutes: int

class PredictedATM(BaseModel):
    atm_id: str
    operator_or_bank: str
    address: str
    latitude: float
    longitude: float
    distance_from_anchor_km: float
    probability_score: float  # 0 to 100%
    recommended_intercept_window: str
    google_maps_url: str

class InterceptForecastResponse(BaseModel):
    complaint_id: str
    fraud_category: str
    stolen_amount: float
    mule_trail: MuleTrail
    top_predicted_atms: List[PredictedATM]
    recommended_police_jurisdiction: str
    action_priority: str  # "CRITICAL / IMMEDIATE DISPATCH", "ELEVATED", "MONITORING"
    analysis_time_seconds: float

class DispatchPoliceRequest(BaseModel):
    complaint_id: str
    atm_id: str
    police_station_name: str
    officer_callsign: str = "PCR-ALPHA-09"
    custom_telegram_chat_id: Optional[str] = None

class DispatchPoliceResponse(BaseModel):
    dispatch_id: str
    complaint_id: str
    status: str
    target_atm_name: str
    dispatched_timestamp: str
    officer_callsign: str
    telegram_delivered: bool
    whatsapp_delivered: bool = False
    delivery_note: str
