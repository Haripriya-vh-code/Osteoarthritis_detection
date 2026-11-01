import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    Activity,
    ArrowLeft,
    CheckCircle2,
    CircleAlert,
    ClipboardList,
    LoaderCircle,
    ScanLine,
    Video,
    Cpu,
} from "lucide-react";

import { useLanguage } from "../hooks/useLanguage";
import { analyzeGaitVideo } from "../services/api";

function Analysis() {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();

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
       ANALYSIS STATE
       ========================================================= */

    const [currentStep, setCurrentStep] =
        useState(0);

    const [analysisComplete, setAnalysisComplete] =
        useState(false);

    const [analysisStarted, setAnalysisStarted] =
        useState(false);

    const [analysisError, setAnalysisError] =
        useState("");

    const [gaitAnalysisResult, setGaitAnalysisResult] =
        useState(null);

    const [sensorAnalysisResult, setSensorAnalysisResult] =
        useState(null);

    /* =========================================================
       PREVENT DUPLICATE GAIT API CALLS
       ========================================================= */

    const gaitAnalysisStartedRef =
        useRef(false);

    /* =========================================================
       DETERMINE AVAILABLE ASSESSMENT INPUTS
       ========================================================= */

    const availableInputs = useMemo(() => {
        const questionnaire =
            localStorage.getItem(
                `koaQuestionnaire_${patientId}`
            );

        const gait =
            localStorage.getItem(
                `koaGaitVideo_${patientId}`
            );

        const xray =
            localStorage.getItem(
                `koaXray_${patientId}`
            );

        const sensors =
            localStorage.getItem(
                `koaSensors_${patientId}`
            );

        return {
            questionnaire:
                Boolean(questionnaire),

            gait:
                Boolean(gait),

            xray:
                Boolean(xray),

            sensors:
                Boolean(sensors),
        };
    }, [patientId]);

    /* =========================================================
       BUILD ANALYSIS PIPELINE
       ========================================================= */

    const steps = useMemo(() => {
        const dynamicSteps = [];

        if (availableInputs.questionnaire) {
            dynamicSteps.push({
                id: "questionnaire",

                title: t(
                    "analysis.steps.questionnaire.title"
                ),

                description: t(
                    "analysis.steps.questionnaire.description"
                ),

                icon: ClipboardList,

                required: true,
            });
        }

        if (availableInputs.gait) {
            dynamicSteps.push({
                id: "gait",

                title: t(
                    "analysis.steps.gait.title"
                ),

                description: t(
                    "analysis.steps.gait.description"
                ),

                icon: Video,

                required: true,
            });
        }

        if (availableInputs.xray) {
            dynamicSteps.push({
                id: "xray",

                title: t(
                    "analysis.steps.xray.title"
                ),

                description: t(
                    "analysis.steps.xray.description"
                ),

                icon: ScanLine,

                required: false,
            });
        }

        if (availableInputs.sensors) {
            dynamicSteps.push({
                id: "sensors",

                title: t(
                    "analysis.steps.sensors.title"
                ),

                description: t(
                    "analysis.steps.sensors.description"
                ),

                icon: Cpu,

                required: false,
            });
        }

        dynamicSteps.push({
            id: "fusion",

            title: t(
                "analysis.steps.fusion.title"
            ),

            description: t(
                "analysis.steps.fusion.description"
            ),

            icon: Activity,

            required: true,
        });

        return dynamicSteps;
    }, [availableInputs, t]);

    /* =========================================================
       RUN ANALYSIS
       ========================================================= */

    useEffect(() => {
        if (
            !questionnaireCompleted ||
            !gaitCompleted ||
            gaitAnalysisStartedRef.current ||
            steps.length === 0
        ) {
            return;
        }

        gaitAnalysisStartedRef.current = true;

        const runAnalysis = async () => {
            setAnalysisStarted(true);
            setAnalysisError("");
            setAnalysisComplete(false);

            const questionnaireIndex =
                steps.findIndex(
                    (step) =>
                        step.id ===
                        "questionnaire"
                );

            const gaitIndex =
                steps.findIndex(
                    (step) =>
                        step.id === "gait"
                );

            const xrayIndex =
                steps.findIndex(
                    (step) =>
                        step.id === "xray"
                );

            const sensorsIndex =
                steps.findIndex(
                    (step) =>
                        step.id === "sensors"
                );

            const fusionIndex =
                steps.findIndex(
                    (step) =>
                        step.id === "fusion"
                );

            try {
                /* =================================================
                   QUESTIONNAIRE
                   ================================================= */

                if (
                    questionnaireIndex !== -1
                ) {
                    setCurrentStep(
                        questionnaireIndex
                    );

                    await new Promise(
                        (resolve) =>
                            setTimeout(
                                resolve,
                                300
                            )
                    );
                }

                /* =================================================
                   REAL GAIT ANALYSIS
                   ================================================= */

                if (gaitIndex !== -1) {
                    setCurrentStep(
                        gaitIndex
                    );

                    const storedAssessment =
                        JSON.parse(
                            localStorage.getItem(
                                `koaAssessment_${patientId}`
                            ) || "null"
                        );

                    const storedGaitData =
                        JSON.parse(
                            localStorage.getItem(
                                `koaGaitVideo_${patientId}`
                            ) || "null"
                        );

                    const assessmentId =
                        storedAssessment?.assessmentId ||
                        storedAssessment?.id ||
                        storedGaitData?.assessmentId;

                    if (!assessmentId) {
                        throw new Error(
                            "No assessment ID found for this patient."
                        );
                    }

                    console.log(
                        "================================"
                    );

                    console.log(
                        "Starting REAL gait analysis"
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
                        "================================"
                    );

                    const result =
                        await analyzeGaitVideo(
                            assessmentId
                        );

                    console.log(
                        "REAL GAIT ANALYSIS RESULT:",
                        result
                    );

                    setGaitAnalysisResult(
                        result
                    );

                    const existingGaitData =
                        JSON.parse(
                            localStorage.getItem(
                                `koaGaitVideo_${patientId}`
                            ) || "{}"
                        );

                    const updatedGaitData = {
                        ...existingGaitData,

                        status: "analyzed",

                        analysisResult:
                            result,

                        prediction:
                            result.prediction,

                        oaRiskScore:
                            result.oa_risk_score,

                        confidence:
                            result.confidence,

                        biomechanicalFeatures:
                            result.biomechanical_features,

                        analyzedAt:
                            new Date().toISOString(),
                    };

                    localStorage.setItem(
                        `koaGaitVideo_${patientId}`,
                        JSON.stringify(
                            updatedGaitData
                        )
                    );

                    const nextStepAfterGait =
                        gaitIndex + 1;

                    if (
                        nextStepAfterGait <
                        steps.length
                    ) {
                        setCurrentStep(
                            nextStepAfterGait
                        );
                    }
                }

                /* =================================================
                   OPTIONAL X-RAY
                   ================================================= */

                if (
                    xrayIndex !== -1
                ) {
                    setCurrentStep(
                        xrayIndex
                    );

                    await new Promise(
                        (resolve) =>
                            setTimeout(
                                resolve,
                                700
                            )
                    );

                    if (
                        xrayIndex + 1 <
                        steps.length
                    ) {
                        setCurrentStep(
                            xrayIndex + 1
                        );
                    }
                }

                /* =================================================
                   REAL SENSOR RESULT
                   IMPORTANT:
                   Sensor ML has ALREADY been executed on the
                   SensorAnalysis page.
                   We only load its saved result here.
                   ================================================= */

                if (
                    sensorsIndex !== -1
                ) {
                    setCurrentStep(
                        sensorsIndex
                    );

                    console.log(
                        "Loading saved sensor ML result..."
                    );

                    const storedSensorData =
                        JSON.parse(
                            localStorage.getItem(
                                `koaSensors_${patientId}`
                            ) || "null"
                        );

                    const storedSensorResult =
                        storedSensorData?.analysisResult;

                    if (
                        !storedSensorResult
                    ) {
                        throw new Error(
                            "Sensor assessment was selected, but no sensor ML result was found."
                        );
                    }

                    console.log(
                        "REAL SENSOR ANALYSIS RESULT:",
                        storedSensorResult
                    );

                    setSensorAnalysisResult(
                        storedSensorResult
                    );

                    await new Promise(
                        (resolve) =>
                            setTimeout(
                                resolve,
                                700
                            )
                    );

                    if (
                        sensorsIndex + 1 <
                        steps.length
                    ) {
                        setCurrentStep(
                            sensorsIndex + 1
                        );
                    }
                }

                /* =================================================
                   MULTIMODAL FUSION
                   ================================================= */

                if (
                    fusionIndex !== -1
                ) {
                    setCurrentStep(
                        fusionIndex
                    );

                    console.log(
                        "Multimodal fusion started."
                    );

                    await new Promise(
                        (resolve) =>
                            setTimeout(
                                resolve,
                                1000
                            )
                    );
                }

                /* =================================================
                   COMPLETE
                   ================================================= */

                setCurrentStep(
                    steps.length - 1
                );

                setAnalysisComplete(
                    true
                );

                setAnalysisStarted(
                    false
                );

                console.log(
                    "================================"
                );

                console.log(
                    "Analysis completed successfully."
                );

                console.log(
                    "================================"
                );

            } catch (error) {
                console.error(
                    "================================"
                );

                console.error(
                    "ANALYSIS FAILED"
                );

                console.error(error);

                console.error(
                    "================================"
                );

                setAnalysisError(
                    error?.message ||
                    "Analysis failed. Please try again."
                );

                setAnalysisStarted(
                    false
                );

                gaitAnalysisStartedRef.current =
                    false;
            }
        };

        runAnalysis();

    }, [
        questionnaireCompleted,
        gaitCompleted,
        patientId,
        steps,
    ]);

    /* =========================================================
       PROGRESS
       ========================================================= */

    const progressPercentage =
        steps.length > 0
            ? analysisComplete
                ? 100
                : Math.min(
                    100,
                    ((currentStep + 1) /
                        steps.length) *
                    100
                )
            : 0;

    /* =========================================================
       PROVIDED MODALITIES
       ========================================================= */

    const providedCount = [
        availableInputs.questionnaire,
        availableInputs.gait,
        availableInputs.xray,
        availableInputs.sensors,
    ].filter(Boolean).length;

    /* =========================================================
       RENDER
       ========================================================= */

    return (
        <div className="analysis-page">

            {/* =================================================
                TOP BAR
            ================================================= */}

            <div className="analysis-topbar">

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
                        "analysis.actions.backToAdditional"
                    )}
                </button>

                <div className="analysis-patient">

                    {t(
                        "analysis.patientId"
                    )}:{" "}

                    <strong>
                        {patientId}
                    </strong>

                </div>

            </div>

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="analysis-header">

                <div className="analysis-header-icon">
                    <Activity size={31} />
                </div>

                <div>

                    <div className="page-breadcrumb">
                        {t(
                            "analysis.breadcrumb"
                        )}
                    </div>

                    <h1>
                        {t(
                            "analysis.title"
                        )}
                    </h1>

                    <p>
                        {t(
                            "analysis.description"
                        )}
                    </p>

                </div>

            </div>

            {/* =================================================
                REQUIRED STATUS
            ================================================= */}

            <div className="analysis-required-status">

                <div className="analysis-required-title">

                    <CheckCircle2 size={17} />

                    <strong>
                        {t(
                            "analysis.required.title"
                        )}
                    </strong>

                </div>

                <p>
                    {t(
                        "analysis.required.description"
                    )}
                </p>

            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {analysisError && (
                <div className="analysis-notice">

                    <div className="analysis-notice-icon">
                        <CircleAlert size={19} />
                    </div>

                    <div>

                        <strong>
                            Analysis failed
                        </strong>

                        <p>
                            {analysisError}
                        </p>

                    </div>

                </div>
            )}

            {/* =================================================
                PROCESSING NOTICE
            ================================================= */}

            {!analysisComplete &&
                !analysisError && (
                    <div className="analysis-notice">

                        <div className="analysis-notice-icon">
                            <CircleAlert size={19} />
                        </div>

                        <div>

                            <strong>
                                {t(
                                    "analysis.progressNotice.title"
                                )}
                            </strong>

                            <p>
                                {t(
                                    "analysis.progressNotice.description"
                                )}
                            </p>

                        </div>

                    </div>
                )}

            {/* =================================================
                COMPLETE NOTICE
            ================================================= */}

            {analysisComplete && (
                <div className="analysis-notice analysis-success-notice">

                    <div className="analysis-notice-icon">
                        <CheckCircle2 size={19} />
                    </div>

                    <div>

                        <strong>
                            {t(
                                "analysis.completeNotice.title"
                            )}
                        </strong>

                        <p>
                            {t(
                                "analysis.completeNotice.description"
                            )}
                        </p>

                    </div>

                </div>
            )}

            {/* =================================================
                ANALYSIS CARD
            ================================================= */}

            <section className="analysis-card">

                <div className="analysis-card-header">

                    <div>

                        <h2>
                            {t(
                                "analysis.processing.title"
                            )}
                        </h2>

                        <p>
                            {t(
                                "analysis.processing.description"
                            )}
                        </p>

                    </div>

                    {!analysisComplete &&
                        !analysisError && (
                            <div className="analysis-processing-label">

                                <LoaderCircle
                                    size={15}
                                />

                                {t(
                                    "analysis.status.processing"
                                )}

                            </div>
                        )}

                    {analysisComplete && (
                        <div className="analysis-complete-label">

                            <CheckCircle2
                                size={15}
                            />

                            {t(
                                "analysis.status.complete"
                            )}

                        </div>
                    )}

                </div>

                {/* PROGRESS */}

                <div className="analysis-progress-line">

                    <div
                        className="analysis-progress-fill"
                        style={{
                            width: `${progressPercentage}%`,
                        }}
                    />

                </div>

                {/* STEPS */}

                <div className="analysis-steps">

                    {steps.map(
                        (step, index) => {

                            const Icon =
                                step.icon;

                            const isCompleted =
                                analysisComplete ||
                                index <
                                currentStep;

                            const isCurrent =
                                !analysisComplete &&
                                !analysisError &&
                                index ===
                                currentStep;

                            return (
                                <div
                                    className={`analysis-step ${step.required
                                            ? "required-step"
                                            : "optional-step"
                                        } ${isCompleted
                                            ? "completed"
                                            : ""
                                        } ${isCurrent
                                            ? "current"
                                            : ""
                                        }`}
                                    key={
                                        step.id
                                    }
                                >

                                    <div className="analysis-step-icon">

                                        {isCompleted ? (
                                            <CheckCircle2
                                                size={
                                                    20
                                                }
                                            />
                                        ) : isCurrent ? (
                                            <LoaderCircle
                                                size={
                                                    20
                                                }
                                                className="analysis-spinner"
                                            />
                                        ) : (
                                            <Icon
                                                size={
                                                    20
                                                }
                                            />
                                        )}

                                    </div>

                                    <div className="analysis-step-content">

                                        <div className="analysis-step-title">

                                            {
                                                step.title
                                            }

                                            {step.required && (
                                                <span className="analysis-required-label">
                                                    {t(
                                                        "analysis.labels.required"
                                                    )}
                                                </span>
                                            )}

                                            {!step.required && (
                                                <span className="analysis-optional-label">
                                                    {t(
                                                        "analysis.labels.optional"
                                                    )}
                                                </span>
                                            )}

                                        </div>

                                        <div className="analysis-step-description">

                                            {isCompleted
                                                ? t(
                                                    "analysis.stepStatus.completedDescription"
                                                )
                                                : isCurrent
                                                    ? step.description
                                                    : t(
                                                        "analysis.stepStatus.waiting"
                                                    )}

                                        </div>

                                    </div>

                                    <div className="analysis-step-status">

                                        {isCompleted && (
                                            <span>
                                                {t(
                                                    "analysis.stepStatus.completed"
                                                )}
                                            </span>
                                        )}

                                        {isCurrent && (
                                            <span>
                                                {t(
                                                    "analysis.stepStatus.processing"
                                                )}
                                            </span>
                                        )}

                                        {!isCompleted &&
                                            !isCurrent && (
                                                <span>
                                                    {t(
                                                        "analysis.stepStatus.waiting"
                                                    )}
                                                </span>
                                            )}

                                    </div>

                                </div>
                            );
                        }
                    )}

                </div>

            </section>


            {/* =================================================
                INPUT SUMMARY
            ================================================= */}

            <section className="analysis-input-summary">

                <div className="analysis-input-summary-header">

                    <div>

                        <h2>
                            {t(
                                "analysis.inputs.title"
                            )}
                        </h2>

                        <p>
                            {t(
                                "analysis.inputs.description"
                            )}
                        </p>

                    </div>

                    <span className="analysis-input-count">

                        {providedCount}{" "}

                        {t(
                            "analysis.inputs.of"
                        )}{" "}

                        4{" "}

                        {t(
                            "analysis.inputs.provided"
                        )}

                    </span>

                </div>

                <div className="analysis-inputs">

                    {/* QUESTIONNAIRE */}

                    <div
                        className={`analysis-input ${availableInputs.questionnaire
                                ? "available"
                                : "unavailable"
                            }`}
                    >

                        {availableInputs.questionnaire ? (
                            <CheckCircle2 size={17} />
                        ) : (
                            <ClipboardList size={17} />
                        )}

                        <div>

                            <span>
                                {t(
                                    "analysis.inputs.questionnaire"
                                )}
                            </span>

                            <small>
                                {t(
                                    "analysis.labels.required"
                                )}
                            </small>

                        </div>

                    </div>

                    {/* GAIT */}

                    <div
                        className={`analysis-input ${availableInputs.gait
                                ? "available"
                                : "unavailable"
                            }`}
                    >

                        {availableInputs.gait ? (
                            <CheckCircle2 size={17} />
                        ) : (
                            <Video size={17} />
                        )}

                        <div>

                            <span>
                                {t(
                                    "analysis.inputs.gait"
                                )}
                            </span>

                            <small>
                                {t(
                                    "analysis.labels.required"
                                )}
                            </small>

                        </div>

                    </div>

                    {/* X-RAY */}

                    <div
                        className={`analysis-input ${availableInputs.xray
                                ? "available"
                                : "unavailable"
                            }`}
                    >

                        {availableInputs.xray ? (
                            <CheckCircle2 size={17} />
                        ) : (
                            <ScanLine size={17} />
                        )}

                        <div>

                            <span>
                                {t(
                                    "analysis.inputs.xray"
                                )}
                            </span>

                            <small>

                                {availableInputs.xray
                                    ? t(
                                        "analysis.inputs.provided"
                                    )
                                    : t(
                                        "analysis.inputs.optionalNotProvided"
                                    )}

                            </small>

                        </div>

                    </div>

                    {/* SENSORS */}

                    <div
                        className={`analysis-input ${availableInputs.sensors
                                ? "available"
                                : "unavailable"
                            }`}
                    >

                        {availableInputs.sensors ? (
                            <CheckCircle2 size={17} />
                        ) : (
                            <Cpu size={17} />
                        )}

                        <div>

                            <span>
                                {t(
                                    "analysis.inputs.sensors"
                                )}
                            </span>

                            <small>

                                {availableInputs.sensors
                                    ? t(
                                        "analysis.inputs.provided"
                                    )
                                    : t(
                                        "analysis.inputs.optionalNotProvided"
                                    )}

                            </small>

                        </div>

                    </div>

                </div>

            </section>

            {/* =================================================
                RESULT READY
            ================================================= */}

            {analysisComplete && (
                <section className="analysis-result-ready">

                    <div className="analysis-ready-icon">

                        <CheckCircle2
                            size={25}
                        />

                    </div>

                    <div>

                        <h2>
                            {t(
                                "analysis.resultReady.title"
                            )}
                        </h2>

                        <p>
                            {t(
                                "analysis.resultReady.description"
                            )}
                        </p>

                    </div>

                    <button
                        type="button"
                        className="primary-action"
                        onClick={() =>
                            navigate(
                                `/assessment/${patientId}/results`
                            )
                        }
                    >
                        {t(
                            "analysis.resultReady.button"
                        )}
                    </button>

                </section>
            )}

            {/* =================================================
                FOOTER
            ================================================= */}

            <div className="analysis-footer">

                <Activity size={16} />

                <span>
                    {t(
                        "analysis.footer"
                    )}
                </span>

            </div>

        </div>
    );
}

export default Analysis;
