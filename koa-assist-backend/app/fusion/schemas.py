from pydantic import BaseModel
from typing import Optional


class FusionRequest(BaseModel):

    xray_score: Optional[float] = None
    video_score: Optional[float] = None
    sensor_score: Optional[float] = None
    questionnaire_score: Optional[float] = None
    xray_confidence: Optional[float] = None
    video_confidence: Optional[float] = None
    sensor_confidence: Optional[float] = None
    questionnaire_confidence: Optional[float] = None

class FusionResponse(BaseModel):

    overall_koa_score: float
    severity: str
    confidence: float
    modalities_used: int
    recommendation: str