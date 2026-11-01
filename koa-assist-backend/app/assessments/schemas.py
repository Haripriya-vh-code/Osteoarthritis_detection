from pydantic import BaseModel
from typing import Optional

class AssessmentResponse(BaseModel):
    id: int
    patientName: str
    patientId: str
    assessmentType: str
    status: str  # Options: "In Progress", "Processing", "Completed"
    date: str

    class Config:
        from_attributes = True