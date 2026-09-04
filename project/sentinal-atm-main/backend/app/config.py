import os
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "SentinelATM - Predictive Cybercrime Interception"
    APP_ENV: str = os.getenv("APP_ENV", "production")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    
    # Overpass API for real Indian ATM node queries
    OVERPASS_API_URL: str = os.getenv("OVERPASS_API_URL", "https://overpass-api.de/api/interpreter")
    
    # Telegram Police Dispatcher Integration
    TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
    TELEGRAM_CHAT_ID: str = os.getenv("TELEGRAM_CHAT_ID", "")
    
    # WhatsApp Police Dispatcher Integration (CallMeBot Gateway)
    WHATSAPP_PHONE_NUMBER: str = os.getenv("WHATSAPP_PHONE_NUMBER", "")
    WHATSAPP_API_KEY: str = os.getenv("WHATSAPP_API_KEY", "")

    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    DATA_DIR: Path = BASE_DIR / "data"

    class Config:
        env_file = Path(__file__).resolve().parent.parent / ".env"
        extra = "ignore"

settings = Settings()
# Explicit fallback if os.getenv didn't catch it
if not settings.TELEGRAM_BOT_TOKEN:
    env_path = settings.BASE_DIR / ".env"
    if env_path.exists():
        with open(env_path, "r") as f:
            for line in f:
                if line.startswith("TELEGRAM_BOT_TOKEN="):
                    settings.TELEGRAM_BOT_TOKEN = line.split("=", 1)[1].strip().strip('"').strip("'")
                elif line.startswith("TELEGRAM_CHAT_ID="):
                    settings.TELEGRAM_CHAT_ID = line.split("=", 1)[1].strip().strip('"').strip("'")
                elif line.startswith("WHATSAPP_PHONE_NUMBER="):
                    settings.WHATSAPP_PHONE_NUMBER = line.split("=", 1)[1].strip().strip('"').strip("'")
                elif line.startswith("WHATSAPP_API_KEY="):
                    settings.WHATSAPP_API_KEY = line.split("=", 1)[1].strip().strip('"').strip("'")

settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
