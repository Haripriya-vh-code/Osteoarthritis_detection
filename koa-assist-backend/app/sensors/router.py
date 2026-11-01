import os
import tempfile

from fastapi import APIRouter, UploadFile, File, HTTPException

from .service import predict_koa


router = APIRouter(
    prefix="/sensors",
    tags=["Sensors"]
)


@router.post("/analyze/{assessment_id}")
async def analyze_sensor_data(
    assessment_id: int,
    file: UploadFile = File(...)
):
    temp_path = None

    try:
        # ----------------------------------------------------
        # Validate file
        # ----------------------------------------------------

        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="No file was provided."
            )

        filename = file.filename.lower()

        if not filename.endswith(".csv"):
            raise HTTPException(
                status_code=400,
                detail="Please upload a CSV file."
            )

        # ----------------------------------------------------
        # Read uploaded file
        # ----------------------------------------------------

        contents = await file.read()

        if not contents:
            raise HTTPException(
                status_code=400,
                detail="The uploaded CSV file is empty."
            )

        # ----------------------------------------------------
        # Save temporarily
        # ----------------------------------------------------

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=".csv"
        ) as temp_file:

            temp_file.write(contents)
            temp_path = temp_file.name

        # ----------------------------------------------------
        # Run sensor ML model
        # ----------------------------------------------------

        result = predict_koa(temp_path)

        # ----------------------------------------------------
        # Add assessment information
        # ----------------------------------------------------

        result["assessment_id"] = assessment_id
        result["file_name"] = file.filename

        return result

    except HTTPException:
        raise

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception as e:

        print(
            "Sensor analysis error:",
            repr(e)
        )

        raise HTTPException(
            status_code=500,
            detail="Sensor analysis failed."
        )

    finally:

        # ----------------------------------------------------
        # Delete temporary file
        # ----------------------------------------------------

        if temp_path and os.path.exists(temp_path):

            try:
                os.remove(temp_path)

            except Exception:
                pass