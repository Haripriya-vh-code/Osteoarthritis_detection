from fastapi import APIRouter
from app.questionnaire.schemas import QuestionnaireInput, QuestionnaireResponse
from app.questionnaire.services import questionnaire_service

router = APIRouter(prefix="/questionnaire", tags=["Questionnaire Analysis"])

@router.post("/analyze", response_model=QuestionnaireResponse)
def evaluate_questionnaire(payload: QuestionnaireInput):
    return questionnaire_service.process_questionnaire(payload)