from datetime import datetime, timedelta
from typing import List, Dict, Any
from app.schemas import CyberComplaint

def get_sample_cyber_complaints() -> List[Dict[str, Any]]:
    """Returns curated realistic Indian cybercrime complaints from the 1930 helpline."""
    now = datetime.now()
    
    return [
        {
            "complaint_id": "NCRP-2026-DEL-8841",
            "victim_name": "Dr. Rajeshwar Sharma",
            "victim_upi_or_account": "dr.rajesh@okhdfcbank",
            "victim_city": "New Delhi",
            "fraud_category": "Digital Arrest / Fake CBI Extortion",
            "stolen_amount_inr": 450000.0,
            "reported_timestamp": (now - timedelta(minutes=14)).isoformat(),
            "initial_beneficiary_account": "9182390231@paytm",
            "transactions": [
                {
                    "hop_level": 1,
                    "from_account": "dr.rajesh@okhdfcbank",
                    "to_account": "9182390231@paytm",
                    "beneficiary_name": "Ramesh Kumar (Layer 1 Mule)",
                    "bank_name": "Paytm Payments Bank",
                    "amount": 450000.0,
                    "timestamp": (now - timedelta(minutes=12)).isoformat(),
                    "risk_score": 88.0,
                    "is_terminal": False
                },
                {
                    "hop_level": 2,
                    "from_account": "9182390231@paytm",
                    "to_account": "50100412894102",
                    "beneficiary_name": "Suresh Trading Corp (Layer 2 Mule)",
                    "bank_name": "HDFC Bank",
                    "amount": 220000.0,
                    "timestamp": (now - timedelta(minutes=8)).isoformat(),
                    "risk_score": 92.5,
                    "is_terminal": False
                },
                {
                    "hop_level": 3,
                    "from_account": "50100412894102",
                    "to_account": "0382000100849210",
                    "beneficiary_name": "Manoj Rawat (Terminal Cashout Mule)",
                    "bank_name": "Punjab National Bank (Badarpur)",
                    "amount": 220000.0,
                    "timestamp": (now - timedelta(minutes=4)).isoformat(),
                    "risk_score": 97.0,
                    "is_terminal": True
                }
            ]
        },
        {
            "complaint_id": "NCRP-2026-MUM-4190",
            "victim_name": "Ananya Kulkarni",
            "victim_upi_or_account": "ananya.k@icici",
            "victim_city": "Mumbai",
            "fraud_category": "Telegram Work-From-Home Rating Scam",
            "stolen_amount_inr": 185000.0,
            "reported_timestamp": (now - timedelta(minutes=22)).isoformat(),
            "initial_beneficiary_account": "9821039912@ybl",
            "transactions": [
                {
                    "hop_level": 1,
                    "from_account": "ananya.k@icici",
                    "to_account": "9821039912@ybl",
                    "beneficiary_name": "Dinesh Enterprises",
                    "bank_name": "Yes Bank",
                    "amount": 185000.0,
                    "timestamp": (now - timedelta(minutes=18)).isoformat(),
                    "risk_score": 84.0,
                    "is_terminal": False
                },
                {
                    "hop_level": 2,
                    "from_account": "9821039912@ybl",
                    "to_account": "620194820194",
                    "beneficiary_name": "Vikram Singh (Terminal Mule)",
                    "bank_name": "State Bank of India",
                    "amount": 185000.0,
                    "timestamp": (now - timedelta(minutes=9)).isoformat(),
                    "risk_score": 94.0,
                    "is_terminal": True
                }
            ]
        }
    ]
