import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Check,
    CircleAlert,
    FileImage,
    ScanLine,
    Upload,
    X,
} from "lucide-react";

import { useLanguage } from "../hooks/useLanguage";
import { analyzeXray } from "../services/api";

function XrayAnalysis() {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const fileInputRef = useRef(null);

    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFileSelect = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setError("");

        if (!file.type.startsWith("image/")) {
            setError(t("xrayAnalysis.errors.invalidFile") || "Please upload a valid image file.");
            return;
        }

        const url = URL.createObjectURL(file);

        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        setSelectedFile(file);
        setPreviewUrl(url);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        const file = event.dataTransfer.files?.[0];
        if (!file) return;

        setError("");

        if (!file.type.startsWith("image/")) {
            setError(t("xrayAnalysis.errors.invalidFile") || "Please upload a valid image file.");
            return;
        }

        const url = URL.createObjectURL(file);

        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        setSelectedFile(file);
        setPreviewUrl(url);
    };

    const handleRemove = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        setSelectedFile(null);
        setPreviewUrl(null);
        setError("");

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async () => {
        if (!selectedFile) {
            setError(t("xrayAnalysis.errors.noFile") || "Please select an X-Ray image to upload.");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            // Send file to FastAPI endpoint: POST /api/v1/xray/analyze/{assessment_id}
            const result = await analyzeXray(patientId, selectedFile);

            // Save response in local storage for the final report stage
            localStorage.setItem(
                `koaXray_${patientId}`,
                JSON.stringify({
                    patientId,
                    fileName: selectedFile.name,
                    fileSize: selectedFile.size,
                    uploadedAt: new Date().toISOString(),
                    analysisResult: result,
                    status: "completed",
                })
            );

            // Navigate to the next assessment step
            navigate(`/assessment/${patientId}/additional`);
        } catch (err) {
            console.error("X-Ray Analysis Error:", err);
            
            // Fallback strategy: allow user to continue if backend service is offline
            localStorage.setItem(
                `koaXray_${patientId}`,
                JSON.stringify({
                    patientId,
                    fileName: selectedFile.name,
                    status: "pending_offline",
                })
            );
            
            // Show error message to user
            setError(err.message || "Failed to analyze X-Ray. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="xray-page">
            {/* TOP BAR */}
            <div className="xray-topbar">
                <button
                    type="button"
                    className="back-button"
                    onClick={() => navigate(`/assessment/${patientId}/gait`)}
                >
                    <ArrowLeft size={17} />
                    {t("xrayAnalysis.actions.backToGait") || "Back to Gait Analysis"}
                </button>

                <div className="xray-assessment-label">
                    <ScanLine size={17} />
                    {t("xrayAnalysis.assessmentLabel") || "Knee OA Assessment"}
                </div>
            </div>

            {/* HEADER */}
            <div className="xray-header">
                <div>
                    <span className="xray-eyebrow">
                        {t("xrayAnalysis.eyebrow") || "Imaging Step"}
                    </span>
                    <h1>{t("xrayAnalysis.title") || "Knee X-Ray Analysis"}</h1>
                    <p>
                        {t("xrayAnalysis.description") ||
                            "Upload a clear knee joint X-ray image for Kellgren-Lawrence grading."}
                    </p>
                </div>

                <div className="xray-step-indicator">
                    <span>{t("xrayAnalysis.stepIndicator.label") || "Step"}</span>
                    <strong>{t("xrayAnalysis.stepIndicator.value") || "03 of 04"}</strong>
                </div>
            </div>

            {/* INSTRUCTIONS */}
            <div className="xray-instructions">
                <div className="xray-instruction-header">
                    <div className="xray-instruction-icon">
                        <CircleAlert size={20} />
                    </div>
                    <div>
                        <h2>{t("xrayAnalysis.instructions.title") || "Upload Guidelines"}</h2>
                        <p>
                            {t("xrayAnalysis.instructions.description") ||
                                "Ensure high image clarity to achieve precise machine learning output."}
                        </p>
                    </div>
                </div>

                <div className="xray-instruction-list">
                    <div>
                        <span>01</span>
                        <p>{t("xrayAnalysis.instructions.items.0") || "Use weight-bearing AP view knee X-rays."}</p>
                    </div>
                    <div>
                        <span>02</span>
                        <p>{t("xrayAnalysis.instructions.items.1") || "Ensure clear visibility of joint space."}</p>
                    </div>
                    <div>
                        <span>03</span>
                        <p>{t("xrayAnalysis.instructions.items.2") || "Avoid cropped or blurry images."}</p>
                    </div>
                    <div>
                        <span>04</span>
                        <p>{t("xrayAnalysis.instructions.items.3") || "Supported formats: JPG, PNG, DICOM-exported images."}</p>
                    </div>
                </div>
            </div>

            {/* UPLOAD / PREVIEW CARD */}
            <div className="xray-card">
                <div className="xray-card-header">
                    <div>
                        <h2>
                            {selectedFile
                                ? t("xrayAnalysis.card.previewTitle") || "X-Ray Preview"
                                : t("xrayAnalysis.card.uploadTitle") || "Upload X-Ray File"}
                        </h2>
                        <p>
                            {selectedFile
                                ? t("xrayAnalysis.card.previewDescription") || "Verify image clarity before running analysis."
                                : t("xrayAnalysis.card.uploadDescription") || "Drag and drop your file below or click to browse."}
                        </p>
                    </div>

                    {selectedFile && (
                        <div className="xray-file-status">
                            <Check size={15} />
                            {t("xrayAnalysis.card.imageSelected") || "Ready for Upload"}
                        </div>
                    )}
                </div>

                {!selectedFile ? (
                    <div
                        className="xray-upload-area"
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            hidden
                        />
                        <div className="xray-upload-icon">
                            <Upload size={28} />
                        </div>
                        <h3>{t("xrayAnalysis.uploadArea.title") || "Select X-Ray Image"}</h3>
                        <p>{t("xrayAnalysis.uploadArea.description") || "Click to browse files or drag and drop"}</p>
                        <span>{t("xrayAnalysis.uploadArea.formats") || "JPG, PNG up to 15MB"}</span>
                    </div>
                ) : (
                    <div className="xray-preview-area">
                        <div className="xray-image-wrapper">
                            <img
                                src={previewUrl}
                                alt={t("xrayAnalysis.uploadArea.alt") || "Knee X-Ray Preview"}
                                className="xray-preview-image"
                            />
                        </div>

                        <div className="xray-file-details">
                            <div className="xray-file-icon">
                                <FileImage size={19} />
                            </div>
                            <div className="xray-file-info">
                                <strong>{selectedFile.name}</strong>
                                <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                            </div>
                            <button
                                type="button"
                                className="xray-remove-button"
                                onClick={handleRemove}
                            >
                                <X size={17} />
                                {t("xrayAnalysis.actions.remove") || "Remove"}
                            </button>
                        </div>
                    </div>
                )}

                {/* ERROR ALERT */}
                {error && (
                    <div className="xray-error">
                        <CircleAlert size={17} />
                        {error}
                    </div>
                )}

                {/* ACTIONS */}
                <div className="xray-actions">
                    {!selectedFile ? (
                        <button
                            type="button"
                            className="primary-action"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload size={17} />
                            {t("xrayAnalysis.actions.choose") || "Choose File"}
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="primary-action"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            <Check size={17} />
                            {isSubmitting
                                ? t("xrayAnalysis.actions.saving") || "Analyzing Image..."
                                : t("xrayAnalysis.actions.useXray") || "Submit for Analysis"}
                        </button>
                    )}
                </div>
            </div>

            {/* STATUS PIPELINE */}
            <div className="xray-status">
                <div className={`xray-status-item ${selectedFile ? "active" : ""}`}>
                    <span />
                    {t("xrayAnalysis.status.imageSelected") || "Image Selected"}
                </div>
                <div className={`xray-status-item ${isSubmitting ? "active" : ""}`}>
                    <span />
                    {t("xrayAnalysis.status.aiAnalysis") || "KL-Grade Classification"}
                </div>
                <div className="xray-status-item">
                    <span />
                    {t("xrayAnalysis.status.results") || "Report Ready"}
                </div>
            </div>

            {/* FOOTER */}
            <div className="xray-footer-note">
                <ScanLine size={17} />
                <p>
                    {t("xrayAnalysis.footer") ||
                        "AI predictions are provided to assist clinical diagnosis and require physician verification."}
                </p>
            </div>
        </div>
    );
}

export default XrayAnalysis;