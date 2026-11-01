from pydantic import BaseModel
from typing import Optional, Dict

class VideoAnalysisResponse(BaseModel):
    assessment_id: int
    video_path: str
    prediction: str
    oa_risk_score: float
    confidence: float
    biomechanical_features: Dict[str, Optional[float]]