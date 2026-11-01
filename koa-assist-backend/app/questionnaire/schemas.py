from typing import Dict, Any, Union
from pydantic import BaseModel, Field

class KneeSubScale(BaseModel):
    p1_flat_walking: int = 0
    p2_stairs: int = 0
    p3_night_bed: int = 0
    p4_sitting_lying: int = 0
    p5_standing: int = 0
    s1_morning_stiffness: int = 0
    s2_rest_stiffness: int = 0

class PhysicalDifficulty(BaseModel):
    d1_stairs: int = 0
    d2_rising_seated: int = 0
    d3_bending_floor: int = 0
    d4_vehicle: int = 0
    d5_heavy_work: int = 0

class QuestionnaireInput(BaseModel):
    patient_id: Union[str, int]  # Compatible with Python <3.10
    sex: int = 0
    age: int = 0
    right_knee: KneeSubScale = Field(default_factory=KneeSubScale)
    left_knee: KneeSubScale = Field(default_factory=KneeSubScale)
    physical_function: PhysicalDifficulty = Field(default_factory=PhysicalDifficulty)

class QuestionnaireResponse(BaseModel):
    patient_id: Union[str, int]  # Compatible with Python <3.10
    oa_risk_score: float
    risk_category: str
    mapped_features: Dict[str, Any]