import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.connection import engine, Base
import app.database.models

# Routers
from app.auth.router import router as auth_router
from app.fusion.router import router as fusion_router
from app.patients.router import router as patients_router  
from app.assessments.router import router as assessments_router
from app.xray.router import router as xray_router
from app.questionnaire.router import router as questionnaire_router
from app.video.router import router as video_router
from app.sensors.router import router as sensors_router
from app.dashboard.router import router as dashboard_router  # 1. Imported Dashboard Router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("koa_assist")

app = FastAPI(title="KOA Assist API - Full Integration")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)
prefix = "/api/v1"

# Register Routers
app.include_router(auth_router, prefix=prefix)
app.include_router(patients_router, prefix="/api/v1/patients", tags=["patients"])
app.include_router(assessments_router, prefix=prefix)
app.include_router(xray_router, prefix=prefix)
app.include_router(questionnaire_router, prefix=prefix)
app.include_router(video_router, prefix=prefix)
app.include_router(fusion_router)
app.include_router(
    sensors_router,
    prefix="/api/v1"
)

app.include_router(dashboard_router, prefix=prefix)  # 2. Registered Dashboard Router

@app.get("/")
def root():
    return {"status": "online", "message": "All KOA-Assist routers and ML models are fully operational!"}

@app.get("/health")
def health():
    return {"status": "healthy"}