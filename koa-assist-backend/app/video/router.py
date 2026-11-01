import os
import shutil
import threading

from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File,
    HTTPException,
    status
)
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.config import settings
from app.video.schemas import VideoAnalysisResponse
from app.video.services import VideoGaitService


router = APIRouter(
    prefix="/video",
    tags=["Video Gait Analysis"]
)


# =========================================================
# GAIT ANALYSIS CACHE / LOCK
# =========================================================
#
# Prevents repeated expensive YOLO + RF processing for the
# same assessment while the backend is running.
#
# assessment_id -> completed result
#
# Once an assessment has been analyzed successfully,
# subsequent requests return the cached result instead of
# running the ML model again.
#
# =========================================================

gait_analysis_cache = {}

gait_analysis_locks = {}

gait_analysis_global_lock = threading.Lock()


# =========================================================
# UPLOAD VIDEO ONLY
# =========================================================

@router.post(
    "/upload/{assessment_id}"
)
async def upload_gait_video(
    assessment_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    os.makedirs(
        settings.UPLOAD_DIR,
        exist_ok=True
    )

    video_filename = (
        f"gait_{assessment_id}_{file.filename}"
    )

    file_path = os.path.join(
        settings.UPLOAD_DIR,
        video_filename
    )

    # -----------------------------------------------------
    # Save uploaded video
    # -----------------------------------------------------

    try:

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(
                file.file,
                buffer
            )

    except Exception as e:

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save video: {str(e)}"
        )

    finally:
        await file.close()

    # -----------------------------------------------------
    # Return immediately
    #
    # NO YOLO
    # NO FEATURE EXTRACTION
    # NO RANDOM FOREST
    # -----------------------------------------------------

    return {
        "assessment_id": assessment_id,
        "video_path": file_path,
        "status": "uploaded"
    }


# =========================================================
# REAL GAIT ANALYSIS
# =========================================================

@router.post(
    "/analyze/{assessment_id}",
    response_model=VideoAnalysisResponse
)
async def analyze_gait_video(
    assessment_id: int,
    db: Session = Depends(get_db)
):

    os.makedirs(
        settings.UPLOAD_DIR,
        exist_ok=True
    )

    # =====================================================
    # CHECK CACHE
    # =====================================================
    #
    # If this assessment has already been analyzed during
    # the current backend session, return the existing result.
    #
    # This prevents:
    #
    # React request #1 → YOLO
    # React request #2 → YOLO AGAIN
    # React request #3 → YOLO AGAIN
    #
    # Instead:
    #
    # Request #1 → YOLO
    # Request #2 → cached result
    # Request #3 → cached result
    #
    # =====================================================

    with gait_analysis_global_lock:

        cached_result = gait_analysis_cache.get(
            assessment_id
        )

        if cached_result is not None:

            print(
                f"Gait analysis cache hit for assessment "
                f"{assessment_id}"
            )

            return cached_result

        # -------------------------------------------------
        # Create a lock for this assessment if necessary
        # -------------------------------------------------

        if assessment_id not in gait_analysis_locks:

            gait_analysis_locks[
                assessment_id
            ] = threading.Lock()

        assessment_lock = gait_analysis_locks[
            assessment_id
        ]

    # =====================================================
    # LOCK THIS ASSESSMENT
    # =====================================================
    #
    # If two requests arrive almost simultaneously,
    # only one is allowed to execute the ML model.
    #
    # =====================================================

    with assessment_lock:

        # -------------------------------------------------
        # Check cache AGAIN after acquiring the lock.
        #
        # Another request may have finished the analysis
        # while this request was waiting for the lock.
        # -------------------------------------------------

        with gait_analysis_global_lock:

            cached_result = gait_analysis_cache.get(
                assessment_id
            )

            if cached_result is not None:

                print(
                    f"Gait analysis cache hit after lock "
                    f"for assessment {assessment_id}"
                )

                return cached_result

        # =================================================
        # FIND UPLOADED VIDEO
        # =================================================

        prefix = f"gait_{assessment_id}_"

        video_file = None

        for filename in os.listdir(
            settings.UPLOAD_DIR
        ):

            if filename.startswith(prefix):

                video_file = filename
                break

        if video_file is None:

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    "No uploaded gait video found "
                    "for this assessment."
                )
            )

        file_path = os.path.join(
            settings.UPLOAD_DIR,
            video_file
        )

        # =================================================
        # REAL YOLO + RF ANALYSIS
        # =================================================

        print(
            "========================================"
        )

        print(
            f"Starting REAL gait analysis "
            f"for assessment {assessment_id}"
        )

        print(
            f"Video: {file_path}"
        )

        print(
            "Running YOLO + feature extraction + RF..."
        )

        print(
            "========================================"
        )

        try:

            result = (
                VideoGaitService
                .process_video_and_predict(
                    file_path
                )
            )

        except FileNotFoundError as e:

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=str(e)
            )

        except ValueError as e:

            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(e)
            )

        except Exception as e:

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=(
                    f"Gait analysis failed: {str(e)}"
                )
            )

        # =================================================
        # BUILD FINAL RESPONSE
        # =================================================

        response = {
            "assessment_id": assessment_id,
            "video_path": file_path,
            **result
        }

        # =================================================
        # SAVE RESULT IN CACHE
        # =================================================

        with gait_analysis_global_lock:

            gait_analysis_cache[
                assessment_id
            ] = response

        print(
            "========================================"
        )

        print(
            f"Gait analysis completed for "
            f"assessment {assessment_id}"
        )

        print(
            f"Prediction: "
            f"{result.get('prediction')}"
        )

        print(
            f"Confidence: "
            f"{result.get('confidence')}"
        )

        print(
            "Result cached successfully."
        )

        print(
            "========================================"
        )

        return response