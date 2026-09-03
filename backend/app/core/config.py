import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Tamil Nadu Land Governance Intelligence Platform (TN-LGIP)"
    PROJECT_TAGLINE: str = "From Land Data to Policy Evidence"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    JURISDICTION: str = "State of Tamil Nadu, India"
    PILOT_DISTRICT: str = "Tiruppur"
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "*"]
    
    class Config:
        case_sensitive = True

settings = Settings()
