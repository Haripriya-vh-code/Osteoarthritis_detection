from pydantic import BaseModel
from typing import Optional, List

class PatientDashboardRow(BaseModel):
    id: str
    name: str
    age: Optional[int] = None
    assessment: str
    risk: str
    date: str

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    totalPatients: int
    assessmentsPending: int
    needAttention: int
    completed: int