import enum
from sqlalchemy import Column, Integer, Float, String, DateTime, JSON, Text, Boolean, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base

class RoleEnum(str, enum.Enum):
    ADMIN = "admin"
    CLINICIAN = "clinician"
    PATIENT = "patient"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(Enum(RoleEnum), default=RoleEnum.PATIENT, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    sex = Column(Integer, nullable=True)  # 0: Male, 1: Female
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Assessment(Base):
    __tablename__ = "assessment_sessions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, index=True, nullable=False)
    status = Column(String, default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SensorSession(Base):
    __tablename__ = "sensor_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_uid = Column(String, unique=True, index=True, nullable=False)
    assessment_id = Column(Integer, ForeignKey("assessment_sessions.id"), nullable=True)
    raw_data = Column(JSON, nullable=True)
    metrics = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class VideoPrediction(Base):
    __tablename__ = "video_predictions"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessment_sessions.id"), nullable=True)
    video_path = Column(String, nullable=True)
    risk_score = Column(Float, nullable=True)
    features_extracted = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AssessmentRecord(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, index=True, nullable=False)
    
    # Individual Modality Results
    xray_kl_grade = Column(Integer, nullable=True)
    xray_confidence = Column(Float, nullable=True)
    xray_risk_score = Column(Float, nullable=True)
    
    questionnaire_risk_score = Column(Float, nullable=True)
    questionnaire_features = Column(JSON, nullable=True)
    
    sensor_risk_score = Column(Float, nullable=True)
    video_risk_score = Column(Float, nullable=True)

    # Multi-Modal Output
    overall_oa_risk_score = Column(Float, nullable=True)
    risk_category = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())