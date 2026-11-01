from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
import re

from app.database.connection import get_db
from app.database.models import Assessment, AssessmentRecord, Patient

router = APIRouter(
    prefix="/assessments",
    tags=["Assessments"]
)


# ============================================================
# SCHEMA
# ============================================================

class CreateAssessmentSchema(BaseModel):
    patient_id: Optional[str] = None


# ============================================================
# CREATE NEW ASSESSMENT
# ============================================================

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_assessment(
    payload: CreateAssessmentSchema = None,
    db: Session = Depends(get_db)
):
    try:
        if not payload or not payload.patient_id:
            raise HTTPException(
                status_code=400,
                detail="Patient ID is required."
            )

        # Extract numeric ID
        digits = re.findall(r"\d+", str(payload.patient_id))

        if not digits:
            raise HTTPException(
                status_code=400,
                detail="Invalid patient ID."
            )

        patient_id = int(digits[0])

        # Make sure patient exists
        patient = (
            db.query(Patient)
            .filter(Patient.id == patient_id)
            .first()
        )

        if not patient:
            raise HTTPException(
                status_code=404,
                detail=f"Patient {patient_id} not found."
            )

        # Create assessment session
        new_assessment = Assessment(
            patient_id=patient_id,
            status="In Progress"
        )

        db.add(new_assessment)
        db.commit()
        db.refresh(new_assessment)

        return {
            "status": "success",
            "assessment_id": new_assessment.id,
            "patient_id": new_assessment.patient_id,
            "patient_name": patient.name,
            "assessment_type": "KOA Assessment",
            "created_at": new_assessment.created_at,
        }

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()

        print(
            f"CRITICAL BACKEND ERROR: {str(e)}"
        )

        raise HTTPException(
            status_code=500,
            detail=f"Database error creating assessment: {str(e)}"
        )


# ============================================================
# GET ALL ASSESSMENTS
# ============================================================

@router.get("/")
def get_assessments(
    db: Session = Depends(get_db)
):
    try:
        assessments = (
            db.query(Assessment)
            .order_by(Assessment.created_at.desc())
            .all()
        )

        results = []

        for assessment in assessments:

            # Find patient
            patient = (
                db.query(Patient)
                .filter(
                    Patient.id == assessment.patient_id
                )
                .first()
            )

            # Default values
            patient_name = (
                patient.name
                if patient and patient.name
                else f"Patient #{assessment.patient_id}"
            )

            # ------------------------------------------------
            # Determine status
            # ------------------------------------------------

            current_status = assessment.status or "In Progress"

            # Check whether a completed AssessmentRecord
            # exists for this patient.
            completed_record = (
                db.query(AssessmentRecord)
                .filter(
                    AssessmentRecord.patient_id
                    == assessment.patient_id
                )
                .order_by(
                    AssessmentRecord.created_at.desc()
                )
                .first()
            )

            if completed_record:
                current_status = "Completed"

            # ------------------------------------------------
            # Format date
            # ------------------------------------------------

            formatted_date = (
                assessment.created_at.strftime("%b %d, %Y")
                if assessment.created_at
                else "Unknown Date"
            )

            results.append(
                {
                    "id": assessment.id,

                    # Frontend-compatible fields
                    "assessmentId": assessment.id,
                    "patientId": assessment.patient_id,
                    "patientName": patient_name,
                    "assessmentType": "KOA Assessment",
                    "status": current_status,
                    "date": formatted_date,

                    # Backend-style fields too
                    "assessment_id": assessment.id,
                    "patient_id": assessment.patient_id,
                    "patient_name": patient_name,
                    "assessment_type": "KOA Assessment",
                    "created_at": assessment.created_at,
                }
            )

        return results

    except Exception as e:

        print(
            f"ERROR FETCHING ASSESSMENTS: {str(e)}"
        )

        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch assessments: {str(e)}"
        )


# ============================================================
# GET ASSESSMENT HISTORY
# ============================================================

@router.get("/history")
def get_assessment_history(
    db: Session = Depends(get_db)
):
    try:

        assessments = (
            db.query(Assessment)
            .order_by(Assessment.created_at.desc())
            .all()
        )

        results = []

        for assessment in assessments:

            patient = (
                db.query(Patient)
                .filter(
                    Patient.id == assessment.patient_id
                )
                .first()
            )

            patient_name = (
                patient.name
                if patient and patient.name
                else f"Patient #{assessment.patient_id}"
            )

            # Find latest completed record
            completed_record = (
                db.query(AssessmentRecord)
                .filter(
                    AssessmentRecord.patient_id
                    == assessment.patient_id
                )
                .order_by(
                    AssessmentRecord.created_at.desc()
                )
                .first()
            )

            if completed_record:

                severity = (
                    completed_record.risk_category
                    if completed_record.risk_category
                    else None
                )

                current_status = "Completed"

            else:

                severity = None
                current_status = assessment.status or "In Progress"

            results.append(
                {
                    "id": assessment.id,

                    "assessment_id": assessment.id,
                    "patient_id": assessment.patient_id,
                    "patient_name": patient_name,

                    "created_at": assessment.created_at,

                    "status": current_status,
                    "severity": severity,

                    "assessment_type": "KOA Assessment",
                }
            )

        return results

    except Exception as e:

        print(
            f"ERROR FETCHING ASSESSMENT HISTORY: {str(e)}"
        )

        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch assessment history: {str(e)}"
        )