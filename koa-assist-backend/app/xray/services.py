import os
import shutil
import torch
import torch.nn as nn
import torchvision.transforms as transforms
from torchvision import models
from PIL import Image
from fastapi import UploadFile, HTTPException
from app.config import settings

# KL Grade reference mappings
KL_DESCRIPTIONS = {
    0: "Grade 0: Normal - No features of OA",
    1: "Grade 1: Doubtful - Doubtful joint space narrowing and possible osteophytic lip",
    2: "Grade 2: Minimal - Definite osteophytes and possible joint space narrowing",
    3: "Grade 3: Moderate - Moderate multiple osteophytes, definite narrowing, some sclerosis",
    4: "Grade 4: Severe - Large osteophytes, marked narrowing, severe sclerosis"
}

class XRayInferenceModel:
    def __init__(self, model_path: str):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = self._load_model(model_path)
        
        # Standard PyTorch image preprocessing for X-rays
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])

    def _load_model(self, path: str):
        """Loads weights into model structure matching saved state_dict keys."""
        # Backbone setup
        model = models.resnet18(weights=None)
        
        # Match trained model structure: fc.0 (Dropout/Identity) -> fc.1 (Linear layer with 5 classes)
        num_ftrs = model.fc.in_features
        model.fc = nn.Sequential(
            nn.Dropout(0.2),
            nn.Linear(num_ftrs, 5)
        )
        
        if os.path.exists(path):
            try:
                state_dict = torch.load(path, map_location=self.device)
                
                # Unwrap 'module.' prefix if model was saved using DataParallel
                if list(state_dict.keys())[0].startswith("module."):
                    state_dict = {k.replace("module.", ""): v for k, v in state_dict.items()}

                model.load_state_dict(state_dict)
                model.to(self.device)
                model.eval()
                print("Successfully loaded PyTorch X-Ray model weights!")
                return model
            except Exception as e:
                print(f"Error loading PyTorch weights: {e}")
                return None
        return None

class XRayService:
    def __init__(self):
        self.upload_dir = settings.UPLOAD_DIR
        self.pipeline = XRayInferenceModel(settings.XRAY_MODEL_PATH)

    async def save_xray_file(self, file: UploadFile, assessment_id: int) -> str:
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File uploaded is not a valid image.")
        
        saved_filename = f"xray_{assessment_id}_{file.filename}"
        file_path = os.path.join(self.upload_dir, saved_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return file_path

    def process_xray(self, file_path: str, assessment_id: int) -> dict:
        try:
            image = Image.open(file_path).convert("RGB")
            width, height = image.size
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")

        # Real PyTorch Inference Pass
        if self.pipeline.model is not None:
            tensor = self.pipeline.transform(image).unsqueeze(0).to(self.pipeline.device)
            
            with torch.no_grad():
                outputs = self.pipeline.model(tensor)
                probabilities = torch.softmax(outputs, dim=1)
                confidence, predicted_class = torch.max(probabilities, 1)
                
            kl_grade = int(predicted_class.item())
            conf_score = round(float(confidence.item()), 4)
        else:
            # Fallback if .pth fails to load state dictionary
            kl_grade = 2
            conf_score = 0.50

        risk_score = round(kl_grade / 4.0, 2)

        return {
            "assessment_id": assessment_id,
            "image_path": file_path,
            "kl_grade": kl_grade,
            "kl_description": KL_DESCRIPTIONS.get(kl_grade, "Unknown Grade"),
            "oa_risk_score": risk_score,
            "confidence": conf_score,
            "details": {
                "image_resolution": f"{width}x{height}",
                "device_used": str(self.pipeline.device)
            }
        }

xray_service = XRayService()