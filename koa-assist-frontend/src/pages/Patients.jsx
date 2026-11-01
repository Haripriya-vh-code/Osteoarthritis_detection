import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  UserPlus,
  Users,
  X,
  UserRound,
  CalendarDays,
  Phone,
  Mail,
  ArrowRight,
  ClipboardPlus,
  Trash2,
  ArrowLeft
} from "lucide-react";

import LanguageSelector from "../components/LanguageSelector";
import { useLanguage } from "../hooks/useLanguage";

function Patients() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingPatientId, setDeletingPatientId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    phone: "",
    email: "",
  });

  const [error, setError] = useState("");

  const API_BASE_URL = "http://127.0.0.1:8001/api/v1";

  // --------------------------------------------------
  // AUTHORIZATION HEADER
  // --------------------------------------------------

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");

    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // --------------------------------------------------
  // FETCH ALL PATIENTS
  // --------------------------------------------------

  const fetchPatients = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/patients/`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch patients");
      }

      const data = await res.json();

      // Ensure we always work with an array
      const rawList = Array.isArray(data)
        ? data
        : data?.patients || [];

      // Normalize backend patient fields
      const mappedData = rawList.map((p) => ({
        ...p,

        patientId:
          p?.patient_id ??
          p?.patientId ??
          p?.id ??
          "",

        gender:
          p?.gender ??
          p?.sex ??
          p?.biological_sex ??
          "",
      }));

      setPatients(mappedData);
    } catch (err) {
      console.error("Error loading patients:", err);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // FETCH PATIENTS WHEN PAGE LOADS
  // --------------------------------------------------

  useEffect(() => {
    const loadPatients = async () => {
      setLoading(true);
      await fetchPatients();
    };

    loadPatients();
  }, []);

  // --------------------------------------------------
  // FILTER PATIENTS
  // --------------------------------------------------

  const filteredPatients = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return patients;
    }

    return patients.filter((patient) => {
      const nameMatch = patient.name
        ?.toLowerCase()
        .includes(query);

      const idMatch = String(patient.patientId ?? "")
        .toLowerCase()
        .includes(query);

      const phoneMatch = patient.phone
        ?.toLowerCase()
        .includes(query);

      return nameMatch || idMatch || phoneMatch;
    });
  }, [patients, searchTerm]);

  // --------------------------------------------------
  // HANDLE FORM CHANGES
  // --------------------------------------------------

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    setError("");
  };

  // --------------------------------------------------
  // REGISTER NEW PATIENT
  // --------------------------------------------------

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setError(t("patients.errors.nameRequired"));
      return;
    }

    if (!form.age) {
      setError(t("patients.errors.ageRequired"));
      return;
    }

    if (!form.gender) {
      setError(t("patients.errors.genderRequired"));
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const payload = {
        name: form.name.trim(),
        age: parseInt(form.age, 10),
        gender: form.gender,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
      };

      const res = await fetch(`${API_BASE_URL}/patients/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();

        throw new Error(
          errorData.detail || "Failed to register patient"
        );
      }

      const createdPatient = await res.json();

      // Normalize newly created patient
      const formattedPatient = {
        ...createdPatient,

        patientId:
          createdPatient.patient_id ??
          createdPatient.patientId ??
          createdPatient.id ??
          "",

        gender:
          createdPatient.gender ??
          createdPatient.sex ??
          "",
      };

      setPatients((current) => [
        formattedPatient,
        ...current,
      ]);

      // Reset form
      setForm({
        name: "",
        age: "",
        gender: "",
        phone: "",
        email: "",
      });

      setShowRegister(false);
    } catch (err) {
      console.error("Registration error:", err);

      setError(
        err.message || "Failed to create patient record"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // --------------------------------------------------
  // DELETE PATIENT
  // --------------------------------------------------

  const handleDelete = async (patientId, patientName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${patientName}? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingPatientId(patientId);
      setError("");

      const res = await fetch(
        `${API_BASE_URL}/patients/${patientId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (!res.ok) {
        let errorMessage = "Failed to delete patient";

        try {
          const errorData = await res.json();

          errorMessage =
            errorData.detail || errorMessage;
        } catch {
          // DELETE may return an empty response
        }

        throw new Error(errorMessage);
      }

      // Remove deleted patient from the frontend list
      setPatients((current) =>
        current.filter(
          (patient) =>
            String(patient.patientId) !==
            String(patientId)
        )
      );
    } catch (err) {
      console.error("Delete patient error:", err);

      setError(
        err.message || "Failed to delete patient"
      );
    } finally {
      setDeletingPatientId(null);
    }
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div className="patients-page">
      {/* BACK BUTTON */}
      <button
        type="button"
        className="back-button"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={17} />
        Back
      </button>


      {/* Header */}
      <div className="patients-header">
        <div>
          <div className="page-breadcrumb">
            KOA Assist / {t("patients.breadcrumb")}
          </div>

          <h1>{t("patients.title")}</h1>

          <p>{t("patients.description")}</p>
        </div>

        <div className="patients-header-actions">
          <LanguageSelector />

          <button
            className="primary-action"
            onClick={() => {
              setShowRegister(true);
              setError("");
            }}
          >
            <UserPlus size={18} />
            {t("patients.actions.register")}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="patient-search-card">
        <div className="patient-search">
          <Search size={19} />

          <input
            type="text"
            placeholder={t(
              "patients.search.placeholder"
            )}
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
          />

          {searchTerm && (
            <button
              className="clear-search"
              onClick={() => setSearchTerm("")}
              aria-label={t(
                "patients.search.clear"
              )}
            >
              <X size={17} />
            </button>
          )}
        </div>
      </div>

      {/* Patient count */}
      <div className="patients-section-header">
        <div>
          <h2>
            {t("patients.records.title")}
          </h2>

          <span>
            {patients.length === 0
              ? t("patients.records.none")
              : `${patients.length} ${patients.length === 1
                ? t(
                  "patients.records.patient"
                )
                : t(
                  "patients.records.patients"
                )
              }`}
          </span>
        </div>
      </div>

      {/* Patient list / Empty state / Loading */}
      {loading ? (
        <div className="patients-empty-state">
          <p>Loading patient records...</p>
        </div>
      ) : patients.length === 0 ? (
        <div className="patients-empty-state">
          <div className="empty-icon">
            <Users size={32} />
          </div>

          <h2>
            {t("patients.empty.title")}
          </h2>

          <p>
            {t(
              "patients.empty.description"
            )}
          </p>

          <button
            className="primary-action"
            onClick={() => {
              setShowRegister(true);
              setError("");
            }}
          >
            <UserPlus size={18} />
            {t("patients.empty.button")}
          </button>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="patients-empty-state">
          <div className="empty-icon">
            <Search size={30} />
          </div>

          <h2>
            {t("patients.noMatch.title")}
          </h2>

          <p>
            {t(
              "patients.noMatch.description"
            )}
          </p>
        </div>
      ) : (
        <div className="patient-list">
          {filteredPatients.map((patient) => (
            <div
              className="patient-card"
              key={patient.patientId}
            >
              {/* Patient Information */}
              <div className="patient-main">
                <div className="patient-avatar">
                  <UserRound size={22} />
                </div>

                <div className="patient-info">
                  <h3>{patient.name}</h3>

                  <span className="patient-id">
                    {patient.patientId}
                  </span>

                  <div className="patient-meta">

                    <span>
                      <CalendarDays size={15} />

                      {patient.age}{" "}

                      {t(
                        "patients.patientMeta.years"
                      )}
                    </span>

                    <span>
                      {patient.gender ===
                        "Female"
                        ? t(
                          "patients.gender.female"
                        )
                        : patient.gender ===
                          "Male"
                          ? t(
                            "patients.gender.male"
                          )
                          : patient.gender ===
                            "Other"
                            ? t(
                              "patients.gender.other"
                            )
                            : patient.gender ===
                              "Prefer not to say"
                              ? t(
                                "patients.gender.preferNotToSay"
                              )
                              : patient.gender}
                    </span>

                    {patient.phone && (
                      <span>
                        <Phone size={15} />
                        {patient.phone}
                      </span>
                    )}

                  </div>
                </div>
              </div>

              {/* Patient Actions */}
              <div className="patient-actions">

                {/* View Profile */}
                <button
                  className="secondary-action"
                  onClick={() =>
                    navigate(
                      `/patients/${patient.patientId}`
                    )
                  }
                >
                  {t(
                    "patients.actions.viewProfile"
                  )}

                  <ArrowRight size={16} />
                </button>

                {/* Start Assessment */}
                <button
                  className="assessment-action"
                  onClick={() =>
                    navigate(
                      `/assessment/new/${patient.patientId}`
                    )
                  }
                >
                  <ClipboardPlus size={16} />

                  {t(
                    "patients.actions.startAssessment"
                  )}
                </button>

                {/* Delete Patient */}
                <button
                  onClick={() =>
                    handleDelete(
                      patient.patientId,
                      patient.name
                    )
                  }
                  disabled={
                    deletingPatientId === patient.patientId
                  }
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    background: "#fff",
                    color: "#dc2626",
                    fontSize: "13px",
                    fontWeight: "500",
                    fontFamily: "inherit",
                    cursor:
                      deletingPatientId === patient.patientId
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      deletingPatientId === patient.patientId
                        ? 0.6
                        : 1,
                  }}
                >
                  <Trash2 size={16} />

                  {deletingPatientId === patient.patientId
                    ? t("patients.actions.deleting")
                    : t("patients.actions.delete")}
                </button>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Global Error */}
      {error && !showRegister && (
        <div className="form-error">
          {error}
        </div>
      )}

      {/* Register Patient Modal */}
      {showRegister && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowRegister(false);
            }
          }}
        >
          <div className="register-modal">

            {/* Modal Header */}
            <div className="modal-header">
              <div>
                <span className="modal-eyebrow">
                  {t(
                    "patients.modal.eyebrow"
                  )}
                </span>

                <h2>
                  {t(
                    "patients.modal.title"
                  )}
                </h2>

                <p>
                  {t(
                    "patients.modal.description"
                  )}
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setShowRegister(false)
                }
                aria-label={t(
                  "patients.modal.close"
                )}
              >
                <X size={20} />
              </button>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleRegister}>
              <div className="form-grid">

                {/* Name */}
                <div className="form-field full-width">
                  <label>
                    {t(
                      "patients.form.name"
                    )}
                    <span>*</span>
                  </label>

                  <div className="input-wrapper">
                    <UserRound size={17} />

                    <input
                      name="name"
                      type="text"
                      placeholder={t(
                        "patients.form.namePlaceholder"
                      )}
                      value={form.name}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Age */}
                <div className="form-field">
                  <label>
                    {t(
                      "patients.form.age"
                    )}
                    <span>*</span>
                  </label>

                  <input
                    name="age"
                    type="number"
                    min="1"
                    max="120"
                    placeholder={t(
                      "patients.form.agePlaceholder"
                    )}
                    value={form.age}
                    onChange={handleChange}
                  />
                </div>

                {/* Gender */}
                <div className="form-field">
                  <label>
                    {t(
                      "patients.form.gender"
                    )}
                    <span>*</span>
                  </label>

                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                  >
                    <option value="">
                      {t(
                        "patients.form.select"
                      )}
                    </option>

                    <option value="Female">
                      {t(
                        "patients.form.female"
                      )}
                    </option>

                    <option value="Male">
                      {t(
                        "patients.form.male"
                      )}
                    </option>

                    <option value="Other">
                      {t(
                        "patients.form.other"
                      )}
                    </option>

                    <option value="Prefer not to say">
                      {t(
                        "patients.form.preferNotToSay"
                      )}
                    </option>
                  </select>
                </div>

                {/* Phone */}
                <div className="form-field">
                  <label>
                    {t(
                      "patients.form.phone"
                    )}
                  </label>

                  <div className="input-wrapper">
                    <Phone size={17} />

                    <input
                      name="phone"
                      type="tel"
                      placeholder={t(
                        "patients.form.phonePlaceholder"
                      )}
                      value={form.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="form-field">
                  <label>
                    {t(
                      "patients.form.email"
                    )}
                  </label>

                  <div className="input-wrapper">
                    <Mail size={17} />

                    <input
                      name="email"
                      type="email"
                      placeholder={t(
                        "patients.form.emailPlaceholder"
                      )}
                      value={form.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

              </div>

              {/* Registration Error */}
              {error && (
                <div className="form-error">
                  {error}
                </div>
              )}

              {/* Modal Footer */}
              <div className="modal-footer">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={() =>
                    setShowRegister(false)
                  }
                >
                  {t(
                    "patients.modal.cancel"
                  )}
                </button>

                <button
                  type="submit"
                  className="primary-action"
                  disabled={submitting}
                >
                  <UserPlus size={17} />

                  {submitting
                    ? "Registering..."
                    : t(
                      "patients.actions.register"
                    )}
                </button>

              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Patients;

