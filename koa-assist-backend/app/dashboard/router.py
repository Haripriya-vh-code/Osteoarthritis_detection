from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.database.models import Patient, Assessment, AssessmentRecord, User
from app.auth.dependencies import get_current_user
from app.dashboard.schemas import PatientDashboardRow, DashboardStats

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # ---------------------------------------------------------
    # TOTAL PATIENTS
    # ---------------------------------------------------------
    total_patients = db.query(Patient).count()

    # ---------------------------------------------------------
    # TOTAL ASSESSMENT SESSIONS
    # This is what NewAssessment.jsx creates.
    # ---------------------------------------------------------
    total_assessments = db.query(Assessment).count()

    # ---------------------------------------------------------
    # COMPLETED ASSESSMENTS
    # AssessmentRecord represents the final/processed result.
    # ---------------------------------------------------------
    completed_assessments = db.query(AssessmentRecord).count()

    # ---------------------------------------------------------
    # PENDING ASSESSMENTS
    # Sessions which do not yet have a final AssessmentRecord.
    # ---------------------------------------------------------
    pending_assessments = max(
        0,
        total_assessments - completed_assessments
    )

    # ---------------------------------------------------------
    # NEED ATTENTION
    # Final assessments classified as High risk.
    # ---------------------------------------------------------
    need_attention = (
        db.query(AssessmentRecord)
        .filter(AssessmentRecord.risk_category == "High")
        .count()
    )

    # ---------------------------------------------------------
    # COMPLETED %
    # Dashboard currently displays this as a percentage.
    # ---------------------------------------------------------
    if total_assessments > 0:
        completed_percentage = round(
            (completed_assessments / total_assessments) * 100
        )
    else:
        completed_percentage = 0

    return DashboardStats(
        totalPatients=total_patients,
        assessmentsPending=pending_assessments,
        needAttention=need_attention,
        completed=completed_percentage
    )


@router.get(
    "/patients",
    response_model=List[PatientDashboardRow]
)
def get_dashboard_patients(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # ---------------------------------------------------------
    # Get patients and their latest assessment session.
    # ---------------------------------------------------------
    patients = (
        db.query(Patient)
        .order_by(Patient.created_at.desc())
        .limit(limit)
        .all()
    )

    formatted_patients = []

    for patient in patients:

        # -----------------------------------------------------
        # Find latest assessment session for this patient
        # -----------------------------------------------------
        assessment = (
            db.query(Assessment)
            .filter(Assessment.patient_id == patient.id)
            .order_by(Assessment.created_at.desc())
            .first()
        )

        # -----------------------------------------------------
        # Find final AI result associated with this patient.
        #
        # AssessmentRecord currently contains patient_id,
        # so we use the latest record for that patient.
        # -----------------------------------------------------
        record = (
            db.query(AssessmentRecord)
            .filter(AssessmentRecord.patient_id == patient.id)
            .order_by(AssessmentRecord.created_at.desc())
            .first()
        )

        # -----------------------------------------------------
        # Determine assessment type
        # -----------------------------------------------------
        modalities = []

        if record:

            if record.xray_kl_grade is not None:
                modalities.append("X-Ray")

            if record.questionnaire_risk_score is not None:
                modalities.append("Questionnaire")

            if record.sensor_risk_score is not None:
                modalities.append("Sensor")

            if record.video_risk_score is not None:
                modalities.append("Gait Video")

        if modalities:
            assessment_type = " + ".join(modalities)
        elif assessment:
            assessment_type = "Assessment Pending"
        else:
            assessment_type = "Pending"

        # -----------------------------------------------------
        # Risk
        # -----------------------------------------------------
        if record and record.risk_category:
            risk = record.risk_category
        else:
            risk = "Pending"

        # -----------------------------------------------------
        # Date
        # -----------------------------------------------------
        if assessment and assessment.created_at:
            record_date = assessment.created_at.strftime(
                "%b %d, %Y"
            )
        elif patient.created_at:
            record_date = patient.created_at.strftime(
                "%b %d, %Y"
            )
        else:
            record_date = "N/A"

        # -----------------------------------------------------
        # Dashboard row
        # -----------------------------------------------------
        formatted_patients.append(
            PatientDashboardRow(
                id=f"KOA-{patient.id:04d}",
                name=patient.name or "Unknown Patient",
                age=patient.age,
                assessment=assessment_type,
                risk=risk,
                date=record_date
            )
        )

    return formatted_patients