import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
    Activity,
    ArrowLeft,
    CheckCircle2,
    CircleAlert,
    FileSpreadsheet,
    Upload,
    LoaderCircle,
    XCircle,
} from "lucide-react";

import { useLanguage } from "../hooks/useLanguage";

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:8001";

function SensorAnalysis() {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [selectedFile, setSelectedFile] =
        useState(null);

    const [isAnalyzing, setIsAnalyzing] =
        useState(false);

    const [analysisResult, setAnalysisResult] =
        useState(null);

    const [error, setError] =
        useState("");

    /* =========================================================
       REQUIRED ASSESSMENT CHECK
       ========================================================= */

    const questionnaireCompleted = Boolean(
        localStorage.getItem(
            `koaQuestionnaire_${patientId}`
        )
    );

    const gaitCompleted = Boolean(
        localStorage.getItem(
            `koaGaitVideo_${patientId}`
        )
    );

    useEffect(() => {
        if (
            !questionnaireCompleted ||
            !gaitCompleted
        ) {
            navigate(
                `/assessment/new/${patientId}`,
                {
                    replace: true,
                }
            );
        }
    }, [
        questionnaireCompleted,
        gaitCompleted,
        navigate,
        patientId,
    ]);

    /* =========================================================
       FILE SELECTION
       ========================================================= */

    const handleFileChange = (event) => {
        const file =
            event.target.files?.[0];

        setError("");
        setAnalysisResult(null);

        if (!file) {
            setSelectedFile(null);
            return;
        }

        if (
            !file.name
                .toLowerCase()
                .endsWith(".csv")
        ) {
            setSelectedFile(null);

            setError(
                "Please select a CSV file."
            );

            event.target.value = "";
            return;
        }

        setSelectedFile(file);
    };

    /* =========================================================
       REAL SENSOR ML ANALYSIS
       ========================================================= */

    const analyzeSensorData = async () => {
        if (!selectedFile) {
            setError(
                "Please select a CSV file first."
            );
            return;
        }

        setError("");
        setAnalysisResult(null);
        setIsAnalyzing(true);

        try {
            /* -------------------------------------------------
               GET SERVER-SIDE ASSESSMENT ID
               ------------------------------------------------- */

            const storedAssessment =
                JSON.parse(
                    localStorage.getItem(
                        `koaAssessment_${patientId}`
                    ) || "null"
                );

            const assessmentId =
                storedAssessment?.assessmentId ||
                storedAssessment?.id;

            if (!assessmentId) {
                throw new Error(
                    "No assessment ID found for this patient. Please start a new assessment."
                );
            }

            console.log(
                "================================"
            );

            console.log(
                "Starting REAL sensor analysis"
            );

            console.log(
                "Patient ID:",
                patientId
            );

            console.log(
                "Assessment ID:",
                assessmentId
            );

            console.log(
                "CSV:",
                selectedFile.name
            );

            console.log(
                "Calling:",
                `/api/v1/sensors/analyze/${assessmentId}`
            );

            console.log(
                "================================"
            );

            /* -------------------------------------------------
               CREATE FORM DATA
               ------------------------------------------------- */

            const formData =
                new FormData();

            formData.append(
                "file",
                selectedFile
            );

            /* -------------------------------------------------
               REAL SENSOR ML API
               ------------------------------------------------- */

            const response =
                await fetch(
                    `${API_BASE_URL}/api/v1/sensors/analyze/${assessmentId}`,
                    {
                        method: "POST",
                        body: formData,
                    }
                );

            let result;

            try {
                result =
                    await response.json();
            } catch {
                throw new Error(
                    "The sensor server returned an invalid response."
                );
            }

            if (!response.ok) {
                throw new Error(
                    result?.detail ||
                    "Sensor analysis failed."
                );
            }

            /* -------------------------------------------------
               LOG REAL RESULT
               ------------------------------------------------- */

            console.log(
                "================================"
            );

            console.log(
                "REAL SENSOR ANALYSIS RESULT:"
            );

            console.log(result);

            console.log(
                "================================"
            );

            /* -------------------------------------------------
               SAVE RESULT
               ------------------------------------------------- */

            const sensorData = {
                patientId,
                assessmentId,

                fileName:
                    selectedFile.name,

                uploadedAt:
                    new Date().toISOString(),

                status: "analyzed",

                analysisResult:
                    result,

                prediction:
                    result.prediction,

                predictionClass:
                    result.prediction_class,

                oaRiskScore:
                    result.oa_risk_score,

                confidence:
                    result.confidence,

                healthyProbability:
                    result.healthy_probability,

                koaProbability:
                    result.koa_probability,

                samplesReceived:
                    result.samples_received,

                featuresGenerated:
                    result.features_generated,
            };

            localStorage.setItem(
                `koaSensors_${patientId}`,
                JSON.stringify(
                    sensorData
                )
            );

            setAnalysisResult(
                result
            );

            console.log(
                "Sensor analysis result saved successfully."
            );
        } catch (err) {
            console.error(
                "================================"
            );

            console.error(
                "SENSOR ANALYSIS FAILED"
            );

            console.error(err);

            console.error(
                "================================"
            );

            setError(
                err?.message ||
                "Sensor analysis failed. Please try again."
            );
        } finally {
            setIsAnalyzing(false);
        }
    };

    /* =========================================================
       CONTINUE TO ANALYSIS
       ========================================================= */

    const continueToAnalysis = () => {
        navigate(
            `/assessment/${patientId}/analysis`
        );
    };

    /* =========================================================
       RENDER
       ========================================================= */

    return (
        <div className="sensor-page">

            {/* =================================================
                TOP BAR
            ================================================= */}

            <div className="sensor-topbar">

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
                        "sensorAnalysis.actions.backToAssessment"
                    )}
                </button>

                <div className="sensor-patient-id">

                    {t(
                        "sensorAnalysis.patientId"
                    )}:{" "}

                    <strong>
                        {patientId}
                    </strong>

                </div>

            </div>

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="sensor-header">

                <div className="sensor-header-icon">
                    <Activity size={32} />
                </div>

                <div>

                    <div className="page-breadcrumb">
                        {t(
                            "sensorAnalysis.breadcrumb"
                        )}
                    </div>

                    <h1>
                        Sensor Assessment
                    </h1>

                    <p>
                        Upload the CSV file collected from the wearable sensors for AI-based gait and movement analysis.
                    </p>

                </div>

            </div>

            {/* =================================================
                INSTRUCTIONS
            ================================================= */}

            <div className="sensor-instructions">

                <div className="sensor-instruction-icon">
                    <CircleAlert size={20} />
                </div>

                <div>

                    <strong>
                        Sensor CSV Requirements
                    </strong>

                    <p>
                        Upload a CSV containing LB, LF and RF accelerometer and gyroscope data. The system will automatically generate 168 biomechanical features for the trained KOA model.
                    </p>

                </div>

            </div>

            {/* =================================================
                UPLOAD CARD
            ================================================= */}

            <section className="sensor-card">

                <div className="sensor-card-header">

                    <div>

                        <h2>
                            Upload Sensor Data
                        </h2>

                        <p>
                            Select the CSV file recorded during the patient's sensor assessment.
                        </p>

                    </div>

                </div>

                <div
                    className="sensor-upload-area"
                    style={{
                        border:
                            "2px dashed #d1d5db",
                        borderRadius:
                            "12px",
                        padding:
                            "40px 24px",
                        textAlign:
                            "center",
                        marginTop:
                            "20px",
                    }}
                >

                    <FileSpreadsheet
                        size={44}
                        style={{
                            marginBottom:
                                "14px",
                        }}
                    />

                    <h3>
                        Select Sensor CSV
                    </h3>

                    <p>
                        Expected sensor groups:
                        {" "}
                        <strong>
                            LB, LF, RF
                        </strong>
                    </p>

                    <label
                        className="primary-action"
                        style={{
                            display:
                                "inline-flex",
                            alignItems:
                                "center",
                            gap: "8px",
                            cursor:
                                "pointer",
                            marginTop:
                                "12px",
                        }}
                    >

                        <Upload size={18} />

                        Choose CSV File

                        <input
                            type="file"
                            accept=".csv,text/csv"
                            onChange={
                                handleFileChange
                            }
                            style={{
                                display:
                                    "none",
                            }}
                        />

                    </label>

                </div>

                {/* =================================================
                    SELECTED FILE
                ================================================= */}

                {selectedFile && (
                    <div
                        className="analysis-input available"
                        style={{
                            marginTop:
                                "20px",
                        }}
                    >

                        <FileSpreadsheet
                            size={18}
                        />

                        <div>

                            <span>
                                Selected File
                            </span>

                            <small>
                                {
                                    selectedFile.name
                                }
                            </small>

                        </div>

                    </div>
                )}

                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (
                    <div
                        className="analysis-notice"
                        style={{
                            marginTop:
                                "20px",
                        }}
                    >

                        <div className="analysis-notice-icon">
                            <XCircle
                                size={19}
                            />
                        </div>

                        <div>

                            <strong>
                                Sensor Analysis Failed
                            </strong>

                            <p>
                                {error}
                            </p>

                        </div>

                    </div>
                )}

                {/* =================================================
                    RESULT
                ================================================= */}

                {analysisResult && (
                    <div
                        className="analysis-notice analysis-success-notice"
                        style={{
                            marginTop:
                                "20px",
                        }}
                    >

                        <div className="analysis-notice-icon">
                            <CheckCircle2
                                size={19}
                            />
                        </div>

                        <div>

                            <strong>
                                Sensor Analysis Completed
                            </strong>

                            <p>
                                Prediction:{" "}
                                <strong>
                                    {
                                        analysisResult.prediction
                                    }
                                </strong>
                                {" • "}
                                KOA Probability:{" "}
                                {(
                                    Number(
                                        analysisResult.koa_probability ||
                                        0
                                    ) * 100
                                ).toFixed(1)}
                                %
                            </p>

                        </div>

                    </div>
                )}

                {/* =================================================
                    CONTROLS
                ================================================= */}

                <div
                    className="sensor-controls"
                    style={{
                        marginTop:
                            "24px",
                    }}
                >

                    {!analysisResult && (
                        <button
                            type="button"
                            className="primary-action"
                            onClick={
                                analyzeSensorData
                            }
                            disabled={
                                !selectedFile ||
                                isAnalyzing
                            }
                        >

                            {isAnalyzing ? (
                                <>
                                    <LoaderCircle
                                        size={18}
                                        className="analysis-spinner"
                                    />

                                    Analyzing Sensor Data...
                                </>
                            ) : (
                                <>
                                    <Activity
                                        size={18}
                                    />

                                    Analyze Sensor Data
                                </>
                            )}

                        </button>
                    )}

                    {analysisResult && (
                        <button
                            type="button"
                            className="primary-action"
                            onClick={
                                continueToAnalysis
                            }
                        >

                            <CheckCircle2
                                size={18}
                            />

                            Continue to Analysis

                        </button>
                    )}

                </div>

            </section>

            {/* =================================================
                FOOTER
            ================================================= */}

            <div className="sensor-footer-note">

                <Activity size={16} />

                <span>
                    Sensor data is processed using the trained KOA hardware machine-learning model.
                </span>

            </div>

        </div>
    );
}

export default SensorAnalysis;

