# Osteoarthritis Detection

## What is this project about?

This project aims to support the initial assessment of osteoarthritis through a combination of questionnaires, video analysis, IMU sensor integration, and X-ray image analysis. It explores a cost-effective and accessible approach that could assist in preliminary screening, particularly in rural and resource-limited areas.

This system is **not a replacement for clinical diagnosis or medical imaging** and is intended only as an assistive tool for preliminary assessment.

## Team Members

**SSN College of Engineering**

1. Janani
2. Lathiga
3. Madeshwaran
4. Tharun
5. Vedhashri

## Usage and License

This project is developed solely for educational purposes. Reuse, redistribution, or reproduction of the project without prior permission from the project team is not permitted.

## Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Frontend Setup

Open a separate terminal:

```bash
cd frontend
npm install
npm run dev
```
