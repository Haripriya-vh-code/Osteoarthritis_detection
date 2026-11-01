from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import Patient

router = APIRouter()


class PatientCreate(BaseModel):
    name: str
    age: int
    gender: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None


class PatientSchema(BaseModel):
    id: int
    name: Optional[str] = None
    age: Optional[int] = None
    sex: Optional[int] = None
    phone: Optional[str] = None
    email: Optional[str] = None

    class Config:
        from_attributes = True


# --------------------------------------------------
# GET ALL PATIENTS
# --------------------------------------------------

@router.get("", response_model=List[PatientSchema])
@router.get("/", response_model=List[PatientSchema])
async def get_patients(db: Session = Depends(get_db)):
    patients = db.query(Patient).all()
    return patients if patients else []


# --------------------------------------------------
# GET ONE PATIENT
# --------------------------------------------------

@router.get("/{patient_id}", response_model=PatientSchema)
async def get_patient(
    patient_id: int,
    db: Session = Depends(get_db)
):
    patient = (
        db.query(Patient)
        .filter(Patient.id == patient_id)
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )

    return patient

# --------------------------------------------------
# DELETE PATIENT
# --------------------------------------------------

@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db)
):
    patient = (
        db.query(Patient)
        .filter(Patient.id == patient_id)
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )

    db.delete(patient)
    db.commit()

    return None
# --------------------------------------------------
# CREATE PATIENT
# --------------------------------------------------

@router.post(
    "",
    response_model=PatientSchema,
    status_code=status.HTTP_201_CREATED
)
@router.post(
    "/",
    response_model=PatientSchema,
    status_code=status.HTTP_201_CREATED
)
async def create_patient(
    patient: PatientCreate,
    db: Session = Depends(get_db)
):
    # Convert frontend gender string to database integer
    # 0 = Male
    # 1 = Female

    gender_str = str(patient.gender).strip().lower()

    sex_int = (
        1
        if gender_str in ["female", "f", "1"]
        else 0
    )

    # Store ALL patient information
    patient_db_data = {
        "name": patient.name,
        "age": patient.age,
        "sex": sex_int,
        "phone": patient.phone,
        "email": str(patient.email) if patient.email else None,
    }

    new_patient = Patient(**patient_db_data)

    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    return new_patient