import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  FileText,
  ScanLine,
  Video,
  Cpu,
  AlertCircle,
  Printer,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";

function safeParse(key) {
  const raw = localStorage.getItem(key);

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error(`Error parsing ${key}:`, error);
    return null;
  }
}

function getNestedResult(data) {
  if (!data) return null;

  return (
    data.analysisResult ||
    data.result ||
    data.aiResult ||
    data.predictionResult ||
    data
  );
}

function formatRisk(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return String(value);
  }

  return `${(number * 100).toFixed(1)}%`;
}

function Report() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // =========================================================
  // PATIENT
  // =========================================================

  const patient = useMemo(() => {
    if (!patientId) return null;

    const directPatient = safeParse(`koaPatient_${patientId}`);

    if (directPatient) {
      return directPatient;
    }

    const arrayKeys = [
      "koa_patients",
      "koaPatients",
      "patients",
    ];

    for (const key of arrayKeys) {
      const list = safeParse(key);

      if (!Array.isArray(list)) continue;

      const match = list.find(
        (p) =>
          String(p.id ?? p.patientId ?? "") ===
          String(patientId)
      );

      if (match) return match;
    }

    if (String(patientId) === "1") {
      return {
        patientId: "1",
        name: "John Doe",
        age: 54,
        gender: "Male",
      };
    }

    return null;
  }, [patientId]);

  // =========================================================
  // LOAD GENERATED REPORT FIRST
  // =========================================================

  const generatedReport = useMemo(() => {
    if (!patientId) return null;

    return safeParse(`koaReport_${patientId}`);
  }, [patientId]);

  // =========================================================
  // LOAD ASSESSMENT DATA
  // =========================================================

  const assessmentData = useMemo(() => {
    if (!patientId) return {};

    return {
      questionnaire:
        generatedReport?.questionnaire ||
        safeParse(`koaQuestionnaire_${patientId}`),

      gait:
        generatedReport?.gait ||
        safeParse(`koaGait_${patientId}`) ||
        safeParse(`koaGaitVideo_${patientId}`),

      xray:
        generatedReport?.xray ||
        safeParse(`koaXray_${patientId}`),

      sensors:
        generatedReport?.sensors ||
        safeParse(`koaSensors_${patientId}`),

      suggestions:
        generatedReport?.suggestions ||
        safeParse(`koaSuggestions_${patientId}`),
    };
  }, [patientId, generatedReport]);

  // =========================================================
  // QUESTIONNAIRE
  // =========================================================

  const questionnaireResult = getNestedResult(
    assessmentData.questionnaire
  );

  const questionnaireAnswers =
    assessmentData.questionnaire?.answers || {};

  const questionnairePrediction =
    questionnaireResult?.prediction ||
    questionnaireResult?.risk_level ||
    questionnaireResult?.riskLevel ||
    questionnaireResult?.classification ||
    null;

  const questionnaireRisk =
    questionnaireResult?.oa_risk_score ??
    questionnaireResult?.oaRiskScore ??
    questionnaireResult?.risk_score ??
    questionnaireResult?.riskScore ??
    null;

  // =========================================================
  // GAIT
  // =========================================================

  const gaitResult = getNestedResult(
    assessmentData.gait
  );

  const gaitPrediction =
    gaitResult?.prediction ||
    gaitResult?.classification ||
    gaitResult?.risk_level ||
    gaitResult?.riskLevel ||
    null;

  const gaitRisk =
    gaitResult?.oa_risk_score ??
    gaitResult?.oaRiskScore ??
    gaitResult?.risk_score ??
    gaitResult?.riskScore ??
    gaitResult?.risk ??
    null;

  // =========================================================
  // X-RAY
  // =========================================================

  const xrayResult = getNestedResult(
    assessmentData.xray
  );

  const klGrade =
    xrayResult?.kl_grade ??
    xrayResult?.klGrade ??
    xrayResult?.kellgren_lawrence_grade ??
    null;

  // =========================================================
  // SENSOR
  // =========================================================

  const sensorResult = getNestedResult(
    assessmentData.sensors
  );

  const sensorPrediction =
    sensorResult?.prediction ||
    sensorResult?.classification ||
    null;

  const sensorRisk =
    sensorResult?.oa_risk_score ??
    sensorResult?.oaRiskScore ??
    null;

  const healthyProbability =
    sensorResult?.healthy_probability ??
    sensorResult?.healthyProbability ??
    null;

  // =========================================================
  // DEMOGRAPHICS
  // =========================================================

  const displayAge =
    patient?.age ??
    questionnaireAnswers.patient_age ??
    questionnaireAnswers.interview_age ??
    null;

  let displaySex =
    patient?.gender ??
    patient?.sex ??
    questionnaireAnswers.biological_sex ??
    null;

  if (
    displaySex !== null &&
    displaySex !== undefined &&
    !isNaN(Number(displaySex))
  ) {
    displaySex =
      Number(displaySex) === 1
        ? "Female"
        : Number(displaySex) === 0
          ? "Male"
          : displaySex;
  }

  // =========================================================
  // DATE
  // =========================================================

  const assessmentDate =
    generatedReport?.generatedAt ||
    assessmentData.xray?.uploadedAt ||
    assessmentData.questionnaire?.completedAt ||
    assessmentData.gait?.completedAt ||
    assessmentData.sensors?.analyzedAt ||
    new Date().toISOString();

  const formatDate = (date) => {
    if (!date) {
      return (
        t("report.date.notAvailable") ||
        "Not Available"
      );
    }

    try {
      return new Date(date).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }
      );
    } catch {
      return String(date);
    }
  };

  // =========================================================
  // AI SUGGESTIONS
  // =========================================================

  const suggestions = useMemo(() => {
    const stored =
      assessmentData.suggestions;

    if (Array.isArray(stored)) {
      return stored;
    }

    if (Array.isArray(stored?.suggestions)) {
      return stored.suggestions;
    }

    if (Array.isArray(generatedReport?.suggestions)) {
      return generatedReport.suggestions;
    }

    // Generate useful suggestions from available findings
    const result = [];

    const gaitText =
      String(gaitPrediction || "").toLowerCase();

    const questionnaireText =
      String(questionnairePrediction || "").toLowerCase();

    const sensorText =
      String(sensorPrediction || "").toLowerCase();

    if (
      gaitText.includes("risk") ||
      gaitText.includes("koa") ||
      gaitText.includes("moderate") ||
      gaitText.includes("high")
    ) {
      result.push(
        "Consider further clinical evaluation of gait and lower-limb movement patterns."
      );
    }

    if (
      questionnaireText.includes("moderate") ||
      questionnaireText.includes("high") ||
      questionnaireText.includes("risk")
    ) {
      result.push(
        "Review reported pain, stiffness and functional limitations during clinical assessment."
      );
    }

    if (
      sensorText.includes("koa") ||
      Number(sensorRisk) > 0.5
    ) {
      result.push(
        "Consider correlating sensor-derived gait measurements with clinical findings."
      );
    }

    if (
      klGrade !== null &&
      Number(klGrade) >= 2
    ) {
      result.push(
        "Radiographic findings should be correlated with symptoms and physical examination."
      );
    }

    if (result.length === 0) {
      result.push(
        "Continue routine clinical assessment and monitor symptoms and mobility over time."
      );
    }

    return result;
  }, [
    assessmentData.suggestions,
    generatedReport,
    gaitPrediction,
    questionnairePrediction,
    sensorPrediction,
    sensorRisk,
    klGrade,
  ]);

  // =========================================================
  // ASSESSMENT INPUTS
  // =========================================================

  const inputs = [
    {
      key: "questionnaire",
      title:
        t("report.inputs.questionnaire.title") ||
        "Questionnaire",
      description:
        t("report.inputs.questionnaire.description") ||
        "Self-reported KOOS/WOMAC symptom evaluation",
      icon: ClipboardList,
      available: Boolean(
        assessmentData.questionnaire
      ),
    },
    {
      key: "gait",
      title:
        t("report.inputs.gait.title") ||
        "Gait Video",
      description:
        t("report.inputs.gait.description") ||
        "Computer vision kinematic gait analysis",
      icon: Video,
      available: Boolean(
        assessmentData.gait
      ),
    },
    {
      key: "xray",
      title:
        t("report.inputs.xray.title") ||
        "X-Ray Image",
      description:
        t("report.inputs.xray.description") ||
        "Radiographic Kellgren-Lawrence classification",
      icon: ScanLine,
      available: Boolean(
        assessmentData.xray
      ),
    },
    {
      key: "sensors",
      title:
        t("report.inputs.sensors.title") ||
        "Sensor Data",
      description:
        t("report.inputs.sensors.description") ||
        "IMU sensor gait cycle measurements",
      icon: Cpu,
      available: Boolean(
        assessmentData.sensors
      ),
    },
  ];

  // =========================================================
  // PRINT
  // =========================================================

  const handlePrint = () => {
    window.print();
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="report-page">

      {/* TOP BAR */}

      <div className="report-topbar no-print">

        <button
          className="back-button"
          onClick={() =>
            navigate(
              `/assessment/${patientId}/results`
            )
          }
        >
          <ArrowLeft size={17} />

          {t("report.actions.backToResults") ||
            "Back to Results"}
        </button>

        <button
          className="secondary-action"
          onClick={handlePrint}
        >
          <Printer size={17} />

          {t("report.actions.print") ||
            "Print Report"}
        </button>

      </div>

      {/* DOCUMENT */}

      <div className="report-document">

        {/* HEADER */}

        <header className="report-header">

          <div className="report-brand">

            <div className="report-brand-icon">
              <Activity size={25} />
            </div>

            <div>
              <div className="report-brand-name">
                KOA Assist
              </div>

              <span>
                {t("report.brand.subtitle") ||
                  "Knee Osteoarthritis Decision Support"}
              </span>
            </div>

          </div>

          <div className="report-title-block">

            <span>
              {t("report.header.eyebrow") ||
                "Clinical Diagnostic Summary"}
            </span>

            <h1>
              {t("report.header.title") ||
                "Patient Assessment Report"}
            </h1>

            <p>
              {t(
                "report.header.assessmentDate"
              ) || "Assessment Date"}{" "}
              :{" "}
              <strong>
                {formatDate(assessmentDate)}
              </strong>
            </p>

          </div>

        </header>

        {/* PATIENT */}

        <section className="report-section">

          <div className="report-section-heading">

            <FileText size={19} />

            <div>
              <h2>
                {t(
                  "report.patientInformation.title"
                ) || "Patient Information"}
              </h2>

              <p>
                {t(
                  "report.patientInformation.description"
                ) ||
                  "Demographic details associated with this record."}
              </p>
            </div>

          </div>

          <div className="report-patient-grid">

            <div>
              <span>
                {t(
                  "report.patientInformation.name"
                ) || "Name"}
              </span>

              <strong>
                {patient?.name ||
                  patient?.patientName ||
                  `Patient #${patientId}`}
              </strong>
            </div>

            <div>
              <span>
                {t(
                  "report.patientInformation.patientId"
                ) || "Patient ID"}
              </span>

              <strong>{patientId}</strong>
            </div>

            <div>
              <span>
                {t(
                  "report.patientInformation.age"
                ) || "Age"}
              </span>

              <strong>
                {displayAge !== null &&
                  displayAge !== undefined &&
                  displayAge !== ""
                  ? `${displayAge} ${t(
                    "report.patientInformation.years"
                  ) || "years"
                  }`
                  : t(
                    "report.patientInformation.notProvided"
                  ) || "Not provided"}
              </strong>
            </div>

            <div>
              <span>
                {t(
                  "report.patientInformation.biologicalSex"
                ) || "Biological Sex"}
              </span>

              <strong>
                {displaySex ||
                  t(
                    "report.patientInformation.notProvided"
                  ) ||
                  "Not provided"}
              </strong>
            </div>

          </div>

        </section>

        {/* INPUTS */}

        <section className="report-section">

          <div className="report-section-heading">

            <Activity size={19} />

            <div>
              <h2>
                {t(
                  "report.assessmentInputs.title"
                ) || "Assessment Inputs"}
              </h2>

              <p>
                {t(
                  "report.assessmentInputs.description"
                ) ||
                  "Data sources submitted for analysis."}
              </p>
            </div>

          </div>

          <div className="report-input-list">

            {inputs.map((input) => {

              const Icon = input.icon;

              return (
                <div
                  key={input.key}
                  className={`report-input ${input.available
                    ? "provided"
                    : "not-provided"
                    }`}
                >

                  <div className="report-input-icon">
                    <Icon size={19} />
                  </div>

                  <div className="report-input-content">

                    <div className="report-input-title">

                      <h3>{input.title}</h3>

                      {input.available ? (
                        <span className="report-provided">
                          <CheckCircle2 size={13} />
                          {t(
                            "report.assessmentInputs.provided"
                          ) || "Provided"}
                        </span>
                      ) : (
                        <span className="report-not-provided">
                          {t(
                            "report.assessmentInputs.notProvided"
                          ) || "Not Provided"}
                        </span>
                      )}

                    </div>

                    <p>{input.description}</p>

                  </div>

                </div>
              );
            })}

          </div>

        </section>

        {/* AI FINDINGS */}

        <section className="report-section">

          <div
            className="report-section-heading"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "11px",
              marginBottom: "20px",
            }}
          >

            <Sparkles
              size={19}
              style={{
                marginTop: "2px",
                flexShrink: 0,
                color: "#475569",
              }}
            />

            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "17px",
                  lineHeight: 1.3,
                  fontWeight: 700,
                  color: "#172033",
                }}
              >
                {t(
                  "report.aiAnalysis.title"
                ) || "AI Model Findings"}
              </h2>

              <p
                style={{
                  margin: "5px 0 0",
                  fontSize: "12px",
                  lineHeight: 1.5,
                  color: "#7b8494",
                }}
              >
                Combined findings from the available assessment modules.
              </p>
            </div>

          </div>


          {/* AI CARDS */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap: "16px",
            }}
          >

            {/* QUESTIONNAIRE */}

            {assessmentData.questionnaire && (

              <div
                style={{
                  minHeight: "125px",
                  padding: "18px 20px",
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: "9px",
                  boxSizing: "border-box",
                }}
              >

                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#64748b",
                  }}
                >
                  Questionnaire Assessment
                </span>

                <strong
                  style={{
                    fontSize: "20px",
                    lineHeight: 1.25,
                    fontWeight: 700,
                    color: "#172033",
                  }}
                >
                  {questionnairePrediction ||
                    "Analysis Available"}
                </strong>

                {questionnaireRisk !== null && (

                  <div
                    style={{
                      marginTop: "3px",
                      paddingTop: "9px",
                      borderTop: "1px solid #eef0f3",
                      fontSize: "12px",
                      color: "#7b8494",
                    }}
                  >
                    OA Risk Score:{" "}
                    <strong
                      style={{
                        color: "#172033",
                        fontWeight: 700,
                      }}
                    >
                      {formatRisk(questionnaireRisk)}
                    </strong>
                  </div>

                )}

              </div>

            )}


            {/* GAIT */}

            {assessmentData.gait && (

              <div
                style={{
                  minHeight: "125px",
                  padding: "18px 20px",
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: "9px",
                  boxSizing: "border-box",
                }}
              >

                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#64748b",
                  }}
                >
                  Gait Analysis
                </span>

                <strong
                  style={{
                    fontSize: "20px",
                    lineHeight: 1.25,
                    fontWeight: 700,
                    color: "#172033",
                  }}
                >
                  {gaitPrediction ||
                    "Analysis Available"}
                </strong>

                {gaitRisk !== null && (

                  <div
                    style={{
                      marginTop: "3px",
                      paddingTop: "9px",
                      borderTop: "1px solid #eef0f3",
                      fontSize: "12px",
                      color: "#7b8494",
                    }}
                  >
                    OA Risk Score:{" "}
                    <strong
                      style={{
                        color: "#172033",
                        fontWeight: 700,
                      }}
                    >
                      {formatRisk(gaitRisk)}
                    </strong>
                  </div>

                )}

              </div>

            )}


            {/* X-RAY */}

            {assessmentData.xray && (

              <div
                style={{
                  minHeight: "125px",
                  padding: "18px 20px",
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: "9px",
                  boxSizing: "border-box",
                }}
              >

                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#64748b",
                  }}
                >
                  Kellgren-Lawrence Severity
                </span>

                <strong
                  style={{
                    fontSize: "20px",
                    lineHeight: 1.25,
                    fontWeight: 700,
                    color: "#172033",
                  }}
                >
                  {klGrade !== null
                    ? typeof klGrade === "number"
                      ? `Grade ${klGrade}`
                      : klGrade
                    : "Analysis Available"}
                </strong>

              </div>

            )}


            {/* SENSOR */}

            {assessmentData.sensors && (

              <div
                style={{
                  minHeight: "125px",
                  padding: "18px 20px",
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: "9px",
                  boxSizing: "border-box",
                }}
              >

                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#64748b",
                  }}
                >
                  Sensor Analysis
                </span>

                <strong
                  style={{
                    fontSize: "20px",
                    lineHeight: 1.25,
                    fontWeight: 700,
                    color: "#172033",
                  }}
                >
                  {sensorPrediction ||
                    "Analysis Available"}
                </strong>

                {sensorRisk !== null && (

                  <div
                    style={{
                      marginTop: "3px",
                      paddingTop: "9px",
                      borderTop: "1px solid #eef0f3",
                      fontSize: "12px",
                      color: "#7b8494",
                    }}
                  >
                    OA Risk Score:{" "}
                    <strong
                      style={{
                        color: "#172033",
                        fontWeight: 700,
                      }}
                    >
                      {formatRisk(sensorRisk)}
                    </strong>
                  </div>

                )}

              </div>

            )}

          </div>


          {/* NO ANALYSIS */}

          {!assessmentData.questionnaire &&
            !assessmentData.gait &&
            !assessmentData.xray &&
            !assessmentData.sensors && (

              <div
                className="report-pending"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  marginTop: "20px",
                  padding: "18px",
                  background: "#fafbfc",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                }}
              >

                <div
                  className="report-pending-icon"
                  style={{
                    width: "40px",
                    height: "40px",
                    minWidth: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "10px",
                    background: "#f8fafc",
                    color: "#64748b",
                  }}
                >
                  <AlertCircle size={23} />
                </div>

                <div>
                  <h3
                    style={{
                      margin: "0 0 4px",
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#172033",
                    }}
                  >
                    No AI analysis available
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      fontSize: "12px",
                      lineHeight: 1.5,
                      color: "#7b8494",
                    }}
                  >
                    Complete at least one assessment module
                    before generating the report.
                  </p>
                </div>

              </div>

            )}

        </section>

        {/* AI SUGGESTIONS */}

        <section className="report-section">

          <div
            className="report-section-heading"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "11px",
              marginBottom: "20px",
            }}
          >

            <Sparkles
              size={19}
              style={{
                marginTop: "2px",
                flexShrink: 0,
                color: "#475569",
              }}
            />

            <div>

              <h2
                style={{
                  margin: 0,
                  fontSize: "17px",
                  lineHeight: 1.3,
                  fontWeight: 700,
                  color: "#172033",
                }}
              >
                AI-Assisted Suggestions
              </h2>

              <p
                style={{
                  margin: "5px 0 0",
                  fontSize: "12px",
                  lineHeight: 1.5,
                  color: "#7b8494",
                }}
              >
                Suggestions generated from the available
                assessment findings.
              </p>

            </div>

          </div>


          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >

            {suggestions.map((suggestion, index) => (

              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "14px 16px",
                  background: "#fafbfc",
                  border: "1px solid #e7eaf0",
                  borderRadius: "10px",
                  color: "#394150",
                  fontSize: "13px",
                  lineHeight: 1.55,
                  boxSizing: "border-box",
                }}
              >

                <div
                  style={{
                    width: "25px",
                    height: "25px",
                    minWidth: "25px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    background: "#f0fdf4",
                  }}
                >
                  <CheckCircle2
                    size={16}
                    style={{
                      color: "#16a34a",
                    }}
                  />
                </div>

                <span
                  style={{
                    flex: 1,
                    paddingTop: "2px",
                    color: "#394150",
                  }}
                >
                  {suggestion}
                </span>

              </div>

            ))}

          </div>

        </section>

        {/* FOOTER */}

        <footer className="report-document-footer">

          <div>
            <strong>KOA Assist</strong>

            <span>
              {t("report.footer.subtitle") ||
                "Clinical Decision Support System"}
            </span>
          </div>

          <div>
            {t(
              "report.patientInformation.patientId"
            ) || "Patient ID"}{" "}
            : {patientId}
          </div>

        </footer>

      </div>

      {/* DISCLAIMER */}

      <div className="report-disclaimer">

        <strong>
          {t("report.disclaimer.title") ||
            "Medical Disclaimer:"}
        </strong>{" "}

        <span>
          {t("report.disclaimer.description") ||
            "This report is generated by an AI assistant intended solely to support clinical decision-making. It does not replace professional medical diagnosis or judgement."}
        </span>

      </div>

    </div>
  );
}

export default Report;