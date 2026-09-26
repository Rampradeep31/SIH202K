import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Automatically load backend/.env if python-dotenv is present
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).resolve().parent.parent.parent / ".env"
    load_dotenv(dotenv_path=env_path)
except ImportError:
    pass

class Settings(BaseSettings):
    PROJECT_NAME: str = "Tamil Nadu Land Governance Intelligence Platform (TN-LGIP)"
    PROJECT_TAGLINE: str = "From Land Data to Policy Evidence"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    JURISDICTION: str = "State of Tamil Nadu, India"
    PILOT_DISTRICT: str = "Tiruppur"
    # No wildcard here: browsers reject a credentialed request (allow_credentials=True
    # in main.py) against Access-Control-Allow-Origin: *, so "*" alongside explicit
    # origins was dead weight that also widened the attack surface for no benefit.
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]
    # Set on the deployed backend (e.g. Render) to your Vercel frontend URL —
    # appended below rather than read directly into CORS_ORIGINS, since
    # pydantic-settings expects list-typed env vars as JSON, not a bare URL.
    FRONTEND_URL: str = ""

    class Config:
        case_sensitive = True

settings = Settings()

if settings.FRONTEND_URL and settings.FRONTEND_URL not in settings.CORS_ORIGINS:
    settings.CORS_ORIGINS = settings.CORS_ORIGINS + [settings.FRONTEND_URL]

