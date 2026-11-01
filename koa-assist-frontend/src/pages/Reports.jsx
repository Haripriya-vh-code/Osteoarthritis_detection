import { useNavigate } from "react-router-dom";
import {
  FileText,
  Search,
  FolderOpen,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "../hooks/useLanguage";

function Reports() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [search, setSearch] = useState("");
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const generatedReports = [];

    // =========================================================
    // ONLY LOAD ACTUALLY GENERATED REPORTS
    // =========================================================

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (!key || !key.startsWith("koaReport_")) {
        continue;
      }

      const patientId = key.replace(
        "koaReport_",
        ""
      );

      if (!patientId) continue;

      try {
        const reportData = JSON.parse(
          localStorage.getItem(key) || "{}"
        );

        // Try to obtain patient information
        let patientName =
          reportData.patientName ||
          reportData.patient?.name ||
          null;

        if (!patientName) {
          const directPatient =
            localStorage.getItem(
              `koaPatient_${patientId}`
            );

          if (directPatient) {
            try {
              const patient =
                JSON.parse(directPatient);

              patientName =
                patient.name ||
                patient.patientName ||
                null;
            } catch {
              // Ignore malformed patient data
            }
          }
        }

        // Search global patient arrays if necessary
        if (!patientName) {
          const arrayKeys = [
            "koa_patients",
            "koaPatients",
            "patients",
          ];

          for (const arrayKey of arrayKeys) {
            try {
              const patients = JSON.parse(
                localStorage.getItem(arrayKey) ||
                  "[]"
              );

              if (!Array.isArray(patients)) {
                continue;
              }

              const patient = patients.find(
                (p) =>
                  String(
                    p.id ?? p.patientId ?? ""
                  ) === String(patientId)
              );

              if (patient) {
                patientName =
                  patient.name ||
                  patient.patientName ||
                  null;

                if (patientName) break;
              }
            } catch {
              // Ignore malformed arrays
            }
          }
        }

        generatedReports.push({
          reportId: `REP-${patientId}`,
          patientId,
          patientName:
            patientName ||
            `Patient #${patientId}`,
          date:
            reportData.generatedAt ||
            reportData.createdAt ||
            new Date().toISOString(),
        });
      } catch (error) {
        console.error(
          `Error reading ${key}:`,
          error
        );
      }
    }

    // Newest reports first
    generatedReports.sort(
      (a, b) =>
        new Date(b.date) -
        new Date(a.date)
    );

    setReports(generatedReports);
  }, []);

  // =========================================================
  // SEARCH
  // =========================================================

  const query = search.trim().toLowerCase();

  const filteredReports = reports.filter(
    (report) =>
      !query ||
      report.patientName
        ?.toLowerCase()
        .includes(query) ||
      report.patientId
        ?.toLowerCase()
        .includes(query) ||
      report.reportId
        ?.toLowerCase()
        .includes(query)
  );

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="reports-page">

      {/* HEADER */}

      <div className="reports-header">

        <div>

          <button
            type="button"
            className="back-button"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>

          <div className="page-breadcrumb">
            {t("reports.breadcrumb") ||
              "Dashboard / Reports"}
          </div>

          <h1>
            {t("reports.title") ||
              "Assessment Reports"}
          </h1>

          <p>
            {t("reports.description") ||
              "View and manage generated clinical assessment reports."}
          </p>

        </div>

      </div>

      {/* SEARCH */}

      <div className="reports-toolbar">

        <div className="reports-search">

          <Search size={17} />

          <input
            type="text"
            placeholder={
              t("reports.search.placeholder") ||
              "Search by Patient Name or ID..."
            }
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

        </div>

      </div>

      {/* EMPTY */}

      {filteredReports.length === 0 ? (

        <div className="reports-empty">

          <div className="reports-empty-icon">
            <FolderOpen size={30} />
          </div>

          <h2>
            {t("reports.empty.title") ||
              "No Reports Found"}
          </h2>

          <p>
            {t("reports.empty.description") ||
              "Create a new assessment to generate clinical reports."}
          </p>

          <button
            className="primary-action"
            onClick={() =>
              navigate("/patients")
            }
          >
            <Users size={17} />

            {t("reports.empty.button") ||
              "Select Patient"}
          </button>

        </div>

      ) : (

        <div className="reports-list">

          {filteredReports.map((report) => (

            <div
              className="report-list-card"
              key={report.reportId}
            >

              <div className="report-list-icon">
                <FileText size={21} />
              </div>

              <div className="report-list-content">

                <h3>
                  {report.patientName}
                </h3>

                <p>
                  {t("reports.reportId") ||
                    "Report ID"}{" "}
                  : {report.reportId}
                </p>

              </div>

              <button
                type="button"
                className="secondary-action"
                onClick={() =>
                  navigate(
                    `/assessment/${report.patientId}/report`
                  )
                }
              >
                <FileText size={16} />

                {t(
                  "reports.actions.viewReport"
                ) || "View Report"}
              </button>

            </div>

          ))}

        </div>

      )}

    </div>
  );
}

export default Reports;