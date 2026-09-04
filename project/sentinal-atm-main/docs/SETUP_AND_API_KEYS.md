# SentinelATM: Setup & Real-World API Keys Guide

SentinelATM is designed to work **100% out of the box** using verified physical Indian ATM caches and open Overpass APIs. To connect **real-world live phone alerts** for your live pitch, follow this simple 2-minute guide.

---

## 1. Connecting Live Real-Time Phone Alerts (Telegram Bot API)
*Why Telegram?* It is **100% free**, takes 2 minutes to create, has zero SMS charges, and sends instantaneous push notifications with sound/vibration live on stage.

### Step 1: Create your Free Bot in 60 Seconds
1. Open the Telegram app on your phone.
2. Search for `@BotFather` (the official verified Telegram bot builder).
3. Send the message: `/newbot`
4. Follow the prompts:
   - Enter a name (e.g., `MHA Cyber Patrol Bot`).
   - Enter a username ending in `bot` (e.g., `mha_patrol_alert_bot`).
5. BotFather will reply with your **HTTP API Token**:
   `7829103912:AAH9fklsdf90234...`

### Step 2: Get your Personal Chat ID
1. Search for `@userinfobot` in Telegram and click **Start**.
2. It will reply with your **Id** (a number like `128941092`).

### Step 3: Configure SentinelATM `.env`
In `sentinel_atm/backend/.env`:
```ini
TELEGRAM_BOT_TOKEN="7829103912:AAH9fklsdf90234..."
TELEGRAM_CHAT_ID="128941092"
```

Now, whenever anyone clicks **"Dispatch Beat Patrol"** in your dashboard, your phone will instantly vibrate and sound an alarm on stage with the exact ATM coordinates and turn-by-turn Google Maps link!

---

## 2. Connecting Live Real-Time WhatsApp Alerts (CallMeBot Gateway)
*Why CallMeBot?* It is **100% free**, takes 60 seconds, and delivers real WhatsApp messages without needing a paid Twilio credit card account.

### Step 1: Get your Free WhatsApp API Key
1. Save this phone number in your contacts as **"Alert Gateway"**:
   👉 **`+34 644 71 89 27`** (or `+34 644 44 49 19`)
2. Open WhatsApp, message that number, and send:
   ```text
   I allow callmebot to send me messages
   ```
3. Within 15 seconds, the bot replies with your API Key (e.g. `123456`).

### Step 2: Configure SentinelATM `.env`
In `sentinel_atm/backend/.env`:
```ini
WHATSAPP_PHONE_NUMBER="91XXXXXXXXXX"
WHATSAPP_API_KEY="123456"
```
*Note: Write your phone number with country code (91 for India) without '+' or spaces.*

---

## 3. OpenStreetMap Overpass API (Real Indian ATMs)
* **API Endpoint:** `https://overpass-api.de/api/interpreter`
* **Cost:** **100% Free** (No API key or credit card needed).
* **How it works in SentinelATM:**
  The backend automatically queries physical ATM nodes (`amenity=atm` or `amenity=bank`) across Indian cities (Delhi, Mumbai, Bengaluru, etc.). If the public server is slow during an internet drop, SentinelATM's high-availability verified physical ATM cache kicks in seamlessly.

---

## 3. How to Launch the Full Stack

### Backend:
```powershell
cd C:\Users\HP\.gemini\antigravity\scratch\sentinel_atm\backend
python -m uvicorn app.main:app --reload --port 8000
```
*Interactive Swagger API Docs:* `http://localhost:8000/docs`

### Frontend:
```powershell
cd C:\Users\HP\.gemini\antigravity\scratch\sentinel_atm\frontend
npm install
npm run dev
```
*Live Command Center:* `http://localhost:3000`
