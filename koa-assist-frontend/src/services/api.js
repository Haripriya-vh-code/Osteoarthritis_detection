const API_BASE_URL = "http://localhost:8001";

// =========================================================
// CREATE ASSESSMENT
// =========================================================

export async function createAssessment(patientId) {
  if (!patientId) {
    throw new Error("Patient ID is required to create an assessment.");
  }

  const cleanStr = String(patientId)
    .replace(/^:/, "")
    .replace("LOCAL-", "");

  const numericId = parseInt(cleanStr, 10);

  const response = await fetch(
    `${API_BASE_URL}/api/v1/assessments/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        patient_id: String(
          isNaN(numericId) ? cleanStr : numericId
        ),
      }),
    }
  );

  if (!response.ok) {
    const errorData =
      await response.json().catch(() => null);

    throw new Error(
      errorData?.detail ||
        `Failed to create assessment on server: ${response.status}`
    );
  }

  return await response.json();
}


// =========================================================
// UPLOAD GAIT VIDEO ONLY
// NO YOLO
// NO FEATURE EXTRACTION
// NO RANDOM FOREST
// =========================================================

export const uploadGaitVideo = async (
  assessmentId,
  videoFile
) => {
  if (!assessmentId) {
    throw new Error(
      "Assessment ID is required to upload the gait video."
    );
  }

  if (!videoFile) {
    throw new Error("Gait video file is required.");
  }

  const cleanAssessmentId = String(assessmentId)
    .replace(/^:/, "")
    .replace("LOCAL-", "");

  const formData = new FormData();

  formData.append("file", videoFile);

  const response = await fetch(
    `${API_BASE_URL}/api/v1/video/upload/${cleanAssessmentId}`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData =
      await response.json().catch(() => null);

    throw new Error(
      errorData?.detail ||
        `Server responded with status: ${response.status}`
    );
  }

  return await response.json();
};


// =========================================================
// REAL GAIT ANALYSIS
// YOLO + FEATURE EXTRACTION + RANDOM FOREST
//
// THIS MUST ONLY BE CALLED FROM Analysis.jsx
// =========================================================

export const analyzeGaitVideo = async (assessmentId) => {
  if (!assessmentId) {
    throw new Error(
      "Assessment ID is required for gait analysis."
    );
  }

  const cleanAssessmentId = String(assessmentId)
    .replace(/^:/, "")
    .replace("LOCAL-", "");

  const response = await fetch(
    `${API_BASE_URL}/api/v1/video/analyze/${cleanAssessmentId}`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    const errorData =
      await response.json().catch(() => null);

    throw new Error(
      errorData?.detail ||
        `Server responded with status: ${response.status}`
    );
  }

  return await response.json();
};


// =========================================================
// X-RAY ANALYSIS
// =========================================================

export const analyzeXray = async (
  assessmentId,
  xrayFile
) => {
  if (!assessmentId) {
    throw new Error(
      "Assessment ID is required for X-Ray analysis."
    );
  }

  if (!xrayFile) {
    throw new Error("X-Ray file is required.");
  }

  const cleanId = String(assessmentId)
    .replace(/^:/, "")
    .replace("LOCAL-", "");

  const numericId = parseInt(cleanId, 10) || 1;

  const formData = new FormData();

  formData.append("file", xrayFile);

  const response = await fetch(
    `${API_BASE_URL}/api/v1/xray/analyze/${numericId}`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData =
      await response.json().catch(() => null);

    throw new Error(
      errorData?.detail ||
        `Server responded with status: ${response.status}`
    );
  }

  return await response.json();
};


// =========================================================
// DEFAULT API OBJECT
// =========================================================

const api = {
  createAssessment,
  uploadGaitVideo,
  analyzeGaitVideo,
  analyzeXray,
};

export default api;

