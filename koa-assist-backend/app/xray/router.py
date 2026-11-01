import re
from fastapi import APIRouter, UploadFile, File, Path, HTTPException, status
from app.xray.schemas import XRayAnalysisResponse
from app.xray.services import xray_service

router = APIRouter(prefix="/xray", tags=["X-Ray Analysis"])

@router.post("/analyze/{assessment_id}", response_model=XRayAnalysisResponse)
async def analyze_xray(
    assessment_id: str = Path(..., title="Assessment ID"),
    file: UploadFile = File(...)
):
    """
    Upload a knee X-ray image to detect Kellgren-Lawrence (KL) grade and OA risk.
    """
    try:
        # Strip non-digit chars from path variable if string like "LOCAL-178853"
        clean_digits = re.findall(r'\d+', str(assessment_id))
        parsed_id = int(clean_digits[0][:9]) if clean_digits else 1

        saved_path = await xray_service.save_xray_file(file, parsed_id)
        results = xray_service.process_xray(saved_path, parsed_id)
        return results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"X-Ray analysis failed: {str(e)}"
        )