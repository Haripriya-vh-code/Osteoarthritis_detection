import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Camera,
    Check,
    CircleAlert,
    Play,
    RotateCcw,
    Square,
    Video,
    Upload,
} from "lucide-react";

import { useLanguage } from "../hooks/useLanguage";
import { uploadGaitVideo } from "../services/api";

function VideoAnalysis() {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const videoRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const chunksRef = useRef([]);
    const fileInputRef = useRef(null);

    const [cameraActive, setCameraActive] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordedVideo, setRecordedVideo] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // =========================================================
    // STOP CAMERA
    // =========================================================

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => {
                track.stop();
            });

            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setCameraActive(false);
    };

    // =========================================================
    // START CAMERA
    // =========================================================

    const startCamera = async () => {
        setError("");

        try {
            if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia
            ) {
                throw new Error("Camera API is not supported.");
            }

            const stream =
                await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: "environment",
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                    audio: false,
                });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            setCameraActive(true);
        } catch (cameraError) {
            console.error(
                "Camera access error:",
                cameraError
            );

            setError(
                t("videoAnalysis.errors.cameraAccess") ||
                "Camera access denied or unreadable. Try uploading a video file instead."
            );
        }
    };

    // =========================================================
    // START RECORDING
    // =========================================================

    const startRecording = () => {
        if (!streamRef.current) {
            setError(
                t("videoAnalysis.errors.startCameraFirst") ||
                "Please start the camera first."
            );
            return;
        }

        setError("");
        chunksRef.current = [];

        let options = {};

        if (typeof MediaRecorder !== "undefined") {
            if (
                MediaRecorder.isTypeSupported(
                    "video/webm;codecs=vp9"
                )
            ) {
                options = {
                    mimeType: "video/webm;codecs=vp9",
                };
            } else if (
                MediaRecorder.isTypeSupported("video/webm")
            ) {
                options = {
                    mimeType: "video/webm",
                };
            } else if (
                MediaRecorder.isTypeSupported("video/mp4")
            ) {
                options = {
                    mimeType: "video/mp4",
                };
            }
        }

        try {
            const recorder = new MediaRecorder(
                streamRef.current,
                options
            );

            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (event) => {
                if (
                    event.data &&
                    event.data.size > 0
                ) {
                    chunksRef.current.push(
                        event.data
                    );
                }
            };

            recorder.onstop = () => {
                const mimeType =
                    recorder.mimeType ||
                    "video/webm";

                const blob = new Blob(
                    chunksRef.current,
                    {
                        type: mimeType,
                    }
                );

                const videoUrl =
                    URL.createObjectURL(blob);

                setRecordedVideo({
                    blob,
                    url: videoUrl,
                    fileName: mimeType.includes("mp4")
                        ? "gait_recording.mp4"
                        : "gait_recording.webm",
                });

                stopCamera();
            };

            recorder.start();

            setRecordingTime(0);
            setIsRecording(true);
        } catch (err) {
            console.error(
                "MediaRecorder failure:",
                err
            );

            setError(
                "Failed to initialize video recording on this browser."
            );
        }
    };

    // =========================================================
    // STOP RECORDING
    // =========================================================

    const stopRecording = () => {
        if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state !==
            "inactive"
        ) {
            mediaRecorderRef.current.stop();
        }

        setIsRecording(false);
    };

    // =========================================================
    // HANDLE FILE UPLOAD / LOCAL VIDEO SELECTION
    // =========================================================

    const handleFileUpload = (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        if (recordedVideo?.url) {
            URL.revokeObjectURL(
                recordedVideo.url
            );
        }

        const videoUrl =
            URL.createObjectURL(file);

        setRecordedVideo({
            blob: file,
            url: videoUrl,
            fileName: file.name,
        });

        setRecordingTime(0);

        stopCamera();
        setError("");

        // Allows selecting the same file again later
        event.target.value = "";
    };

    // =========================================================
    // RECORDING TIMER
    // =========================================================

    useEffect(() => {
        if (!isRecording) return undefined;

        const timer = setInterval(() => {
            setRecordingTime(
                (current) => current + 1
            );
        }, 1000);

        return () => clearInterval(timer);
    }, [isRecording]);

    // =========================================================
    // FORMAT TIME
    // =========================================================

    const formatTime = (seconds) => {
        const minutes = Math.floor(
            seconds / 60
        );

        const remainingSeconds =
            seconds % 60;

        return `${String(minutes).padStart(
            2,
            "0"
        )}:${String(remainingSeconds).padStart(
            2,
            "0"
        )}`;
    };

    // =========================================================
    // RETAKE
    // =========================================================

    const handleRetake = () => {
        if (recordedVideo?.url) {
            URL.revokeObjectURL(
                recordedVideo.url
            );
        }

        setRecordedVideo(null);
        setRecordingTime(0);
        setError("");

        startCamera();
    };

    // =========================================================
    // USE VIDEO
    //
    // IMPORTANT:
    // This ONLY uploads the video.
    //
    // It does NOT:
    // - run YOLO
    // - extract gait features
    // - load Random Forest
    // - calculate OA prediction
    //
    // Real ML analysis happens later in Analysis.jsx.
    // =========================================================

    const handleUseVideo = async () => {
        if (!recordedVideo?.blob) {
            setError("Please record or select a video first.");
            return;
        }

        // Camera recordings must be at least 3 seconds.
        if (
            recordingTime > 0 &&
            recordingTime < 3
        ) {
            setError(
                "Recording is too short. Please record at least 3 seconds of video."
            );
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            // -------------------------------------------------
            // Get numeric assessment/patient ID
            // -------------------------------------------------

            const storedAssessment = JSON.parse(
                localStorage.getItem(
                    `koaAssessment_${patientId}`
                ) || "null"
            );

            const assessmentId =
                storedAssessment?.assessmentId;

            if (!assessmentId) {
                throw new Error(
                    "No assessment ID found for this patient. Please start a new assessment."
                );
            }

            console.log("================================");
            console.log("GAIT VIDEO UPLOAD");
            console.log("Patient ID:", patientId);
            console.log("Assessment ID:", assessmentId);
            console.log("================================");

            // -------------------------------------------------
            // UPLOAD ONLY
            //
            // This calls:
            //
            // POST /api/v1/video/upload/{assessmentId}
            //
            // It does NOT call /video/analyze.
            // -------------------------------------------------

            const uploadResult =
                await uploadGaitVideo(
                    assessmentId,
                    recordedVideo.blob
                );

            console.log(
                "Gait video uploaded successfully:",
                uploadResult
            );

            // -------------------------------------------------
            // Save upload information locally
            //
            // No ML result is stored here because analysis
            // has not happened yet.
            // -------------------------------------------------

            const gaitPayload = {
                patientId,
                assessmentId,
                completedAt:
                    new Date().toISOString(),
                durationSeconds:
                    recordingTime,
                status: "uploaded",
                videoPath:
                    uploadResult.video_path,
            };

            localStorage.setItem(
                `koaGaitVideo_${patientId}`,
                JSON.stringify(gaitPayload)
            );

            // -------------------------------------------------
            // Move to Additional Assessment
            // -------------------------------------------------

            navigate(
                `/assessment/${patientId}/additional`
            );
        } catch (err) {
            console.error(
                "Failed to upload gait video:",
                err
            );

            setError(
                err.message ||
                "Failed to upload video to backend server."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    // =========================================================
    // CLEANUP
    // =========================================================

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current
                    .getTracks()
                    .forEach((track) => {
                        track.stop();
                    });

                streamRef.current = null;
            }

            if (recordedVideo?.url) {
                URL.revokeObjectURL(
                    recordedVideo.url
                );
            }
        };
    }, []);

    // =========================================================
    // UI
    // =========================================================

    return (
        <div className="gait-page">

            {/* =================================================
                TOP BAR
            ================================================= */}

            <div className="gait-topbar">

                <button
                    type="button"
                    className="back-button"
                    onClick={() =>
                        navigate(
                            `/assessment/new/${patientId}`
                        )
                    }
                >
                    <ArrowLeft size={17} />

                    {t(
                        "videoAnalysis.actions.backToAssessment"
                    ) || "Back"}
                </button>

                <div className="gait-assessment-label">

                    <Video size={17} />

                    {t(
                        "videoAnalysis.assessmentLabel"
                    ) || "Video Gait Analysis"}

                </div>

            </div>

            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="gait-header">

                <div>

                    <span className="gait-eyebrow">
                        {t(
                            "videoAnalysis.eyebrow"
                        ) || "Step Assessment"}
                    </span>

                    <h1>
                        {t(
                            "videoAnalysis.title"
                        ) || "Gait Video Recording"}
                    </h1>

                    <p>
                        {t(
                            "videoAnalysis.description"
                        ) ||
                            "Record or upload gait analysis video."}
                    </p>

                </div>

                <div className="gait-step-indicator">

                    <span>
                        {t(
                            "videoAnalysis.stepIndicator.label"
                        ) || "Step"}
                    </span>

                    <strong>
                        {t(
                            "videoAnalysis.stepIndicator.value"
                        ) || "2 of 3"}
                    </strong>

                </div>

            </div>

            {/* =================================================
                INSTRUCTIONS
            ================================================= */}

            <div className="gait-instructions">

                <div className="gait-instruction-header">

                    <div className="gait-instruction-icon">
                        <CircleAlert size={20} />
                    </div>

                    <div>

                        <h2>
                            {t(
                                "videoAnalysis.instructions.title"
                            ) ||
                                "Recording Guidelines"}
                        </h2>

                        <p>
                            {t(
                                "videoAnalysis.instructions.description"
                            ) ||
                                "Follow these rules for accurate analysis:"}
                        </p>

                    </div>

                </div>

                <div className="gait-instruction-list">

                    <div>
                        <span>01</span>

                        <p>
                            {t(
                                "videoAnalysis.instructions.items.0"
                            ) ||
                                "Ensure bright lighting and a clear background."}
                        </p>
                    </div>

                    <div>
                        <span>02</span>

                        <p>
                            {t(
                                "videoAnalysis.instructions.items.1"
                            ) ||
                                "Keep full body visible throughout the recording."}
                        </p>
                    </div>

                    <div>
                        <span>03</span>

                        <p>
                            {t(
                                "videoAnalysis.instructions.items.2"
                            ) ||
                                "Walk at a normal natural pace."}
                        </p>
                    </div>

                    <div>
                        <span>04</span>

                        <p>
                            {t(
                                "videoAnalysis.instructions.items.3"
                            ) ||
                                "Record continuously for at least 3-5 seconds."}
                        </p>
                    </div>

                </div>

            </div>

            {/* =================================================
                CAMERA / VIDEO
            ================================================= */}

            <div className="gait-capture-card">

                <div className="gait-capture-header">

                    <div>

                        <h2>
                            {recordedVideo
                                ? t(
                                    "videoAnalysis.capture.recordedTitle"
                                ) ||
                                "Video Preview"
                                : t(
                                    "videoAnalysis.capture.cameraTitle"
                                ) ||
                                "Camera Viewfinder"}
                        </h2>

                        <p>
                            {recordedVideo
                                ? t(
                                    "videoAnalysis.capture.recordedDescription"
                                ) ||
                                "Review your recorded or uploaded video."
                                : t(
                                    "videoAnalysis.capture.cameraDescription"
                                ) ||
                                "Position camera to capture complete gait pattern."}
                        </p>

                    </div>

                    {isRecording && (
                        <div className="recording-indicator">

                            <span className="recording-dot" />

                            {t(
                                "videoAnalysis.recording.rec"
                            ) || "REC"}

                            <strong>
                                {formatTime(
                                    recordingTime
                                )}
                            </strong>

                        </div>
                    )}

                </div>

                <div className="gait-video-wrapper">

                    {!recordedVideo ? (
                        <video
                            ref={videoRef}
                            className="gait-video"
                            autoPlay
                            muted
                            playsInline
                        />
                    ) : (
                        <video
                            className="gait-video"
                            src={recordedVideo.url}
                            controls
                            playsInline
                        />
                    )}

                    {!cameraActive &&
                        !recordedVideo && (
                            <div className="camera-placeholder">

                                <div className="camera-placeholder-icon">
                                    <Camera size={34} />
                                </div>

                                <h3>
                                    {t(
                                        "videoAnalysis.cameraPlaceholder.title"
                                    ) ||
                                        "Camera Inactive"}
                                </h3>

                                <p>
                                    {t(
                                        "videoAnalysis.cameraPlaceholder.description"
                                    ) ||
                                        "Start camera or select a local video file."}
                                </p>

                            </div>
                        )}

                    {isRecording && (
                        <div className="recording-overlay">

                            <span className="recording-dot" />

                            {t(
                                "videoAnalysis.recording.recording"
                            ) ||
                                "Recording..."}

                        </div>
                    )}

                </div>

                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (
                    <div className="gait-error">

                        <CircleAlert size={17} />

                        {error}

                    </div>
                )}

                {/* =================================================
                    CONTROLS
                ================================================= */}

                <div className="gait-controls">

                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="video/*"
                        onChange={
                            handleFileUpload
                        }
                        style={{
                            display: "none",
                        }}
                    />

                    {/* START CAMERA / UPLOAD */}

                    {!recordedVideo &&
                        !cameraActive && (
                            <div
                                className="gait-action-group"
                                style={{
                                    display: "flex",
                                    gap: "12px",
                                }}
                            >

                                <button
                                    type="button"
                                    className="primary-action gait-main-button"
                                    onClick={
                                        startCamera
                                    }
                                >
                                    <Camera size={18} />

                                    {t(
                                        "videoAnalysis.actions.startCamera"
                                    ) ||
                                        "Start Camera"}
                                </button>

                                <button
                                    type="button"
                                    className="secondary-action"
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                >
                                    <Upload size={18} />

                                    Upload File
                                </button>

                            </div>
                        )}

                    {/* START RECORDING */}

                    {cameraActive &&
                        !isRecording && (
                            <button
                                type="button"
                                className="primary-action gait-record-button"
                                onClick={
                                    startRecording
                                }
                            >
                                <Play size={17} />

                                {t(
                                    "videoAnalysis.actions.startRecording"
                                ) ||
                                    "Start Recording"}
                            </button>
                        )}

                    {/* STOP RECORDING */}

                    {isRecording && (
                        <button
                            type="button"
                            className="stop-record-button"
                            onClick={
                                stopRecording
                            }
                        >
                            <Square size={16} />

                            {t(
                                "videoAnalysis.actions.stopRecording"
                            ) ||
                                "Stop Recording"}
                        </button>
                    )}

                    {/* VIDEO READY */}

                    {recordedVideo && (
                        <div className="recorded-video-actions">

                            <button
                                type="button"
                                className="secondary-action"
                                onClick={
                                    handleRetake
                                }
                                disabled={
                                    isSubmitting
                                }
                            >
                                <RotateCcw
                                    size={17}
                                />

                                {t(
                                    "videoAnalysis.actions.retake"
                                ) ||
                                    "Retake"}
                            </button>

                            <button
                                type="button"
                                className="primary-action"
                                onClick={
                                    handleUseVideo
                                }
                                disabled={
                                    isSubmitting
                                }
                            >
                                <Check size={17} />

                                {isSubmitting
                                    ? "Saving..."
                                    : t(
                                        "videoAnalysis.actions.useVideo"
                                    ) ||
                                    "Use Video"}
                            </button>

                        </div>
                    )}

                </div>

            </div>

            {/* =================================================
                CAPTURE STATUS
            ================================================= */}

            <div className="gait-status">

                <div
                    className={
                        cameraActive
                            ? "status-item active"
                            : "status-item"
                    }
                >
                    <span />

                    {t(
                        "videoAnalysis.status.camera"
                    ) || "Camera Active"}
                </div>

                <div
                    className={
                        isRecording
                            ? "status-item active"
                            : "status-item"
                    }
                >
                    <span />

                    {t(
                        "videoAnalysis.status.recording"
                    ) || "Recording"}
                </div>

                <div
                    className={
                        recordedVideo
                            ? "status-item active"
                            : "status-item"
                    }
                >
                    <span />

                    {t(
                        "videoAnalysis.status.videoReady"
                    ) || "Video Ready"}
                </div>

            </div>

            {/* =================================================
                FOOTER
            ================================================= */}

            <div className="gait-footer-note">

                <Upload size={17} />

                <p>
                    {t(
                        "videoAnalysis.footerNote"
                    ) ||
                        "Video will be safely processed on backend."}
                </p>

            </div>

        </div>
    );
}

export default VideoAnalysis;

