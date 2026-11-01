import os
import joblib
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("koa_assist")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODELS_DIR = os.path.join(BASE_DIR, "models_store")

XRAY_MODEL_PATH = os.path.join(MODELS_DIR, "xray_model.pth")
QUEST_MODEL_PATH = os.path.join(MODELS_DIR, "questionnaire_model.pkl")

# Gait Assessment Paths
GAIT_MODEL_PATH = os.path.join(MODELS_DIR, "KOA_patient_independent_RF_model.pkl")
GAIT_SCALER_PATH = os.path.join(MODELS_DIR, "KOA_patient_independent_scaler.pkl")
GAIT_FEATURES_PATH = os.path.join(MODELS_DIR, "KOA_patient_independent_features.pkl")

# Hardware / Sensor Paths
HARDWARE_MODEL_PATH = os.path.join(MODELS_DIR, "koa_hardware_model.pkl")
HARDWARE_FEATURES_PATH = os.path.join(MODELS_DIR, "hardware_feature_names.pkl")

class ModelRegistry:
    def __init__(self):
        self.models: Dict[str, Any] = {}

    def get_xray_model(self):
        if "xray_model" in self.models:
            return self.models["xray_model"]
        if os.path.exists(XRAY_MODEL_PATH):
            try:
                import torch
                logger.info(f"Loading PyTorch X-Ray model from {XRAY_MODEL_PATH}...")
                model = torch.load(XRAY_MODEL_PATH, map_location=torch.device('cpu'), weights_only=False)
                if hasattr(model, 'eval'):
                    model.eval()
                self.models["xray_model"] = model
                return model
            except Exception as e:
                logger.error(f"Failed to load X-Ray model: {e}")
                return None
        return None

    def get_questionnaire_model(self):
        if "questionnaire_model" in self.models:
            return self.models["questionnaire_model"]
        if os.path.exists(QUEST_MODEL_PATH):
            try:
                model = joblib.load(QUEST_MODEL_PATH)
                self.models["questionnaire_model"] = model
                return model
            except Exception as e:
                logger.error(f"Failed to load Questionnaire model: {e}")
                return None
        return None

    def get_gait_bundle(self):
        if "gait_model" in self.models:
            return {
                "model": self.models.get("gait_model"),
                "scaler": self.models.get("gait_scaler"),
                "features": self.models.get("gait_features"),
            }
        try:
            if os.path.exists(GAIT_MODEL_PATH):
                self.models["gait_model"] = joblib.load(GAIT_MODEL_PATH)
            if os.path.exists(GAIT_SCALER_PATH):
                self.models["gait_scaler"] = joblib.load(GAIT_SCALER_PATH)
            if os.path.exists(GAIT_FEATURES_PATH):
                self.models["gait_features"] = joblib.load(GAIT_FEATURES_PATH)
            return {
                "model": self.models.get("gait_model"),
                "scaler": self.models.get("gait_scaler"),
                "features": self.models.get("gait_features"),
            }
        except Exception as e:
            logger.error(f"Failed to load Gait artifacts: {e}")
            return {"model": None, "scaler": None, "features": None}

    def get_hardware_bundle(self):
        """Loads and returns the Hardware / Sensor Model and Features."""
        if "hardware_model" in self.models:
            return {
                "model": self.models.get("hardware_model"),
                "features": self.models.get("hardware_features"),
            }
        try:
            if os.path.exists(HARDWARE_MODEL_PATH):
                self.models["hardware_model"] = joblib.load(HARDWARE_MODEL_PATH)
            if os.path.exists(HARDWARE_FEATURES_PATH):
                self.models["hardware_features"] = joblib.load(HARDWARE_FEATURES_PATH)
            logger.info("Hardware assessment artifacts loaded successfully.")
            return {
                "model": self.models.get("hardware_model"),
                "features": self.models.get("hardware_features"),
            }
        except Exception as e:
            logger.error(f"Failed to load Hardware artifacts: {e}")
            return {"model": None, "features": None}

    def get_model(self, key: str):
        if key == "xray_model":
            return self.get_xray_model()
        if key == "questionnaire_model":
            return self.get_questionnaire_model()
        if key in ["gait_model", "gait_scaler", "gait_features"]:
            return self.get_gait_bundle().get(key.replace("gait_", ""))
        if key in ["hardware_model", "hardware_features"]:
            return self.get_hardware_bundle().get(key.replace("hardware_", ""))
        return self.models.get(key)

model_registry = ModelRegistry()