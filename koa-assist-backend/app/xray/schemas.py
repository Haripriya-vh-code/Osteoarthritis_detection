from pydantic import BaseModel
from typing import Dict, Any, Optional

class XRayAnalysisResponse(BaseModel):
    assessment_id: int
    image_path: str
    kl_grade: int
    kl_description: str
    oa_risk_score: float
    confidence: float
    details: Optional[Dict[str, Any]] = None