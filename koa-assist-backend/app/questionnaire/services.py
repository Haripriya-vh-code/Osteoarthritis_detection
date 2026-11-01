import os
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))
MODEL_PATH = os.path.join(PROJECT_ROOT, "models_store", "questionnaire_model.pkl")

class QuestionnaireService:
    def __init__(self):
        """
        Loads questionnaire_model.pkl from models_store.
        """
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"Model file not found at: {MODEL_PATH}\n"
                f"Please ensure 'questionnaire_model.pkl' exists in 'models_store/'."
            )
        
        self.model = joblib.load(MODEL_PATH)

    def _extract_features(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates raw WOMAC sums and extracts raw dictionary features.
        """
        data = payload.dict() if hasattr(payload, "dict") else payload

        right_k = data.get("right_knee", {})
        left_k = data.get("left_knee", {})
        phys_fn = data.get("physical_function", {})

        womac_pain_right = sum([
            right_k.get("p1_flat_walking", 0),
            right_k.get("p2_stairs", 0),
            right_k.get("p3_night_bed", 0),
            right_k.get("p4_sitting_lying", 0),
            right_k.get("p5_standing", 0)
        ])

        womac_stiffness_right = sum([
            right_k.get("s1_morning_stiffness", 0),
            right_k.get("s2_rest_stiffness", 0)
        ])

        womac_pain_left = sum([
            left_k.get("p1_flat_walking", 0),
            left_k.get("p2_stairs", 0),
            left_k.get("p3_night_bed", 0),
            left_k.get("p4_sitting_lying", 0),
            left_k.get("p5_standing", 0)
        ])

        womac_stiffness_left = sum([
            left_k.get("s1_morning_stiffness", 0),
            left_k.get("s2_rest_stiffness", 0)
        ])

        womac_disability = sum([
            phys_fn.get("d1_stairs", 0),
            phys_fn.get("d2_rising_seated", 0),
            phys_fn.get("d3_bending_floor", 0),
            phys_fn.get("d4_vehicle", 0),
            phys_fn.get("d5_heavy_work", 0)
        ])

        return {
            "sex": data.get("sex", 0),
            "interview_age": data.get("age", 0),
            "womac_pain_right": womac_pain_right,
            "womac_stiffness_right": womac_stiffness_right,
            "womac_disability_right": womac_disability,
            "womac_pain_left": womac_pain_left,
            "womac_stiffness_left": womac_stiffness_left,
            "womac_disability_left": womac_disability
        }

    def _prepare_dataframe(self, feature_dict: Dict[str, Any]) -> pd.DataFrame:
        """
        Converts feature dict to DataFrame aligned with model fit order.
        """
        df = pd.DataFrame([feature_dict])

        if hasattr(self.model, "feature_names_in_"):
            expected_features = list(self.model.feature_names_in_)
            for col in expected_features:
                if col not in df.columns:
                    df[col] = 0
            df = df[expected_features]

        return df

    def process_questionnaire(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Runs ML prediction and builds schema-compliant response dict.
        """
        feature_dict = self._extract_features(payload)
        df_features = self._prepare_dataframe(feature_dict)

        # 1. Prediction (Risk Category)
        raw_pred = self.model.predict(df_features)[0]
        risk_category = str(raw_pred.item() if isinstance(raw_pred, (np.generic, np.ndarray)) else raw_pred)

        # 2. Probability Scores (Risk Score)
        confidence = None
        oa_risk_score = 0.0

        if hasattr(self.model, "predict_proba"):
            probs = self.model.predict_proba(df_features)[0]
            confidence = probs.tolist()
            # Takes maximum probability score as probability metric
            oa_risk_score = float(np.max(probs))

        patient_id = payload.patient_id if hasattr(payload, "patient_id") else payload.get("patient_id")

        # Returns fields expected by Pydantic response schema
        return {
            "patient_id": patient_id,
            "prediction": risk_category,
            "risk_category": risk_category,
            "oa_risk_score": oa_risk_score,
            "confidence_scores": confidence,
            "mapped_features": feature_dict,
            "status": "success"
        }

    def predict(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        return self.process_questionnaire(payload)


questionnaire_service = QuestionnaireService()
