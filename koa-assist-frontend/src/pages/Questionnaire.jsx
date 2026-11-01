import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    ArrowRight,
    Check,
    PlayCircle,
    X,
    Loader2,
} from "lucide-react";

import { useLanguage } from "../hooks/useLanguage";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

const LIKERT_OPTIONS = [
    { labelKey: "0", value: 0 },
    { labelKey: "1", value: 1 },
    { labelKey: "2", value: 2 },
    { labelKey: "3", value: 3 },
    { labelKey: "4", value: 4 },
];

const sections = [
    {
        id: "general",
        number: 1,
        title: "General Information",
        description: "Basic information required for the assessment.",
        questions: [
            {
                id: "biological_sex",
                text: "Biological Sex",
                type: "sex",
                required: true,
                demoVideo: null,
            },
            {
                id: "patient_age",
                text: "Patient Age",
                type: "age",
                required: true,
                demoVideo: null,
            },
        ],
    },
    {
        id: "right_knee_pain",
        number: 2,
        title: "Right Knee Pain Assessment",
        description: "Rate the level of pain experienced in the right knee.",
        questions: [
            {
                id: "right_pain_flat_ground",
                text: "How much pain do you feel while walking on flat ground?",
                type: "likert",
                required: true,
                demoVideo: null,
            },
            {
                id: "right_pain_stairs",
                text: "How much pain do you feel while climbing up or down stairs?",
                type: "likert",
                required: true,
                demoVideo: null,
            },
            {
                id: "right_pain_night",
                text: "How much pain do you feel at night while in bed?",
                type: "likert",
                required: true,
                demoVideo: null,
            },
            {
                id: "right_pain_rest",
                text: "How much pain do you feel while sitting or lying down?",
                type: "likert",
                required: true,
                demoVideo: null,
            },
            {
                id: "right_pain_standing",
                text: "How much pain do you feel while standing upright?",
                type: "likert",
                required: true,
                demoVideo: null,
            },
        ],
    },
    {
        id: "left_knee_pain",
        number: 3,
        title: "Left Knee Pain Assessment",
        description: "Rate the level of pain experienced in the left knee.",
        questions: [
            {
                id: "left_pain_flat_ground",
                text: "How much pain do you feel while walking on flat ground?",
                type: "likert",
                required: true,
                demoVideo: null,
            },
            {
                id: "left_pain_stairs",
                text: "How much pain do you feel while climbing up or down stairs?",
                type: "likert",
                required: true,
                demoVideo: null,
            },
            {
                id: "left_pain_night",
                text: "How much pain do you feel at night while in bed?",
                type: "likert",
                required: true,
                demoVideo: null,
            },
            {
                id: "left_pain_rest",
                text: "How much pain do you feel while sitting or lying down?",
                type: "likert",
                required: true,
                demoVideo: null,
            },
            {
                id: "left_pain_standing",
                text: "How much pain do you feel while standing upright?",
                type: "likert",
                required: true,
                demoVideo: null,
            },
        ],
    },
    {
        id: "stiffness",
        number: 4,
        title: "Joint Stiffness Assessment",
        description: "Rate the severity of stiffness in each knee.",
        questions: [
            {
                id: "right_stiffness_morning",
                text: "How severe is your right knee joint stiffness right after waking up in the morning?",
                type: "likert",
                required: true,
                demoVideo: "/videos/morning-stiffness.mp4",
            },
            {
                id: "right_stiffness_rest",
                text: "How severe is your right knee joint stiffness after sitting or resting later in the day?",
                type: "likert",
                required: true,
                demoVideo: null,
            },
            {
                id: "left_stiffness_morning",
                text: "How severe is your left knee joint stiffness right after waking up in the morning?",
                type: "likert",
                required: true,
                demoVideo: "/videos/morning-stiffness.mp4",
            },
            {
                id: "left_stiffness_rest",
                text: "How severe is your left knee joint stiffness after sitting or resting later in the day?",
                type: "likert",
                required: true,
                demoVideo: null,
            },
        ],
    },
    {
        id: "physical_difficulty",
        number: 5,
        title: "Daily Physical Difficulty",
        description: "Rate the difficulty experienced during everyday activities.",
        questions: [
            {
                id: "difficulty_stairs",
                text: "Difficulty climbing or descending stairs?",
                type: "likert",
                required: true,
                demoVideo: null,
            },
            {
                id: "difficulty_rising",
                text: "Difficulty rising from a seated position?",
                type: "likert",
                required: true,
                demoVideo: "/videos/rising-from-chair.mp4",
            },
            {
                id: "difficulty_bending",
                text: "Difficulty bending down to the floor or picking up an object?",
                type: "likert",
                required: true,
                demoVideo: "/videos/bending-down.mp4",
            },
            {
                id: "difficulty_vehicle",
                text: "Difficulty getting in or out of a vehicle / bus?",
                type: "likert",
                required: true,
                demoVideo: "/videos/vehicle-movement.mp4",
            },
            {
                id: "difficulty_heavy_work",
                text: "Difficulty doing heavy household work or carrying loads?",
                type: "likert",
                required: true,
                demoVideo: null,
            },
        ],
    },
];

