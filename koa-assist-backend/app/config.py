import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "KOA Assist API"

    # JWT / Auth Settings
    SECRET_KEY: str = "your-super-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Database Settings
    DATABASE_URL: str = "sqlite:///./database.db"

    # Storage Directories
    UPLOAD_DIR: str = "uploads"
    MODEL_DIR: str = "models_store"

    # Hardware (ESP32 / IMU) Model Paths
    GAIT_MODEL_PATH: str = "models_store/koa_hardware_model.pkl"
    GAIT_FEATURES_PATH: str = "models_store/hardware_feature_names.pkl"

    # Video Gait Analysis Model Paths
    VIDEO_MODEL_PATH: str = "models_store/KOA_patient_independent_RF_model.pkl"
    VIDEO_SCALER_PATH: str = "models_store/KOA_patient_independent_scaler.pkl"
    VIDEO_FEATURES_PATH: str = "models_store/KOA_patient_independent_features.pkl"

    # Other Modal Paths (X-Ray & Questionnaire)
    XRAY_MODEL_PATH: str = "models_store/xray_model.pth"
    QUESTIONNAIRE_MODEL_PATH: str = "models_store/questionnaire_model.pkl"

    class Config:
        env_file = ".env"
        extra = "ignore"  # Ignores extraneous environment variables without throwing errors

settings = Settings()

# Automatically create local folders if they do not exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.MODEL_DIR, exist_ok=True)