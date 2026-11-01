import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  ClipboardList,
  Clock3,
  Search,
  FileCheck2,
  Loader2
} from "lucide-react";
import { useLanguage } from "../hooks/useLanguage";
import API from "../services/api"; // Make sure your axios API instance is here

function Assessments() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch live assessments from FastAPI on load
  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setLoading(true);
        // Replace with your endpoint, e.g., GET /api/v1/assessments
        const response = await API.get("/assessments");
        setAssessments(response.data);
      } catch (error) {
        console.error("Failed to load assessments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, []);

  const filteredAssessments = useMemo(() => {
    return assessments.filter((assessment) => {
      const matchesFilter =
        activeFilter === "All" ||
        assessment.status === activeFilter;

      const query = search.toLowerCase().trim();

      const matchesSearch =
        !query ||
        assessment.patientName?.toLowerCase().includes(query) ||
        String(assessment.patientId)?.toLowerCase().includes(query) ||
        assessment.assessmentType?.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [assessments, activeFilter, search]);

  const filters = [
    {
      key: "All",
      label: t("assessments.filters.all"),
      icon: <ClipboardList size={15} />,
    },
    {
      key: "In Progress",
      label: t("assessments.filters.inProgress"),
      icon: <Clock3 size={15} />,
    },
    {
      key: "Processing",
      label: t("assessments.filters.processing"),
      icon: <Activity size={15} />,
    },
    {
      key: "Completed",
      label: t("assessments.filters.completed"),
      icon: <FileCheck2 size={15} />,
    },
  ];

  const getFilterLabel = (filter) => {
    const selectedFilter = filters.find(
      (item) => item.key === filter
    );

    return selectedFilter?.label || filter;
  };

  return (
    <div className="assessments-page">

      {/* HEADER */}
      <div className="assessments-header">
        <div>
          <div className="page-breadcrumb">
            {t("assessments.breadcrumb")}
          </div>

          <h1>{t("assessments.title")}</h1>

          <p>
            {t("assessments.description")}
          </p>
        </div>

        <button
          className="secondary-action"
          onClick={() => navigate("/patients")}
        >
          <ClipboardList size={17} />
          {t("assessments.actions.viewPatients")}
        </button>
      </div>

      {/* FILTERS + SEARCH */}
      <section className="assessments-toolbar">
        <div className="assessment-filters">
          {filters.map((filter) => (
            <button
              key={filter.key}
              className={`assessment-filter ${
                activeFilter === filter.key ? "active" : ""
              }`}
              onClick={() => setActiveFilter(filter.key)}
            >
              {filter.icon}
              {filter.label}
            </button>
          ))}
        </div>

        <div className="assessment-search">
          <Search size={17} />
          <input
            type="text"
            placeholder={t("assessments.search.placeholder")}
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>
      </section>

      {/* ASSESSMENT CONTENT */}
      <section className="assessments-card">
        <div className="assessments-card-header">
          <div>
            <h2>
              {activeFilter === "All"
                ? t("assessments.content.allTitle")
                : getFilterLabel(activeFilter)}
            </h2>

            <p>
              {filteredAssessments.length}{" "}
              {filteredAssessments.length !== 1
                ? t("assessments.content.assessments")
                : t("assessments.content.assessment")}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="assessments-empty">
            <Loader2 size={30} className="animate-spin" />
            <p>Loading assessment records from server...</p>
          </div>
        ) : filteredAssessments.length === 0 ? (
          <div className="assessments-empty">
            <div className="assessments-empty-icon">
              <ClipboardList size={30} />
            </div>

            <h3>
              {t("assessments.empty.title")}
            </h3>

            <p>
              {t("assessments.empty.description")}
            </p>

            <button
              className="primary-action"
              onClick={() => navigate("/patients")}
            >
              <ClipboardList size={17} />
              {t("assessments.empty.button")}
            </button>
          </div>
        ) : (
          <div className="assessments-table">
            <div className="assessment-table-header">
              <span>{t("assessments.table.patient")}</span>
              <span>{t("assessments.table.assessment")}</span>
              <span>{t("assessments.table.status")}</span>
              <span>{t("assessments.table.date")}</span>
              <span></span>
            </div>

            {filteredAssessments.map((assessment) => (
              <div
                className="assessment-table-row"
                key={assessment.id}
              >
                <div className="assessment-patient">
                  <div className="assessment-patient-avatar">
                    {assessment.patientName?.charAt(0)}
                  </div>

                  <div>
                    <strong>
                      {assessment.patientName}
                    </strong>

                    <span>
                      {assessment.patientId}
                    </span>
                  </div>
                </div>

                <span className="assessment-type">
                  {assessment.assessmentType}
                </span>

                <AssessmentStatus
                  status={assessment.status}
                />

                <span className="assessment-date">
                  {assessment.date}
                </span>

                <button
                  className="row-action"
                  onClick={() =>
                    navigate(
                      `/assessment/${assessment.patientId}/results`
                    )
                  }
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* DISCLAIMER */}
      <div className="clinical-disclaimer">
        <Activity size={19} />
        <div>
          <strong>
            {t("assessments.disclaimer.title")}
          </strong>

          <p>
            {t("assessments.disclaimer.description")}
          </p>
        </div>
      </div>

    </div>
  );
}

/* =========================
   ASSESSMENT STATUS
========================= */

function AssessmentStatus({ status }) {
  const { t } = useLanguage();

  const statusClass = status
    ?.toLowerCase()
    .replace(/\s+/g, "-");

  const statusLabels = {
    "In Progress": t("assessments.filters.inProgress"),
    "Processing": t("assessments.filters.processing"),
    "Completed": t("assessments.filters.completed"),
  };

  return (
    <span className={`assessment-status ${statusClass}`}>
      <span className="assessment-status-dot" />
      {statusLabels[status] || status}
    </span>
  );
}

export default Assessments;