function Questionnaire() {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [currentSection, setCurrentSection] = useState(0);
    const [answers, setAnswers] = useState({});
    const [videoUrl, setVideoUrl] = useState(null);
    const [videoTitle, setVideoTitle] = useState("");
    const [showValidation, setShowValidation] = useState(false);

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [apiError, setApiError] = useState(null);

    const section = sections[currentSection];
    const totalSections = sections.length;

    const progress = useMemo(() => {
        return ((currentSection + 1) / totalSections) * 100;
    }, [currentSection, totalSections]);

    // Restore cached responses
    useEffect(() => {
        const localData = localStorage.getItem(`koaQuestionnaire_${patientId}`);

        if (localData) {
            try {
                const parsed = JSON.parse(localData);

                if (parsed?.answers) {
                    setAnswers(parsed.answers);
                }
            } catch (e) {
                console.error("Failed to parse local questionnaire data", e);
            }
        }

        setIsLoading(false);
    }, [patientId]);

    // Sync state changes with localStorage on update
    const updateAnswer = useCallback(
        (questionId, value) => {
            const formattedValue =
                questionId === "patient_age" && value !== ""
                    ? parseInt(value, 10)
                    : value;

            setAnswers((prevAnswers) => {
                const nextAnswers = {
                    ...prevAnswers,
                    [questionId]: formattedValue,
                };

                // Auto-persist partial progress
                localStorage.setItem(
                    `koaQuestionnaire_${patientId}`,
                    JSON.stringify({
                        patientId,
                        answers: nextAnswers,
                    })
                );

                return nextAnswers;
            });

            setShowValidation(false);
            setApiError(null);
        },
        [patientId]
    );

    const isSectionComplete = useCallback(() => {
        return section.questions.every(
            (question) =>
                answers[question.id] !== undefined &&
                answers[question.id] !== ""
        );
    }, [section.questions, answers]);

    const handleNext = async () => {
        if (!isSectionComplete()) {
            setShowValidation(true);
            return;
        }

        if (currentSection < totalSections - 1) {
            setCurrentSection((current) => current + 1);
            setShowValidation(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        try {
            setIsSubmitting(true);
            setApiError(null);

            // Parse patient ID
            const parsedPatientId =
                parseInt(String(patientId).replace(/\D/g, ""), 10) || 0;

            // 0 = Male, 1 = Female
            const parsedSex =
                Number(answers.biological_sex) === 1 ? 1 : 0;

            const payload = {
                patient_id: parsedPatientId,
                sex: parsedSex,
                age: Number(answers.patient_age) || 0,

                right_knee: {
                    p1_flat_walking: Number(
                        answers.right_pain_flat_ground ?? 0
                    ),
                    p2_stairs: Number(
                        answers.right_pain_stairs ?? 0
                    ),
                    p3_night_bed: Number(
                        answers.right_pain_night ?? 0
                    ),
                    p4_sitting_lying: Number(
                        answers.right_pain_rest ?? 0
                    ),
                    p5_standing: Number(
                        answers.right_pain_standing ?? 0
                    ),
                    s1_morning_stiffness: Number(
                        answers.right_stiffness_morning ?? 0
                    ),
                    s2_rest_stiffness: Number(
                        answers.right_stiffness_rest ?? 0
                    ),
                },

                left_knee: {
                    p1_flat_walking: Number(
                        answers.left_pain_flat_ground ?? 0
                    ),
                    p2_stairs: Number(
                        answers.left_pain_stairs ?? 0
                    ),
                    p3_night_bed: Number(
                        answers.left_pain_night ?? 0
                    ),
                    p4_sitting_lying: Number(
                        answers.left_pain_rest ?? 0
                    ),
                    p5_standing: Number(
                        answers.left_pain_standing ?? 0
                    ),
                    s1_morning_stiffness: Number(
                        answers.left_stiffness_morning ?? 0
                    ),
                    s2_rest_stiffness: Number(
                        answers.left_stiffness_rest ?? 0
                    ),
                },

                physical_function: {
                    d1_stairs: Number(
                        answers.difficulty_stairs ?? 0
                    ),
                    d2_rising_seated: Number(
                        answers.difficulty_rising ?? 0
                    ),
                    d3_bending_floor: Number(
                        answers.difficulty_bending ?? 0
                    ),
                    d4_vehicle: Number(
                        answers.difficulty_vehicle ?? 0
                    ),
                    d5_heavy_work: Number(
                        answers.difficulty_heavy_work ?? 0
                    ),
                },
            };

            console.log(
                "Sending questionnaire payload:",
                payload
            );

            const response = await fetch(
                `${API_BASE_URL}/api/v1/questionnaire/analyze`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem(
                            "authToken"
                        )}`,
                    },
                    body: JSON.stringify(payload),
                }
            );

            if (!response.ok) {
                const errorData = await response
                    .json()
                    .catch(() => ({}));

                if (Array.isArray(errorData.detail)) {
                    const message = errorData.detail
                        .map(
                            (err) =>
                                `${
                                    err.loc
                                        ? err.loc.join(" -> ")
                                        : "Field"
                                }: ${err.msg}`
                        )
                        .join(" | ");

                    throw new Error(message);
                }

                throw new Error(
                    errorData.detail ||
                        "Failed to submit questionnaire assessment data."
                );
            }

            // IMPORTANT:
            // Read the actual ML model response from the backend.
            const questionnaireResult = await response.json();

            console.log(
                "Questionnaire ML result:",
                questionnaireResult
            );

            // IMPORTANT:
            // Save the actual backend/PKL result together with the answers.
            localStorage.setItem(
                `koaQuestionnaire_${patientId}`,
                JSON.stringify({
                    patientId,
                    answers,
                    completedAt: new Date().toISOString(),
                    status: "analyzed",
                    analysisResult: questionnaireResult,
                })
            );

            navigate(`/assessment/${patientId}/gait`);
        } catch (err) {
            console.error(
                "Backend submission error:",
                err
            );

            setApiError(
                typeof err.message === "string"
                    ? err.message
                    : "Failed to submit assessment."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePrevious = () => {
        if (currentSection > 0) {
            setCurrentSection((current) => current - 1);
            setShowValidation(false);
            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });
        } else {
            navigate(`/assessment/new/${patientId}`);
        }
    };

    const openVideo = (question) => {
        if (!question.demoVideo) return;

        setVideoTitle(getQuestionText(question));
        setVideoUrl(question.demoVideo);
    };

    const getSectionTitle = () =>
        t(`questionnaire.sections.${section.id}.title`);

    const getSectionDescription = () =>
        t(`questionnaire.sections.${section.id}.description`);

    const getQuestionText = (question) =>
        t(`questionnaire.questions.${question.id}.text`);

    if (isLoading) {
        return (
            <div
                className="loading-screen"
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "60vh",
                }}
            >
                <Loader2
                    className="animate-spin"
                    size={32}
                />
            </div>
        );
    }

    return (
        <div className="questionnaire-page">
            {/* TOP NAVIGATION */}
            <div className="questionnaire-topbar">
                <button
                    type="button"
                    className="back-button"
                    onClick={() =>
                        navigate(`/assessment/new/${patientId}`)
                    }
                >
                    <ArrowLeft size={17} />
                    {t(
                        "questionnaire.actions.backToAssessment"
                    )}
                </button>

                <span className="assessment-label">
                    {t("questionnaire.assessmentLabel")}
                </span>
            </div>

            {/* PROGRESS */}
            <div className="questionnaire-progress">
                <div className="progress-header">
                    <div>
                        <span className="progress-label">
                            {t(
                                "questionnaire.progress.label"
                            )}
                        </span>

                        <h1>{getSectionTitle()}</h1>
                    </div>

                    <span className="section-count">
                        {t(
                            "questionnaire.progress.section"
                        )}{" "}
                        {currentSection + 1}{" "}
                        {t("questionnaire.progress.of")}{" "}
                        {totalSections}
                    </span>
                </div>

                <div className="progress-track">
                    <div
                        className="progress-fill"
                        style={{
                            width: `${progress}%`,
                        }}
                    />
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="questionnaire-container">
                <div className="section-introduction">
                    <h2>{getSectionTitle()}</h2>
                    <p>{getSectionDescription()}</p>
                </div>

                {/* QUESTIONS */}
                <div className="question-list">
                    {section.questions.map(
                        (question, index) => (
                            <div
                                className="question-card"
                                key={question.id}
                            >
                                <div className="question-number">
                                    {index + 1}
                                </div>

                                <div className="question-content">
                                    <div
                                        className="question-heading"
                                        style={{
                                            display: "flex",
                                            justifyContent:
                                                "space-between",
                                            alignItems:
                                                "flex-start",
                                            gap: "1rem",
                                            width: "100%",
                                        }}
                                    >
                                        <div className="question-title-area">
                                            <h3>
                                                {getQuestionText(
                                                    question
                                                )}
                                            </h3>

                                            {question.required && (
                                                <span className="required-text">
                                                    {t(
                                                        "questionnaire.required"
                                                    )}
                                                </span>
                                            )}
                                        </div>

                                        {question.demoVideo && (
                                            <button
                                                type="button"
                                                className="demo-button"
                                                onClick={() =>
                                                    openVideo(
                                                        question
                                                    )
                                                }
                                            >
                                                <PlayCircle
                                                    size={17}
                                                />

                                                {t(
                                                    "questionnaire.actions.viewDemonstration"
                                                )}
                                            </button>
                                        )}
                                    </div>

                                    {/* SEX QUESTION */}
                                    {question.type ===
                                        "sex" && (
                                        <div className="sex-options">
                                            <button
                                                type="button"
                                                className={`sex-option ${
                                                    answers[
                                                        question.id
                                                    ] === 0
                                                        ? "selected"
                                                        : ""
                                                }`}
                                                onClick={() =>
                                                    updateAnswer(
                                                        question.id,
                                                        0
                                                    )
                                                }
                                            >
                                                <span>
                                                    {t(
                                                        "questionnaire.options.male"
                                                    )}
                                                </span>
                                            </button>

                                            <button
                                                type="button"
                                                className={`sex-option ${
                                                    answers[
                                                        question.id
                                                    ] === 1
                                                        ? "selected"
                                                        : ""
                                                }`}
                                                onClick={() =>
                                                    updateAnswer(
                                                        question.id,
                                                        1
                                                    )
                                                }
                                            >
                                                <span>
                                                    {t(
                                                        "questionnaire.options.female"
                                                    )}
                                                </span>
                                            </button>
                                        </div>
                                    )}

                                    {/* AGE QUESTION */}
                                    {question.type ===
                                        "age" && (
                                        <div className="age-input-wrapper">
                                            <input
                                                type="number"
                                                min="1"
                                                max="120"
                                                placeholder={t(
                                                    "questionnaire.age.placeholder"
                                                )}
                                                value={
                                                    answers[
                                                        question.id
                                                    ] ?? ""
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    updateAnswer(
                                                        question.id,
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                }
                                            />

                                            <span>
                                                {t(
                                                    "questionnaire.age.years"
                                                )}
                                            </span>
                                        </div>
                                    )}

                                    {/* LIKERT QUESTION */}
                                    {question.type ===
                                        "likert" && (
                                        <div className="likert-options">
                                            {LIKERT_OPTIONS.map(
                                                (option) => (
                                                    <button
                                                        type="button"
                                                        key={
                                                            option.value
                                                        }
                                                        className={`likert-option ${
                                                            answers[
                                                                question
                                                                    .id
                                                            ] ===
                                                            option.value
                                                                ? "selected"
                                                                : ""
                                                        }`}
                                                        onClick={() =>
                                                            updateAnswer(
                                                                question.id,
                                                                option.value
                                                            )
                                                        }
                                                    >
                                                        <span className="likert-value">
                                                            {
                                                                option.value
                                                            }
                                                        </span>

                                                        <span className="likert-label">
                                                            {t(
                                                                `questionnaire.likert.${option.labelKey}`
                                                            )}
                                                        </span>
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    )}
                </div>

                {/* VALIDATION AND API ERRORS */}
                {showValidation && (
                    <div className="questionnaire-validation">
                        {t(
                            "questionnaire.validation.required"
                        )}
                    </div>
                )}

                {apiError && (
                    <div className="questionnaire-validation api-error">
                        {apiError}
                    </div>
                )}

                {/* NAVIGATION */}
                <div className="questionnaire-navigation">
                    <button
                        type="button"
                        className="secondary-action"
                        onClick={handlePrevious}
                        disabled={isSubmitting}
                    >
                        <ArrowLeft size={17} />

                        {currentSection === 0
                            ? t(
                                  "questionnaire.actions.back"
                              )
                            : t(
                                  "questionnaire.actions.previous"
                              )}
                    </button>

                    <div className="navigation-progress">
                        {currentSection + 1} /{" "}
                        {totalSections}
                    </div>

                    <button
                        type="button"
                        className="primary-action"
                        onClick={handleNext}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <Loader2
                                className="animate-spin"
                                size={17}
                            />
                        ) : (
                            <>
                                {currentSection ===
                                totalSections - 1
                                    ? t(
                                          "questionnaire.actions.complete"
                                      )
                                    : t(
                                          "questionnaire.actions.saveContinue"
                                      )}

                                {currentSection ===
                                totalSections - 1 ? (
                                    <Check size={17} />
                                ) : (
                                    <ArrowRight
                                        size={17}
                                    />
                                )}
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* VIDEO MODAL */}
            {videoUrl && (
                <div
                    className="video-modal-overlay"
                    onClick={() =>
                        setVideoUrl(null)
                    }
                >
                    <div
                        className="video-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <div className="video-modal-header">
                            <div>
                                <span>
                                    {t(
                                        "questionnaire.video.title"
                                    )}
                                </span>

                                <h2>{videoTitle}</h2>
                            </div>

                            <button
                                type="button"
                                className="video-close"
                                onClick={() =>
                                    setVideoUrl(null)
                                }
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="video-container">
                            <video
                                src={videoUrl}
                                controls
                                playsInline
                                autoPlay
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Questionnaire;

