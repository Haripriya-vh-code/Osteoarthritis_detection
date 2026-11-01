import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    UserRound,
    ClipboardPlus,
} from "lucide-react";

import { useLanguage } from "../hooks/useLanguage";

const API_BASE_URL = "http://127.0.0.1:8001/api/v1";

function PatientProfile() {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPatient = async () => {
            if (!patientId) {
                setError("Patient ID is missing.");
                setLoading(false);
                return;
            }

            try {
                const token =
                    localStorage.getItem("token") ||
                    localStorage.getItem("authToken");

                const response = await fetch(
                    `${API_BASE_URL}/patients/${patientId}`,
                    {
                        headers: {
                            "Content-Type": "application/json",
                            ...(token
                                ? {
                                      Authorization: `Bearer ${token}`,
                                  }
                                : {}),
                        },
                    }
                );

                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error("Patient not found");
                    }

                    if (response.status === 401) {
                        throw new Error("Unauthorized. Please log in again.");
                    }

                    throw new Error("Failed to load patient");
                }

                const data = await response.json();

                // Convert database sex value to display value
                const formattedPatient = {
                    patientId: String(data.id),
                    name: data.name || `Patient #${data.id}`,
                    age: data.age,
                    gender:
                        data.sex === 1
                            ? "Female"
                            : data.sex === 0
                              ? "Male"
                              : null,
                    phone: data.phone || null,
                    email: data.email || null,
                };

                setPatient(formattedPatient);
                setError(null);
            } catch (err) {
                console.error("Error loading patient:", err);
                setError(err.message || "Failed to load patient");
                setPatient(null);
            } finally {
                setLoading(false);
            }
        };

        fetchPatient();
    }, [patientId]);

    // Loading
    if (loading) {
        return (
            <div className="patients-page">
                <button
                    className="back-button"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft size={17} />
                    {t("patientProfile.actions.back") || "Back to Patients"}
                </button>

                <div className="patients-empty-state">
                    <p>Loading patient...</p>
                </div>
            </div>
        );
    }

    // Patient not found / error
    if (!patient) {
        return (
            <div className="patients-page">
                <button
                    className="back-button"
                    onClick={() => navigate("-1")}
                >
                    <ArrowLeft size={17} />
                    {t("patientProfile.actions.back") || "Back to Patients"}
                </button>

                <div className="patients-empty-state">
                    <div className="empty-icon">
                        <UserRound size={30} />
                    </div>

                    <h2>
                        {t("patientProfile.notFound.title") ||
                            "Patient Not Found"}
                    </h2>

                    <p>
                        {error ||
                            t("patientProfile.notFound.description") ||
                            "The requested patient record could not be found."}
                    </p>

                    <button
                        className="secondary-action"
                        onClick={() => navigate("-1")}
                    >
                        {t("patientProfile.actions.return") ||
                            "Return to Patient List"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="patients-page">
            {/* Back button */}
            <button
                className="back-button"
                onClick={() => navigate("-1")}
            >
                <ArrowLeft size={17} />
                {t("patientProfile.actions.back") || "Back"}
            </button>

            {/* Patient Header */}
            <div className="profile-header">
                <div className="profile-avatar">
                    <UserRound size={30} />
                </div>

                <div>
                    <div className="page-breadcrumb">
                        KOA Assist /{" "}
                        {t("navigation.patients") || "Patients"} /{" "}
                        {t("patientProfile.breadcrumb") || "Patient Profile"}
                    </div>

                    <h1>{patient.name}</h1>

                    <span className="profile-id">
                        {t("patientProfile.patientId") || "Patient ID"}:{" "}
                        {patient.patientId}
                    </span>
                </div>

                <button
                    className="primary-action profile-assessment-button"
                    onClick={() =>
                        navigate(`/assessment/new/${patient.patientId}`)
                    }
                >
                    <ClipboardPlus size={18} />
                    {t("patients.actions.startAssessment") ||
                        "Start Assessment"}
                </button>
            </div>

            {/* Profile Content */}
            <div className="profile-grid">
                {/* Patient Information */}
                <div className="profile-card">
                    <h2>
                        {t("patientProfile.information.title") ||
                            "Patient Information"}
                    </h2>

                    <div className="profile-details">
                        <div>
                            <span>
                                {t("patientProfile.information.age") || "Age"}
                            </span>

                            <strong>
                                {patient.age != null
                                    ? `${patient.age} ${
                                          t(
                                              "patientProfile.information.years"
                                          ) || "years"
                                      }`
                                    : t(
                                          "patientProfile.information.notProvided"
                                      ) || "Not provided"}
                            </strong>
                        </div>

                        <div>
                            <span>
                                {t("patientProfile.information.gender") ||
                                    "Gender"}
                            </span>

                            <strong>
                                {patient.gender === "Female"
                                    ? t("patients.gender.female") || "Female"
                                    : patient.gender === "Male"
                                      ? t("patients.gender.male") || "Male"
                                      : t(
                                            "patientProfile.information.notProvided"
                                        ) || "Not provided"}
                            </strong>
                        </div>

                        <div>
                            <span>
                                {t("patientProfile.information.phone") ||
                                    "Phone"}
                            </span>

                            <strong>
                                {patient.phone ||
                                    t(
                                        "patientProfile.information.notProvided"
                                    ) ||
                                    "Not provided"}
                            </strong>
                        </div>

                        <div>
                            <span>
                                {t("patientProfile.information.email") ||
                                    "Email"}
                            </span>

                            <strong>
                                {patient.email ||
                                    t(
                                        "patientProfile.information.notProvided"
                                    ) ||
                                    "Not provided"}
                            </strong>
                        </div>
                    </div>
                </div>

                {/* Assessment History */}
                <div className="profile-card">
                    <h2>
                        {t("patientProfile.history.title") ||
                            "Assessment History"}
                    </h2>

                    <div className="profile-empty">
                        <ClipboardPlus size={25} />

                        <p>
                            {t("patientProfile.history.empty") ||
                                "No prior assessment records found."}
                        </p>

                        <button
                            className="secondary-action"
                            onClick={() =>
                                navigate(
                                    `/assessment/new/${patient.patientId}`
                                )
                            }
                        >
                            {t("patientProfile.history.startFirst") ||
                                "Start First Assessment"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PatientProfile;