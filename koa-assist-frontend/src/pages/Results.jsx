import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  FileText,
  ScanLine,
  Video,
  AlertCircle,
  TrendingUp,
  Cpu,
} from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";
import { analyzeFusion } from "../api/fusionApi";

function Results() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // =========================================================
  // LOAD PATIENT DATA
  // =========================================================

  const patient = useMemo(() => {
    if (!patientId) return null;

    const rawId = patientId.replace("LOCAL-", "");

    const directData =
      localStorage.getItem(`koaPatient_${patientId}`) ||
      localStorage.getItem(`koaPatient_${rawId}`);

    if (directData) {
      try {
        return JSON.parse(directData);
      } catch (e) {
        console.error("Error parsing direct patient record:", e);
      }
    }

    const arrayKeys = [
      "koaPatients",
      "koa_patients",
      "patients",
    ];

    for (const key of arrayKeys) {
      const savedPatients = localStorage.getItem(key);

      if (!savedPatients) continue;

      try {
        const patients = JSON.parse(savedPatients);

        if (Array.isArray(patients)) {
          const match = patients.find(
            (item) =>
              String(item.patientId || item.id) ===
                String(patientId) ||
              String(item.patientId || item.id) ===
                String(rawId)
          );

          if (match) return match;
        }
      } catch (e) {
        console.error(`Error reading ${key}:`, e);
      }
    }

    return null;
  }, [patientId]);

  // =========================================================
  // LOAD ASSESSMENT DATA
  // =========================================================

  const assessmentData = useMemo(() => {
    if (!patientId) return {};

    const rawId = patientId.replace("LOCAL-", "");

    const questionnaire =
      localStorage.getItem(
        `koaQuestionnaire_${patientId}`
      ) ||
      localStorage.getItem(
        `koaQuestionnaire_${rawId}`
      );

    const gait =
      localStorage.getItem(`koaGait_${patientId}`) ||
      localStorage.getItem(
        `koaGaitVideo_${patientId}`
      ) ||
      localStorage.getItem(`koaGait_${rawId}`) ||
      localStorage.getItem(
        `koaGaitVideo_${rawId}`
      );

    const xray =
      localStorage.getItem(`koaXray_${patientId}`) ||
      localStorage.getItem(`koaXray_${rawId}`);

    const sensors =
      localStorage.getItem(`koaSensors_${patientId}`) ||
      localStorage.getItem(`koaSensors_${rawId}`);

    const additional =
      localStorage.getItem(
        `koaAdditional_${patientId}`
      ) ||
      localStorage.getItem(
        `koaAdditional_${rawId}`
      );

    return {
      questionnaire: questionnaire
        ? JSON.parse(questionnaire)
        : null,

      gait: gait ? JSON.parse(gait) : null,

      xray: xray ? JSON.parse(xray) : null,

      sensors: sensors ? JSON.parse(sensors) : null,

      additional: additional
        ? JSON.parse(additional)
        : null,
    };
  }, [patientId]);

  // =========================================================
  // QUESTIONNAIRE ANSWERS
  // =========================================================

  const questionnaireAnswers =
    assessmentData.questionnaire?.answers || {};

  // =========================================================
  // PATIENT AGE
  // =========================================================

  const displayAge =
    patient?.age ??
    questionnaireAnswers.patient_age ??
    null;

  // =========================================================
  // PATIENT SEX / GENDER
  // =========================================================

  const rawSex =
    patient?.gender ??
    patient?.sex ??
    questionnaireAnswers.biological_sex ??
    null;

  const displaySex =
    rawSex === null ||
    rawSex === undefined ||
    rawSex === ""
      ? null
      : Number(rawSex) === 1 ||
        String(rawSex).toLowerCase() === "female"
      ? "Female"
      : Number(rawSex) === 0 ||
        String(rawSex).toLowerCase() === "male"
      ? "Male"
      : rawSex;

  // =========================================================
  // QUESTIONNAIRE ANALYSIS
  // =========================================================

  const questionnaireAnalysis = useMemo(() => {
    return (
      assessmentData.questionnaire?.analysisResult ||
      assessmentData.questionnaire?.result ||
      null
    );
  }, [assessmentData]);

  // =========================================================
  // GAIT ANALYSIS
  // =========================================================

  const gaitAnalysis = useMemo(() => {
    return (
      assessmentData.gait?.analysisResult ||
      assessmentData.gait?.result ||
      null
    );
  }, [assessmentData]);

  // =========================================================
  // X-RAY ANALYSIS
  // =========================================================

  const xrayAnalysis = useMemo(() => {
    return (
      assessmentData.xray?.analysisResult ||
      assessmentData.xray ||
      null
    );
  }, [assessmentData]);

  // =========================================================
  // SENSOR ANALYSIS
  // =========================================================

  const sensorAnalysis = useMemo(() => {
    return (
      assessmentData.sensors?.analysisResult ||
      assessmentData.sensors?.result ||
      null
    );
  }, [assessmentData]);

  // =========================================================
  // CHECK IF ANY ANALYSIS EXISTS
  // =========================================================

  const hasAnalysis = Boolean(
    questionnaireAnalysis ||
      gaitAnalysis ||
      sensorAnalysis ||
      (xrayAnalysis &&
        (xrayAnalysis.kl_grade !== undefined ||
          xrayAnalysis.klGrade !== undefined))
  );

  // =========================================================
  // INPUTS
  // =========================================================

  const inputs = [
    {
      key: "questionnaire",
      title:
        t("results.inputs.questionnaire.title") ||
        "Questionnaire",
      description:
        t(
          "results.inputs.questionnaire.description"
        ) ||
        "KOOS/WOMAC symptom evaluation",
      icon: ClipboardList,
      available: Boolean(
        assessmentData.questionnaire
      ),
    },

    {
      key: "gait",
      title:
        t("results.inputs.gait.title") ||
        "Gait Video",
      description:
        t("results.inputs.gait.description") ||
        "Computer vision posture & movement tracking",
      icon: Video,
      available: Boolean(assessmentData.gait),
    },

    {
      key: "xray",
      title:
        t("results.inputs.xray.title") ||
        "X-Ray Scan",
      description:
        t("results.inputs.xray.description") ||
        "Radiographic Kellgren-Lawrence classification",
      icon: ScanLine,
      available: Boolean(assessmentData.xray),
    },

    {
      key: "sensors",
      title:
        t("results.inputs.sensors.title") ||
        "IMU Sensors",
      description:
        t("results.inputs.sensors.description") ||
        "Wearable sensor kinematic parameters",
      icon: Cpu,
      available: Boolean(assessmentData.sensors),
    },
  ];

  const providedInputs = inputs.filter(
    (input) => input.available
  );

  // =========================================================
  // X-RAY VALUES
  // =========================================================

  const klGrade =
    xrayAnalysis?.kl_grade ??
    xrayAnalysis?.klGrade;

  // =========================================================
  // GAIT VALUES
  // =========================================================

  const gaitPrediction =
    gaitAnalysis?.prediction;

  const gaitRiskScore =
    gaitAnalysis?.oa_risk_score !== undefined &&
    gaitAnalysis?.oa_risk_score !== null
      ? `${(
          Number(gaitAnalysis.oa_risk_score) * 100
        ).toFixed(1)}%`
      : "N/A";

  // =========================================================
  // QUESTIONNAIRE VALUES
  // =========================================================

  const questionnaireRiskCategory =
    questionnaireAnalysis?.risk_category;

  const questionnaireRiskScore =
    questionnaireAnalysis?.oa_risk_score;

  // =========================================================
  // SENSOR VALUES
  // =========================================================

  const sensorPrediction =
    sensorAnalysis?.prediction;

  const sensorRiskScore =
    sensorAnalysis?.oa_risk_score !== undefined &&
    sensorAnalysis?.oa_risk_score !== null
      ? `${(
          Number(sensorAnalysis.oa_risk_score) * 100
        ).toFixed(1)}%`
      : "N/A";

  const sensorHealthyProbability =
    sensorAnalysis?.healthy_probability !== undefined &&
    sensorAnalysis?.healthy_probability !== null
      ? `${(
          Number(
            sensorAnalysis.healthy_probability
          ) * 100
        ).toFixed(1)}%`
      : "N/A";

  // =========================================================
  // FUSION INPUTS
  // =========================================================

  /*
   * The fusion backend expects scores from 0–100.
   *
   * X-ray:
   * KL Grade 0–4 -> 0–100
   *
   * Questionnaire / Gait / Sensor:
   * Model OA risk is normally 0–1 -> 0–100
   */

  const xrayScore =
    klGrade !== undefined &&
    klGrade !== null
      ? Number(klGrade) * 25
      : null;

  const normalizeRiskScore = (value) => {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return null;
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      return null;
    }

    return numericValue <= 1
      ? numericValue * 100
      : numericValue;
  };

  const videoScore = normalizeRiskScore(
    gaitAnalysis?.oa_risk_score
  );

  const sensorScore = normalizeRiskScore(
    sensorAnalysis?.oa_risk_score
  );

  const questionnaireScore = normalizeRiskScore(
    questionnaireRiskScore
  );

  // =========================================================
  // FUSION STATE
  // =========================================================

  const [fusionResult, setFusionResult] =
    useState(null);

  const [fusionLoading, setFusionLoading] =
    useState(false);

  const [fusionError, setFusionError] =
    useState(null);

  // =========================================================
  // CALL FUSION BACKEND
  // =========================================================

  useEffect(() => {
    const hasFusionInput = [
      xrayScore,
      videoScore,
      sensorScore,
      questionnaireScore,
    ].some(
      (score) => score !== null
    );

    if (!hasFusionInput) {
      setFusionResult(null);
      setFusionError(null);
      return;
    }

    let cancelled = false;

    const runFusion = async () => {
      setFusionLoading(true);
      setFusionError(null);

      try {
        const result = await analyzeFusion({
          xray_score: xrayScore,
          video_score: videoScore,
          sensor_score: sensorScore,
          questionnaire_score:
            questionnaireScore,
        });

        if (!cancelled) {
          setFusionResult(result);
        }
      } catch (error) {
        console.error(
          "Fusion analysis failed:",
          error
        );

        if (!cancelled) {
          setFusionResult(null);

          setFusionError(
            error?.message ||
              "Unable to generate the final KOA assessment."
          );
        }
      } finally {
        if (!cancelled) {
          setFusionLoading(false);
        }
      }
    };

    runFusion();

    return () => {
      cancelled = true;
    };
  }, [
    xrayScore,
    videoScore,
    sensorScore,
    questionnaireScore,
  ]);

  // =========================================================
  // AI SUGGESTIONS
  // =========================================================

  const getAISuggestions = (severity) => {
    switch (severity) {
      case "Normal":
        return [
          "Maintain regular physical activity and healthy movement habits.",
          "Continue monitoring knee pain, stiffness, or mobility changes.",
          "Use periodic reassessment if symptoms develop or worsen.",
        ];

      case "Mild":
        return [
          "Consider low-impact activities such as walking, cycling, or swimming.",
          "Strengthening exercises for the quadriceps, hamstrings, and hip muscles may help support knee function.",
          "Monitor pain, stiffness, and mobility and consider physiotherapy if symptoms persist.",
        ];

      case "Moderate":
        return [
          "Consider physiotherapy focused on knee strength, mobility, and gait mechanics.",
          "Prefer low-impact exercise and avoid activities that consistently aggravate knee symptoms.",
          "Clinical evaluation is advisable, particularly if pain or functional limitation is increasing.",
        ];

      case "Severe":
        return [
          "Orthopedic or specialist evaluation is recommended for further assessment.",
          "A physiotherapy program can be considered to support mobility and functional movement.",
          "Avoid repeatedly performing activities that cause significant knee pain or instability.",
        ];

      case "Critical":
        return [
          "Prompt specialist evaluation is recommended.",
          "Seek clinical assessment for persistent pain, swelling, instability, or substantial mobility limitations.",
          "Use the multimodal result as a screening aid and not as a substitute for clinical diagnosis.",
        ];

      default:
        return [
          "Complete additional assessment modalities when available for a more comprehensive screening result.",
          "Discuss persistent or worsening knee symptoms with a qualified healthcare professional.",
        ];
    }
  };

  const aiSuggestions = fusionResult
    ? getAISuggestions(fusionResult.severity)
    : [];

  // =========================================================
  // GENERATE REPORT
  // =========================================================

  const handleGenerateReport = () => {
    if (!patientId) return;

    const reportData = {
      patientId,

      patient,

      questionnaire:
        assessmentData.questionnaire,

      gait: assessmentData.gait,

      xray: assessmentData.xray,

      sensors: assessmentData.sensors,

      additional:
        assessmentData.additional,

      fusion: fusionResult,

      suggestions: aiSuggestions,

      generatedAt:
        new Date().toISOString(),
    };

    localStorage.setItem(
      `koaReport_${patientId}`,
      JSON.stringify(reportData)
    );

    navigate(
      `/assessment/${patientId}/report`
    );
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="results-page">

      {/* =====================================================
          TOP BAR
      ===================================================== */}

      <div className="results-topbar">

        <button
          type="button"
          className="back-button"
          onClick={() =>
            navigate(
              `/assessment/${patientId}/additional`
            )
          }
        >
          <ArrowLeft size={17} />

          {t(
            "results.actions.backToAssessment"
          ) || "Back to Assessment"}
        </button>

        <div className="results-patient">
          {t("results.patientId") ||
            "Patient ID"}{" "}
          :{" "}
          <strong>{patientId}</strong>
        </div>

      </div>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="results-header">

        <div>

          <div className="page-breadcrumb">
            {t("results.breadcrumb") ||
              "Dashboard / Assessment / Results"}
          </div>

          <h1>
            {t("results.title") ||
              "Diagnostic Results"}
          </h1>

          <p>
            {t("results.description") ||
              "Multimodal evaluation summary derived from patient inputs."}
          </p>

        </div>

        <button
          type="button"
          className="secondary-action"
          onClick={() =>
            navigate(
              `/assessment/${patientId}/report`
            )
          }
        >
          <FileText size={17} />

          {t("results.actions.viewReport") ||
            "View Full Report"}
        </button>

      </div>

      {/* =====================================================
          PATIENT SUMMARY
      ===================================================== */}

      <div className="results-patient-card">

        <div className="results-patient-avatar">

          {patient?.name
            ?.charAt(0)
            ?.toUpperCase() ||
            patient?.patientName
              ?.charAt(0)
              ?.toUpperCase() ||
            "P"}

        </div>

        <div className="results-patient-info">

          <span>
            {t(
              "results.patientSummary.patient"
            ) || "Patient"}
          </span>

          <h2>
            {patient?.name ||
              patient?.patientName ||
              t(
                "results.patientSummary.defaultName"
              ) ||
              `Patient #${patientId}`}
          </h2>

          <p>

            {displayAge !== null &&
            displayAge !== undefined &&
            displayAge !== ""
              ? `${displayAge} ${
                  t(
                    "results.patientSummary.years"
                  ) || "years"
                }`
              : t(
                  "results.patientSummary.ageNotProvided"
                ) || "Age not provided"}

            {" · "}

            {displaySex ||
              t(
                "results.patientSummary.genderNotProvided"
              ) ||
              "Gender not provided"}

          </p>

        </div>

        <div className="results-status">

          <span className="results-status-label">
            {t(
              "results.patientSummary.status"
            ) || "Status"}
          </span>

          {hasAnalysis ? (

            <div
              className="results-completed-badge"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.25rem 0.6rem",
                borderRadius: "9999px",
                backgroundColor: "#dcfce7",
                color: "#15803d",
                fontSize: "0.85rem",
                fontWeight: 600,
              }}
            >

              <CheckCircle2 size={15} />

              {t(
                "results.patientSummary.analysisCompleted"
              ) || "Analysis Completed"}

            </div>

          ) : (

            <div className="results-pending-badge">

              <AlertCircle size={15} />

              {t(
                "results.patientSummary.analysisPending"
              ) ||
                "Analysis Pending"}

            </div>

          )}

        </div>

      </div>

      {/* =====================================================
          FINAL KOA ASSESSMENT
      ===================================================== */}

      <section className="results-main-card">

        <div className="results-section-heading">

          <div className="results-section-icon">
            <Activity size={22} />
          </div>

          <div>

            <h2>
              {t(
                "results.finalAssessment.title"
              ) ||
                "Final KOA Assessment"}
            </h2>

            <p>
              {t(
                "results.finalAssessment.description"
              ) ||
                "Combined screening result generated from the available assessment modalities."}
            </p>

          </div>

        </div>

        {fusionLoading ? (

          <div
            className="results-pending-panel"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
            }}
          >

            <Activity size={26} />

            <div>

              <h3 style={{ margin: 0 }}>
                Generating Final Assessment
              </h3>

              <p
                style={{
                  margin: "0.35rem 0 0",
                }}
              >
                Combining the available X-ray,
                gait, sensor, and questionnaire
                results.
              </p>

            </div>

          </div>

        ) : fusionError ? (

          <div
            className="results-pending-panel"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
            }}
          >

            <AlertCircle size={26} />

            <div>

              <h3 style={{ margin: 0 }}>
                Final Assessment Unavailable
              </h3>

              <p
                style={{
                  margin: "0.35rem 0 0",
                }}
              >
                {fusionError}
              </p>

            </div>

          </div>

        ) : fusionResult ? (

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >

            {/* FINAL SCORE CARDS */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3, minmax(0, 1fr))",
                gap: "1rem",
              }}
            >

              <div
                style={{
                  padding: "1.25rem",
                  backgroundColor: "#f9fafb",
                  borderRadius: "8px",
                  border:
                    "1px solid #e5e7eb",
                }}
              >

                <div
                  style={{
                    color: "#6b7280",
                    fontSize: "0.85rem",
                  }}
                >
                  Overall KOA Score
                </div>

                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: 700,
                    marginTop: "0.35rem",
                    color: "#111827",
                  }}
                >
                  {Number(
                    fusionResult.overall_koa_score
                  ).toFixed(1)}
                  /100
                </div>

              </div>

              <div
                style={{
                  padding: "1.25rem",
                  backgroundColor: "#f9fafb",
                  borderRadius: "8px",
                  border:
                    "1px solid #e5e7eb",
                }}
              >

                <div
                  style={{
                    color: "#6b7280",
                    fontSize: "0.85rem",
                  }}
                >
                  Overall Severity
                </div>

                <div
                  style={{
                    fontSize: "1.6rem",
                    fontWeight: 700,
                    marginTop: "0.35rem",
                    color: "#111827",
                  }}
                >
                  {fusionResult.severity ||
                    "N/A"}
                </div>

              </div>

              <div
                style={{
                  padding: "1.25rem",
                  backgroundColor: "#f9fafb",
                  borderRadius: "8px",
                  border:
                    "1px solid #e5e7eb",
                }}
              >

                <div
                  style={{
                    color: "#6b7280",
                    fontSize: "0.85rem",
                  }}
                >
                  Modalities Used
                </div>

                <div
                  style={{
                    fontSize: "1.6rem",
                    fontWeight: 700,
                    marginTop: "0.35rem",
                    color: "#111827",
                  }}
                >
                  {fusionResult.modalities_used ||
                    0}{" "}
                  / 4
                </div>

              </div>

            </div>

            {/* RECOMMENDATION */}

            <div
              style={{
                padding: "1rem 1.1rem",
                backgroundColor: "#f9fafb",
                borderRadius: "8px",
                border:
                  "1px solid #e5e7eb",
              }}
            >

              <div
                style={{
                  color: "#6b7280",
                  fontSize: "0.85rem",
                  marginBottom: "0.35rem",
                }}
              >
                Recommendation
              </div>

              <div
                style={{
                  color: "#111827",
                  fontSize: "0.95rem",
                  lineHeight: 1.6,
                }}
              >
                {fusionResult.recommendation ||
                  "No recommendation available."}
              </div>

            </div>

          </div>

        ) : (

          <div className="results-pending-panel">

            <div className="results-pending-icon">
              <AlertCircle size={30} />
            </div>

            <div>

              <h3>
                Complete an Assessment
              </h3>

              <p>
                Complete at least one assessment
                module to generate the final KOA
                screening result.
              </p>

            </div>

          </div>

        )}

      </section>

      {/* =====================================================
          AI SUGGESTIONS
      ===================================================== */}

      {fusionResult && (

        <section className="results-main-card">

          <div className="results-section-heading">

            <div className="results-section-icon">
              <TrendingUp size={22} />
            </div>

            <div>

              <h2>
                AI Suggestions
              </h2>

              <p>
                Practical guidance based on the
                final screening severity and
                available assessment results.
              </p>

            </div>

          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >

            {aiSuggestions.map(
              (suggestion, index) => (

                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems:
                      "flex-start",
                    gap: "0.75rem",
                    padding:
                      "0.9rem 1rem",
                    backgroundColor:
                      "#f9fafb",
                    borderRadius: "8px",
                    border:
                      "1px solid #e5e7eb",
                  }}
                >

                  <CheckCircle2
                    size={18}
                    style={{
                      flexShrink: 0,
                      marginTop:
                        "0.1rem",
                    }}
                  />

                  <span
                    style={{
                      color: "#374151",
                      fontSize:
                        "0.92rem",
                      lineHeight: 1.55,
                    }}
                  >
                    {suggestion}
                  </span>

                </div>

              )
            )}

          </div>

        </section>

      )}

      {/* =====================================================
          INDIVIDUAL MODALITY FINDINGS
      ===================================================== */}

      <section className="results-main-card">

        <div className="results-section-heading">

          <div className="results-section-icon">
            <Activity size={22} />
          </div>

          <div>

            <h2>
              {t(
                "results.aiResult.title"
              ) ||
                "Individual Modality Findings"}
            </h2>

            <p>
              Results produced by each available
              assessment module before multimodal
              fusion.
            </p>

          </div>

        </div>

        {hasAnalysis ? (

          <div
            className="results-data-panel"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
              padding: "1rem",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
              border:
                "1px solid #e5e7eb",
            }}
          >

            {/* =================================================
                1. X-RAY ANALYSIS
            ================================================= */}

            {klGrade !== undefined &&
              klGrade !== null && (

                <div
                  style={{
                    backgroundColor: "#fff",
                    padding: "1rem",
                    borderRadius: "6px",
                    border:
                      "1px solid #e5e7eb",
                  }}
                >

                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "center",
                      marginBottom:
                        "0.75rem",
                    }}
                  >

                    <h3
                      style={{
                        margin: 0,
                        fontSize:
                          "1rem",
                        color:
                          "#374151",
                      }}
                    >
                      Radiographic Scan
                      (X-Ray)
                    </h3>

                    <span
                      style={{
                        padding:
                          "0.25rem 0.75rem",
                        borderRadius:
                          "9999px",
                        fontWeight: 600,
                        fontSize:
                          "0.85rem",
                        backgroundColor:
                          "#e0e7ff",
                        color:
                          "#3730a3",
                      }}
                    >
                      KL Grade {klGrade}
                    </span>

                  </div>

                  <div
                    style={{
                      padding:
                        "0.75rem",
                      backgroundColor:
                        "#f9fafb",
                      borderRadius:
                        "6px",
                      border:
                        "1px solid #f3f4f6",
                    }}
                  >

                    <div
                      style={{
                        color:
                          "#6b7280",
                        fontSize:
                          "0.85rem",
                      }}
                    >
                      KL Grade
                      Assessment
                    </div>

                    <div
                      style={{
                        fontSize:
                          "1.5rem",
                        fontWeight:
                          "bold",
                        marginTop:
                          "0.25rem",
                        color:
                          "#111827",
                      }}
                    >
                      Grade {klGrade}
                    </div>

                  </div>

                </div>

            )}

            {/* =================================================
                2. QUESTIONNAIRE ANALYSIS
            ================================================= */}

            {questionnaireAnalysis && (

              <div
                style={{
                  backgroundColor:
                    "#fff",
                  padding: "1rem",
                  borderRadius:
                    "6px",
                  border:
                    "1px solid #e5e7eb",
                }}
              >

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    marginBottom:
                      "1rem",
                  }}
                >

                  <div>

                    <h3
                      style={{
                        margin: 0,
                        fontSize:
                          "1rem",
                        color:
                          "#374151",
                      }}
                    >
                      Clinical Questionnaire
                      Assessment
                    </h3>

                    <p
                      style={{
                        margin:
                          "0.35rem 0 0",
                        fontSize:
                          "0.8rem",
                        color:
                          "#6b7280",
                      }}
                    >
                      Random Forest questionnaire
                      model output based on
                      clinical responses.
                    </p>

                  </div>

                  <span
                    style={{
                      padding:
                        "0.35rem 0.8rem",
                      borderRadius:
                        "9999px",
                      fontWeight: 600,
                      fontSize:
                        "0.85rem",
                      backgroundColor:
                        questionnaireRiskCategory ===
                        "Low Risk"
                          ? "#dcfce7"
                          : questionnaireRiskCategory ===
                            "Moderate Risk"
                          ? "#fef3c7"
                          : "#fee2e2",
                      color:
                        questionnaireRiskCategory ===
                        "Low Risk"
                          ? "#15803d"
                          : questionnaireRiskCategory ===
                            "Moderate Risk"
                          ? "#b45309"
                          : "#b91c1c",
                    }}
                  >
                    {questionnaireRiskCategory ||
                      "Risk Evaluated"}
                  </span>

                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap: "1rem",
                  }}
                >

                  <div
                    style={{
                      padding: "1rem",
                      backgroundColor:
                        "#f9fafb",
                      borderRadius:
                        "6px",
                      border:
                        "1px solid #f3f4f6",
                    }}
                  >

                    <div
                      style={{
                        display: "flex",
                        alignItems:
                          "center",
                        gap: "0.4rem",
                        color:
                          "#6b7280",
                        fontSize:
                          "0.85rem",
                      }}
                    >

                      <TrendingUp
                        size={16}
                      />

                      <span>
                        OA Risk Score
                      </span>

                    </div>

                    <div
                      style={{
                        fontSize:
                          "1.8rem",
                        fontWeight:
                          "bold",
                        marginTop:
                          "0.25rem",
                        color:
                          "#111827",
                      }}
                    >
                      {questionnaireRiskScore !==
                        undefined &&
                      questionnaireRiskScore !==
                        null
                        ? `${(
                            Number(
                              questionnaireRiskScore
                            ) * 100
                          ).toFixed(1)}%`
                        : "N/A"}
                    </div>

                  </div>

                  <div
                    style={{
                      padding: "1rem",
                      backgroundColor:
                        "#f9fafb",
                      borderRadius:
                        "6px",
                      border:
                        "1px solid #f3f4f6",
                    }}
                  >

                    <div
                      style={{
                        color:
                          "#6b7280",
                        fontSize:
                          "0.85rem",
                      }}
                    >
                      Risk Category
                    </div>

                    <div
                      style={{
                        fontSize:
                          "1.25rem",
                        fontWeight:
                          "bold",
                        marginTop:
                          "0.45rem",
                        color:
                          "#111827",
                      }}
                    >
                      {questionnaireRiskCategory ||
                        "N/A"}
                    </div>

                  </div>

                </div>

              </div>

            )}

            {/* =================================================
                3. GAIT ANALYSIS
            ================================================= */}

            {gaitAnalysis && (

              <div
                style={{
                  backgroundColor:
                    "#fff",
                  padding: "1rem",
                  borderRadius:
                    "6px",
                  border:
                    "1px solid #e5e7eb",
                }}
              >

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    marginBottom:
                      "1rem",
                  }}
                >

                  <div>

                    <h3
                      style={{
                        margin: 0,
                        fontSize:
                          "1rem",
                        color:
                          "#374151",
                      }}
                    >
                      Gait & Mobility
                      Video Analysis
                    </h3>

                    <p
                      style={{
                        margin:
                          "0.35rem 0 0",
                        fontSize:
                          "0.8rem",
                        color:
                          "#6b7280",
                      }}
                    >
                      YOLOv8 Pose +
                      Patient-Independent
                      Random Forest
                    </p>

                  </div>

                  {gaitPrediction && (

                    <span
                      style={{
                        padding:
                          "0.35rem 0.8rem",
                        borderRadius:
                          "9999px",
                        fontWeight: 600,
                        fontSize:
                          "0.85rem",
                        backgroundColor:
                          gaitPrediction ===
                          "KOA"
                            ? "#fee2e2"
                            : "#dcfce7",
                        color:
                          gaitPrediction ===
                          "KOA"
                            ? "#b91c1c"
                            : "#15803d",
                      }}
                    >
                      {gaitPrediction}
                    </span>

                  )}

                </div>

                <div
                  style={{
                    padding: "1rem",
                    backgroundColor:
                      "#f9fafb",
                    borderRadius:
                      "6px",
                    border:
                      "1px solid #f3f4f6",
                  }}
                >

                  <div
                    style={{
                      display: "flex",
                      alignItems:
                        "center",
                      gap: "0.4rem",
                      color:
                        "#6b7280",
                      fontSize:
                        "0.85rem",
                    }}
                  >

                    <TrendingUp
                      size={16}
                    />

                    <span>
                      OA Risk Score
                    </span>

                  </div>

                  <div
                    style={{
                      fontSize:
                        "1.8rem",
                      fontWeight:
                        "bold",
                      marginTop:
                        "0.25rem",
                      color:
                        "#111827",
                    }}
                  >
                    {gaitRiskScore}
                  </div>

                </div>

              </div>

            )}

            {/* =================================================
                4. SENSOR ANALYSIS
            ================================================= */}

            {sensorAnalysis && (

              <div
                style={{
                  backgroundColor:
                    "#fff",
                  padding: "1rem",
                  borderRadius:
                    "6px",
                  border:
                    "1px solid #e5e7eb",
                }}
              >

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                    marginBottom:
                      "1rem",
                  }}
                >

                  <div>

                    <h3
                      style={{
                        margin: 0,
                        fontSize:
                          "1rem",
                        color:
                          "#374151",
                      }}
                    >
                      IMU Sensor Analysis
                    </h3>

                    <p
                      style={{
                        margin:
                          "0.35rem 0 0",
                        fontSize:
                          "0.8rem",
                        color:
                          "#6b7280",
                      }}
                    >
                      Hardware-based
                      kinematic analysis
                      using Random Forest.
                    </p>

                  </div>

                  {sensorPrediction && (

                    <span
                      style={{
                        padding:
                          "0.35rem 0.8rem",
                        borderRadius:
                          "9999px",
                        fontWeight: 600,
                        fontSize:
                          "0.85rem",
                        backgroundColor:
                          sensorPrediction ===
                          "Possible KOA Risk"
                            ? "#fee2e2"
                            : "#dcfce7",
                        color:
                          sensorPrediction ===
                          "Possible KOA Risk"
                            ? "#b91c1c"
                            : "#15803d",
                      }}
                    >
                      {sensorPrediction}
                    </span>

                  )}

                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1fr 1fr",
                    gap: "1rem",
                  }}
                >

                  <div
                    style={{
                      padding: "1rem",
                      backgroundColor:
                        "#f9fafb",
                      borderRadius:
                        "6px",
                      border:
                        "1px solid #f3f4f6",
                    }}
                  >

                    <div
                      style={{
                        display: "flex",
                        alignItems:
                          "center",
                        gap: "0.4rem",
                        color:
                          "#6b7280",
                        fontSize:
                          "0.85rem",
                      }}
                    >

                      <TrendingUp
                        size={16}
                      />

                      <span>
                        OA Risk Score
                      </span>

                    </div>

                    <div
                      style={{
                        fontSize:
                          "1.8rem",
                        fontWeight:
                          "bold",
                        marginTop:
                          "0.25rem",
                        color:
                          "#111827",
                      }}
                    >
                      {sensorRiskScore}
                    </div>

                  </div>

                  <div
                    style={{
                      padding: "1rem",
                      backgroundColor:
                        "#f9fafb",
                      borderRadius:
                        "6px",
                      border:
                        "1px solid #f3f4f6",
                    }}
                  >

                    <div
                      style={{
                        color:
                          "#6b7280",
                        fontSize:
                          "0.85rem",
                      }}
                    >
                      Healthy Probability
                    </div>

                    <div
                      style={{
                        fontSize:
                          "1.5rem",
                        fontWeight:
                          "bold",
                        marginTop:
                          "0.25rem",
                        color:
                          "#111827",
                      }}
                    >
                      {sensorHealthyProbability}
                    </div>

                  </div>

                </div>

              </div>

            )}

          </div>

        ) : (

          <div className="results-pending-panel">

            <div className="results-pending-icon">
              <AlertCircle size={30} />
            </div>

            <div>

              <h3>
                Assessment Results Pending
              </h3>

              <p>
                Complete at least one assessment
                module to view individual findings.
              </p>

            </div>

          </div>

        )}

      </section>

      {/* =====================================================
          PROVIDED INPUTS
      ===================================================== */}

      <section className="results-main-card">

        <div className="results-section-heading">

          <div className="results-section-icon">
            <CheckCircle2 size={22} />
          </div>

          <div>

            <h2>
              {t(
                "results.assessmentInputs.title"
              ) ||
                "Assessment Inputs"}
            </h2>

            <p>
              {t(
                "results.assessmentInputs.description"
              ) ||
                "Status of diagnostic modalities submitted."}
            </p>

          </div>

        </div>

        <div className="results-input-grid">

          {inputs.map((input) => {

            const Icon = input.icon;

            return (
              <div
                key={input.key}
                className={`results-input-card ${
                  input.available
                    ? "input-provided"
                    : "input-not-provided"
                }`}
              >

                <div className="results-input-icon">
                  <Icon size={21} />
                </div>

                <div className="results-input-content">

                  <div className="results-input-title">

                    <h3>{input.title}</h3>

                    {input.available ? (

                      <span className="input-status provided">

                        <CheckCircle2
                          size={13}
                        />

                        {t(
                          "results.assessmentInputs.provided"
                        ) || "Provided"}

                      </span>

                    ) : (

                      <span className="input-status not-provided">

                        {t(
                          "results.assessmentInputs.notProvided"
                        ) ||
                          "Not Provided"}

                      </span>

                    )}

                  </div>

                  <p>
                    {input.description}
                  </p>

                </div>

              </div>
            );
          })}

        </div>

      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <div className="results-footer">

        <span>

          {providedInputs.length}{" "}

          {t("results.footer.of") ||
            "of"}{" "}

          {inputs.length}{" "}

          {t(
            "results.footer.modalitiesProvided"
          ) ||
            "modalities provided"}

        </span>

        <button
          type="button"
          className="primary-action"
          onClick={handleGenerateReport}
        >

          <FileText size={17} />

          {t(
            "results.footer.generateReport"
          ) ||
            "Generate Full Report"}

        </button>

      </div>

    </div>
  );
}

export default Results;