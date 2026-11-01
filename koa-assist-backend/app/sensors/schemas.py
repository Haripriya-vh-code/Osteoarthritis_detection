from pydantic import BaseModel
from typing import Dict, Any, Optional

class GaitCSVResponse(BaseModel):
    patient_id: int
    sensor_risk_score: float
    risk_category: str
    extracted_metrics: Dict[str, Any]
    filename: str