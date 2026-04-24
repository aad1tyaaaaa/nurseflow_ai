from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "NurseFlow AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/nurseflow_ai"
    DATABASE_ECHO: bool = False

    # Security
    SECRET_KEY: str = "change-this-to-a-secure-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8-hour shift
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    # Redis (for caching, real-time alerts)
    REDIS_URL: str = "redis://localhost:6379/0"

    # Kafka (streaming vitals pipeline)
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_VITALS_TOPIC: str = "patient-vitals"
    KAFKA_ALERTS_TOPIC: str = "clinical-alerts"

    # AI/ML
    SBAR_MODEL_PATH: Optional[str] = None
    FALL_RISK_MODEL_PATH: Optional[str] = None
    NLP_MODEL_PATH: Optional[str] = None

    # FHIR Integration
    FHIR_BASE_URL: Optional[str] = None
    FHIR_CLIENT_ID: Optional[str] = None
    FHIR_CLIENT_SECRET: Optional[str] = None

    # File Storage (voice notes)
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 50

    # Groq LLM
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: Optional[str] = "llama3-8b-8192"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
