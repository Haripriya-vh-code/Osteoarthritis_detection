import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Activity,
  CheckCircle2,
  ChevronRight,
  ScanLine,
  SkipForward,
} from "lucide-react";

import { useLanguage } from "../hooks/useLanguage";

function AdditionalAssessment() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [xrayStatus, setXrayStatus] = useState(() => {
    const savedXray = localStorage.getItem(`koaXray_${patientId}`);
    return savedXray ? "provided" : "not_provided";
  });

  const [sensorStatus, setSensorStatus] = useState(() => {
    const savedSensors = localStorage.getItem(
      `koaSensors_${patientId}`
    );
    return savedSensors ? "provided" : "not_provided";
  });

  /* ---------------- X-RAY ---------------- */

  const handleXray = () => {
    navigate(`/assessment/${patientId}/xray`);
  };

  const skipXray = () => {
    localStorage.removeItem(`koaXray_${patientId}`);

    setXrayStatus("skipped");

    localStorage.setItem(
      `koaAdditional_${patientId}`,
      JSON.stringify({
        xray: "skipped",
        sensors: sensorStatus,
      })
    );
  };

  /* ---------------- SENSORS ---------------- */

  const handleSensor = () => {
    navigate(`/assessment/${patientId}/sensors`);
  };

  const skipSensor = () => {
    localStorage.removeItem(`koaSensors_${patientId}`);

    setSensorStatus("skipped");

    localStorage.setItem(
      `koaAdditional_${patientId}`,
      JSON.stringify({
        xray: xrayStatus,
        sensors: "skipped",
      })
    );
  };

  /* ---------------- CONTINUE ---------------- */

  const continueToAnalysis = () => {
    const finalXrayStatus =
      localStorage.getItem(`koaXray_${patientId}`)
        ? "provided"
        : xrayStatus;

    const finalSensorStatus =
      localStorage.getItem(`koaSensors_${patientId}`)
        ? "provided"
        : sensorStatus;

    localStorage.setItem(
      `koaAdditional_${patientId}`,
      JSON.stringify({
        xray: finalXrayStatus,
        sensors: finalSensorStatus,
        completedAt: new Date().toISOString(),
      })
    );

    navigate(`/assessment/${patientId}/analysis`);
  };

  return (
    <div className="additional-page">

      {/* TOP BAR */}

      <div className="additional-topbar">
        <button
          className="back-button"
          onClick={() =>
            navigate(`/assessment/${patientId}/gait`)
          }
        >
          <ArrowLeft size={17} />
          {t("additionalAssessment.actions.backToGait")}
        </button>

        <div className="additional-patient">
          {t("additionalAssessment.patientId")}:{" "}
          <strong>{patientId}</strong>
        </div>
      </div>

      {/* HEADER */}

      <div className="additional-header">
        <div className="additional-header-icon">
          <Activity size={31} />
        </div>

        <div>
          <div className="page-breadcrumb">
            {t("additionalAssessment.breadcrumb")}
          </div>

          <h1>
            {t("additionalAssessment.title")}
          </h1>

          <p>
            {t("additionalAssessment.description")}
          </p>
        </div>
      </div>

      {/* REQUIRED STATUS */}

      <div className="additional-info">
        <CheckCircle2 size={18} />

        <div>
          <strong>
            {t("additionalAssessment.required.title")}
          </strong>

          <p>
            {t("additionalAssessment.required.description")}
          </p>
        </div>
      </div>

      {/* OPTIONAL ASSESSMENTS */}

      <div className="additional-options">

        {/* X-RAY */}

        <div className="additional-card">

          <div className="additional-card-icon">
            <ScanLine size={24} />
          </div>

          <div className="additional-card-content">

            <div className="additional-card-heading">

              <div>
                <h2>
                  {t("additionalAssessment.xray.title")}
                </h2>

                <span className="optional-label">
                  {t("additionalAssessment.optional")}
                </span>
              </div>

              {xrayStatus === "provided" && (
                <span className="provided-status">
                  <CheckCircle2 size={14} />
                  {t("additionalAssessment.status.provided")}
                </span>
              )}

              {xrayStatus === "skipped" && (
                <span className="skipped-status">
                  {t("additionalAssessment.status.skipped")}
                </span>
              )}

            </div>

            <p>
              {t("additionalAssessment.xray.description")}
            </p>

            <div className="additional-card-actions">

              <button
                className="primary-action"
                onClick={handleXray}
              >
                <ScanLine size={17} />

                {xrayStatus === "provided"
                  ? t("additionalAssessment.xray.uploadAnother")
                  : t("additionalAssessment.xray.upload")}
              </button>

              <button
                className="skip-action"
                onClick={skipXray}
              >
                <SkipForward size={15} />

                {xrayStatus === "skipped"
                  ? t("additionalAssessment.actions.keepSkipped")
                  : t("additionalAssessment.actions.skip")}
              </button>

            </div>

          </div>
        </div>

        {/* SENSOR */}

        <div className="additional-card">

          <div className="additional-card-icon sensor">
            <Activity size={24} />
          </div>

          <div className="additional-card-content">

            <div className="additional-card-heading">

              <div>
                <h2>
                  {t("additionalAssessment.sensor.title")}
                </h2>

                <span className="optional-label">
                  {t("additionalAssessment.optional")}
                </span>
              </div>

              {sensorStatus === "provided" && (
                <span className="provided-status">
                  <CheckCircle2 size={14} />
                  {t("additionalAssessment.status.provided")}
                </span>
              )}

              {sensorStatus === "skipped" && (
                <span className="skipped-status">
                  {t("additionalAssessment.status.skipped")}
                </span>
              )}

            </div>

            <p>
              {t("additionalAssessment.sensor.description")}
            </p>

            <div className="additional-card-actions">

              <button
                className="primary-action"
                onClick={handleSensor}
              >
                <Activity size={17} />

                {sensorStatus === "provided"
                  ? t("additionalAssessment.sensor.recordAgain")
                  : t("additionalAssessment.sensor.record")}
              </button>

              <button
                className="skip-action"
                onClick={skipSensor}
              >
                <SkipForward size={15} />

                {sensorStatus === "skipped"
                  ? t("additionalAssessment.actions.keepSkipped")
                  : t("additionalAssessment.actions.skip")}
              </button>

            </div>

          </div>
        </div>

      </div>

      {/* CONTINUE */}

      <div className="additional-continue">

        <div>
          <strong>
            {t("additionalAssessment.continue.title")}
          </strong>

          <p>
            {t("additionalAssessment.continue.description")}
          </p>
        </div>

        <button
          className="primary-action continue-analysis"
          onClick={continueToAnalysis}
        >
          {t("additionalAssessment.continue.button")}
          <ChevronRight size={17} />
        </button>

      </div>

      {/* FOOTER */}

      <div className="additional-footer">
        <Activity size={15} />

        <span>
          {t("additionalAssessment.footer")}
        </span>
      </div>

    </div>
  );
}

export default AdditionalAssessment;