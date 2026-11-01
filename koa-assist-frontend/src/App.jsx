import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

import Patients from "./pages/Patients";
import PatientProfile from "./pages/PatientProfile";

import NewAssessment from "./pages/NewAssessment";
import Questionnaire from "./pages/Questionnaire";
import VideoAnalysis from "./pages/VideoAnalysis";
import XrayAnalysis from "./pages/XrayAnalysis";
import SensorAnalysis from "./pages/SensorAnalysis";
import AdditionalAssessment from "./pages/AdditionalAssessment";

import Analysis from "./pages/Analysis";
import Results from "./pages/Results";
import Report from "./pages/Report";

import Assessments from "./pages/Assessments";
import History from "./pages/History";
import Reports from "./pages/Reports";

function App() {
  return (
    <Routes>
      {/* AUTH */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      {/* MAIN */}
      <Route path="/dashboard" element={<Dashboard />} />

      {/* PATIENTS */}
      <Route path="/patients" element={<Patients />} />
      <Route path="/patients/:patientId" element={<PatientProfile />} />

      {/* ASSESSMENT FLOW */}
      <Route path="/assessment/new/:patientId" element={<NewAssessment />} />
      <Route path="/assessment/:patientId/questionnaire" element={<Questionnaire />} />

      {/* GAIT / VIDEO ROUTE ALIASES (Supports both /gait and /video paths) */}
      <Route path="/assessment/:patientId/gait" element={<VideoAnalysis />} />
      <Route path="/assessment/:patientId/video" element={<VideoAnalysis />} />

      <Route path="/assessment/:patientId/additional" element={<AdditionalAssessment />} />
      <Route path="/assessment/:patientId/xray" element={<XrayAnalysis />} />
      <Route path="/assessment/:patientId/sensors" element={<SensorAnalysis />} />

      {/* RESULTS & REPORTS */}
      <Route path="/assessment/:patientId/analysis" element={<Analysis />} />
      <Route path="/assessment/:patientId/results" element={<Results />} />
      <Route path="/assessment/:patientId/report" element={<Report />} />

      {/* MANAGEMENT & HISTORY */}
      <Route path="/assessment" element={<Assessments />} />
      <Route path="/history" element={<History />} />
      <Route path="/reports" element={<Reports />} />

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;