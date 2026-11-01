import os

files = [
    "app/__init__.py",
    "app/main.py",
    "app/config.py",
    "app/auth/__init__.py",
    "app/auth/router.py",
    "app/auth/schemas.py",
    "app/auth/services.py",
    "app/auth/dependencies.py",
    "app/database/__init__.py",
    "app/database/connection.py",
    "app/database/models.py",
    "app/xray/__init__.py",
    "app/xray/router.py",
    "app/xray/schemas.py",
    "app/xray/services.py",
    "app/video/__init__.py",
    "app/video/router.py",
    "app/video/schemas.py",
    "app/video/services.py",
    "app/sensor/__init__.py",
    "app/sensor/router.py",
    "app/sensor/schemas.py",
    "app/sensor/services.py",
    "app/sensor/buffer.py",
    "app/questionnaire/__init__.py",
    "app/questionnaire/router.py",
    "app/questionnaire/schemas.py",
    "app/questionnaire/services.py",
    "app/fusion/__init__.py",
    "app/fusion/router.py",
    "app/fusion/schemas.py",
    "app/fusion/engine.py",
    "app/multilingual/__init__.py",
    "app/multilingual/translator.py",
    "app/multilingual/locales/en.json",
    "app/multilingual/locales/hi.json",
    "app/reports/__init__.py",
    "app/reports/router.py",
    "app/reports/generator.py",
    "app/ml_core/__init__.py",
    "app/ml_core/model_loader.py"
]

folders = ["models_store", "uploads"]

for folder in folders:
    os.makedirs(folder, exist_ok=True)

for file_path in files:
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    if not os.path.exists(file_path):
        with open(file_path, "w") as f:
            pass

print("✓ All subfolders and files created successfully!")