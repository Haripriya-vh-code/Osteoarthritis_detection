from fastapi import APIRouter
from httpx import request

from app.fusion.schemas import (
    FusionRequest,
    FusionResponse
)

from app.fusion.engine import fuse_scores

router = APIRouter(
    prefix="/fusion",
    tags=["Fusion"]
)


@router.post(
    "/analyze",
    response_model=FusionResponse
)
async def analyze_fusion(
    request: FusionRequest
):

    result = fuse_scores(
            xray_score=request.xray_score,
            video_score=request.video_score,
            sensor_score=request.sensor_score,
            questionnaire_score=request.questionnaire_score,

            xray_conf=request.xray_confidence,
            video_conf=request.video_confidence,
            sensor_conf=request.sensor_confidence,
            questionnaire_conf=request.questionnaire_confidence
    )

    return result