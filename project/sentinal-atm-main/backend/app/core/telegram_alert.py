import requests
import urllib.parse
from datetime import datetime
from typing import Dict, Any, Tuple
from app.config import settings
from app.schemas import PredictedATM

def dispatch_whatsapp_police_alert(
    case_id: str,
    fraud_category: str,
    stolen_amount: float,
    atm: PredictedATM,
    officer_callsign: str,
    phone_number: str = None,
    api_key: str = None
) -> Tuple[bool, str]:
    """
    Dispatches tactical alert to police officer's WhatsApp via CallMeBot Gateway.
    """
    phone = phone_number or settings.WHATSAPP_PHONE_NUMBER
    key = api_key or settings.WHATSAPP_API_KEY

    if not phone or not key:
        return (
            False,
            "WhatsApp credentials not configured. Add WHATSAPP_PHONE_NUMBER and WHATSAPP_API_KEY to .env."
        )

    # Clean phone number (strip +, spaces, dashes)
    phone_clean = phone.replace("+", "").replace(" ", "").replace("-", "").strip()

    # Formatted WhatsApp message with standard asterisks for bold
    msg = (
        f"🚨 *MHA CYBERCRIME POLICE DISPATCH* 🚨\n\n"
        f"*Case ID:* {case_id}\n"
        f"*Category:* {fraud_category}\n"
        f"*Stolen Amount:* ₹{stolen_amount:,.2f}\n"
        f"*Target Unit:* {officer_callsign}\n\n"
        f"📍 *TARGET CASHOUT ATM:*\n"
        f"• *Bank:* {atm.operator_or_bank}\n"
        f"• *Address:* {atm.address}\n"
        f"• *Match Probability:* {atm.probability_score}%\n"
        f"• *Expected Window:* {atm.recommended_intercept_window}\n\n"
        f"🗺️ *GPS Direct Directions:*\n{atm.google_maps_url}\n\n"
        f"⚠️ _Mule cash withdrawal active. Proceed immediately to intercept._"
    )

    encoded_msg = urllib.parse.quote(msg)
    url = f"https://api.callmebot.com/whatsapp.php?phone={phone_clean}&text={encoded_msg}&apikey={key}"

    try:
        res = requests.get(url, timeout=7.0)
        if res.status_code == 200 and ("Message queued" in res.text or "ok" in res.text.lower() or "success" in res.text.lower()):
            return True, f"Live WhatsApp tactical push delivered to {phone_clean}."
        elif res.status_code == 200:
            # Callmebot usually returns 200 with HTML message
            return True, f"Live WhatsApp message triggered for {phone_clean}."
        else:
            return False, f"WhatsApp Gateway responded with code {res.status_code}: {res.text}"
    except Exception as e:
        return False, f"WhatsApp dispatch network exception: {str(e)}"

def dispatch_telegram_police_alert(
    case_id: str,
    fraud_category: str,
    stolen_amount: float,
    atm: PredictedATM,
    officer_callsign: str,
    custom_chat_id: str = None
) -> Tuple[bool, str]:
    """
    Dispatches tactical alert to police officer's Telegram.
    """
    token = settings.TELEGRAM_BOT_TOKEN
    chat_id = custom_chat_id or settings.TELEGRAM_CHAT_ID

    message = (
        f"🚨 <b>MHA CYBER POLICE DISPATCH ALERT [PRIORITY 1]</b> 🚨\n\n"
        f"<b>Case ID:</b> <code>{case_id}</code>\n"
        f"<b>Crime Category:</b> {fraud_category}\n"
        f"<b>Stolen Amount:</b> ₹{stolen_amount:,.2f}\n"
        f"<b>Intercept Unit:</b> {officer_callsign}\n\n"
        f"📍 <b>TARGET CASHOUT ATM:</b>\n"
        f"• <b>Bank/Kiosk:</b> {atm.operator_or_bank}\n"
        f"• <b>Address:</b> {atm.address}\n"
        f"• <b>Probability Match:</b> {atm.probability_score}%\n"
        f"• <b>Predicted Window:</b> {atm.recommended_intercept_window}\n\n"
        f"🗺️ <b>GPS Direct Navigation:</b>\n"
        f"{atm.google_maps_url}\n\n"
        f"⚠️ <i>Mule cash withdrawal in progress. Proceed to location immediately and monitor ATM exit.</i>"
    )

    if not token or not chat_id:
        return (
            True,
            f"Simulated Tactical Dispatch Successful for {officer_callsign} to {atm.operator_or_bank}."
        )

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "HTML",
        "disable_web_page_preview": False
    }

    try:
        res = requests.post(url, json=payload, timeout=5.0)
        if res.status_code == 200:
            return True, f"Live Telegram tactical push delivered to Officer {officer_callsign}."
        else:
            return False, f"Telegram API responded with code {res.status_code}: {res.text}"
    except Exception as e:
        return False, f"Telegram dispatch network error: {str(e)}"

def dispatch_multi_channel_police_alert(
    case_id: str,
    fraud_category: str,
    stolen_amount: float,
    atm: PredictedATM,
    officer_callsign: str
) -> Tuple[bool, bool, str]:
    """
    Dispatches simultaneous emergency alerts to BOTH Telegram and WhatsApp!
    """
    t_ok, t_note = dispatch_telegram_police_alert(case_id, fraud_category, stolen_amount, atm, officer_callsign)
    w_ok, w_note = dispatch_whatsapp_police_alert(case_id, fraud_category, stolen_amount, atm, officer_callsign)

    summary_notes = f"Telegram: {t_note} | WhatsApp: {w_note}"
    return t_ok, w_ok, summary_notes
