import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardList,
  Video,
  CheckCircle2,
  Loader2,
} from "lucide-react";

import { useLanguage } from "../hooks/useLanguage";
import { createAssessment } from "../services/api";

function NewAssessment() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  // =========================================================
  // CREATE NEW ASSESSMENT
  // =========================================================

  const handleStartAssessment = async () => {
    setLoading(true);

    try {
      // Patient ID remains the patient ID.
      const res = await createAssessment(patientId);

      // This is the REAL database assessment ID.
      const realAssessmentId = res.assessment_id;

      if (!realAssessmentId) {
        throw new Error(
          "Backend did not return a valid assessment ID."
        );
      }

      console.log("================================");
      console.log("NEW ASSESSMENT CREATED");
      console.log("Patient ID:", patientId);
      console.log("Assessment ID:", realAssessmentId);
      console.log("================================");

      // -------------------------------------------------------
      // IMPORTANT:
      // Store assessment ID separately from patient ID.
      // -------------------------------------------------------

      localStorage.setItem(
        `koaAssessment_${patientId}`,
        JSON.stringify({
          patientId: patientId,
          assessmentId: realAssessmentId,
          createdAt: new Date().toISOString(),
        })
      );

      // -------------------------------------------------------
      // IMPORTANT:
      // Continue using PATIENT ID in the URL.
      //
      // DO NOT navigate using realAssessmentId here.
      // -------------------------------------------------------

      navigate(
        `/assessment/${patientId}/questionnaire`
      );

    } catch (error) {
      console.error(
        "Failed to create assessment session:",
        error
      );

      alert(
        error?.message ||
          "Failed to initialize assessment on the backend server. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="patients-page">

      <button
        className="back-button"
        onClick={() =>
          navigate(`/patients/${patientId}`)
        }
      >
        <ArrowLeft size={17} />
        {t("newAssessment.actions.back")}
      </button>

      <div className="assessment-start-page">

        <div className="assessment-icon">
          <ClipboardList size={34} />
        </div>

        <div className="page-breadcrumb">
          KOA Assist / {t("navigation.assessment")} /{" "}
          {t("newAssessment.breadcrumb")}
        </div>

        <h1>
          {t("newAssessment.title")}
        </h1>

        <p>
          {t("newAssessment.description")}
        </p>

        <div className="mandatory-assessment-card">

          <div className="mandatory-assessment-header">

            <div className="mandatory-assessment-icon">
              <CheckCircle2 size={21} />
            </div>

            <div>
              <h2>
                {t("newAssessment.required.title")}
              </h2>

              <p>
                {t(
                  "newAssessment.required.description"
                )}
              </p>
            </div>

          </div>

          <div className="mandatory-assessment-steps">

            <div className="mandatory-step">

              <div className="mandatory-step-number">
                1
              </div>

              <div className="mandatory-step-icon">
                <ClipboardList size={20} />
              </div>

              <div className="mandatory-step-content">

                <h3>
                  {t(
                    "newAssessment.steps.questionnaire.title"
                  )}
                </h3>

                <p>
                  {t(
                    "newAssessment.steps.questionnaire.description"
                  )}
                </p>

              </div>

            </div>

            <div className="mandatory-step-line" />

            <div className="mandatory-step">

              <div className="mandatory-step-number">
                2
              </div>

              <div className="mandatory-step-icon">
                <Video size={20} />
              </div>

              <div className="mandatory-step-content">

                <h3>
                  {t(
                    "newAssessment.steps.gait.title"
                  )}
                </h3>

                <p>
                  {t(
                    "newAssessment.steps.gait.description"
                  )}
                </p>

              </div>

            </div>

          </div>

          <button
            className="primary-action mandatory-start-button"
            onClick={handleStartAssessment}
            disabled={loading}
          >

            {loading ? (
              <Loader2
                size={18}
                className="animate-spin"
              />
            ) : (
              <ClipboardList size={18} />
            )}

            {loading
              ? "Initializing..."
              : t(
                  "newAssessment.actions.startQuestionnaire"
                )}

          </button>

        </div>

        <div className="assessment-note">

          <strong>
            {t("newAssessment.optional.title")}
          </strong>

          <span>
            {t(
              "newAssessment.optional.description"
            )}
          </span>

        </div>

      </div>

    </div>
  );
}

export default NewAssessment;