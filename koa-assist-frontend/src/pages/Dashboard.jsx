import { useState, useEffect, useMemo } from "react";
import {
  Activity,
  Users,
  ClipboardList,
  AlertTriangle,
  FileText,
  Search,
  Plus,
  ArrowRight,
  Clock3,
  CheckCircle2,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import LanguageSelector from "../components/LanguageSelector";
import { useLanguage } from "../hooks/useLanguage";

function Dashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // State hooks for backend data
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({
    totalPatients: 0,
    assessmentsPending: 0,
    needAttention: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const session = JSON.parse(localStorage.getItem("koaSession") || "{}");
  const workerName = session.name || "Healthcare Worker";

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Get auth token from standalone localStorage OR koaSession
        const rawToken = localStorage.getItem("token");
        const sessionData = JSON.parse(localStorage.getItem("koaSession") || "{}");
        const token = rawToken || sessionData.token;

        // If no token exists at all, redirect to login right away
        if (!token) {
          navigate("/login");
          return;
        }

        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        // 2. Fetch stats and patient list from backend
        const [statsRes, patientsRes] = await Promise.all([
          fetch("http://127.0.0.1:8001/api/v1/dashboard/stats", { headers }),
          fetch("http://127.0.0.1:8001/api/v1/dashboard/patients", { headers }),
        ]);

        // 3. Handle expired/invalid session (401)
        if (statsRes.status === 401 || patientsRes.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("koaSession");
          navigate("/login");
          return;
        }

        if (!statsRes.ok || !patientsRes.ok) {
          throw new Error(
            `API Error: Stats status ${statsRes.status}, Patients status ${patientsRes.status}`
          );
        }

        const statsData = await statsRes.json();
        const patientsData = await patientsRes.json();

        setStats(statsData);
        setPatients(patientsData);
      } catch (err) {
        console.error("Dashboard Fetch Failed:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  // Filter patients dynamically based on search input
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const query = searchQuery.toLowerCase();
    return patients.filter(
      (p) =>
        (p.name || p.patientName || "").toLowerCase().includes(query) ||
        (p.id || p.patientId || "").toLowerCase().includes(query)
    );
  }, [patients, searchQuery]);

  return (
    <div className="dashboard-page">
      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <Activity size={23} />
          </div>

          <div>
            <div className="brand-name">KOA Assist</div>
            <div className="brand-subtitle">{t("brand.subtitle")}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-item active">
            <Activity size={19} />
            {t("navigation.dashboard")}
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/patients")}
          >
            <Users size={19} />
            {t("navigation.patients")}
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/assessment")}
          >
            <ClipboardList size={19} />
            {t("navigation.assessments")}
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/history")}
          >
            <Clock3 size={19} />
            {t("navigation.history")}
          </button>

          <button
            className="nav-item"
            onClick={() => navigate("/reports")}
          >
            <FileText size={19} />
            {t("navigation.reports")}
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <Activity size={19} />
            <div>
              <strong>KOA Assist</strong>
              <span>{t("brand.screening")}</span>
            </div>
          </div>

          <button
            className="logout-button"
            onClick={() => {
              localStorage.removeItem("koaSession");
              localStorage.removeItem("token");
              navigate("/login");
            }}
          >
            {t("common.signOut")}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="dashboard-main">
        {/* HEADER */}
        <header className="dashboard-header">
          <div>
            <div className="page-label">{t("dashboard.label")}</div>

            <h1>
              {t("dashboard.greeting")}, {workerName}.
            </h1>

            <p>{t("dashboard.description")}</p>
          </div>

          <LanguageSelector />
        </header>

       {/* STAT CARDS - HARDCODED VALUES */}
<section className="clinical-stats">
  <StatCard
    icon={<Users size={21} />}
    label={t("dashboard.stats.totalPatients")}
    value={stats.totalPatients}
    detail={t("dashboard.stats.patientsThisMonth")}
    type="blue"
  />

  <StatCard
    icon={<ClipboardList size={21} />}
    label={t("dashboard.stats.assessments")}
    value={stats.assessmentsPending}
    detail={t("dashboard.stats.pending")}
    type="purple"
  />

  <StatCard
    icon={<AlertTriangle size={21} />}
    label={t("dashboard.stats.needAttention")}
    value={stats.needAttention}
    detail={t("dashboard.stats.highRisk")}
    type="orange"
  />

  <StatCard
    icon={<CheckCircle2 size={21} />}
    label={t("dashboard.stats.completed")}
    value={`${stats.completed}%`}
    detail={t("dashboard.stats.completion")}
    type="green"
  />
</section>

        {/* QUICK ACTIONS */}
        <section className="quick-section">
          <div className="section-heading">
            <div>
              <h2>{t("dashboard.quickActions.title")}</h2>
              <p>{t("dashboard.quickActions.description")}</p>
            </div>
          </div>

          <div className="quick-grid">
            <QuickAction
              icon={<Plus size={23} />}
              title={t("dashboard.quickActions.newPatient")}
              description={t(
                "dashboard.quickActions.newPatientDescription"
              )}
              onClick={() => navigate("/patients")}
            />

            <QuickAction
              icon={<FileText size={23} />}
              title={t("dashboard.quickActions.viewReports")}
              description={t(
                "dashboard.quickActions.viewReportsDescription"
              )}
              onClick={() => navigate("/reports")}
            />
          </div>
        </section>

        {/* PATIENTS REQUIRING ATTENTION */}
        <section className="patients-section">
          <div className="section-heading">
            <div>
              <h2>{t("dashboard.attention.title")}</h2>
              <p>{t("dashboard.attention.description")}</p>
            </div>

            <button
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                backgroundColor: "#f1f5f9",
                color: "#0f172a",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
              }}
              onClick={() => navigate("/patients")}
            >
              {t("common.viewAll")}
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="patient-table">
            <div className="table-header">
              <span>{t("dashboard.table.patient")}</span>
              <span>{t("dashboard.table.age")}</span>
              <span>{t("dashboard.table.assessment")}</span>
              <span>{t("dashboard.table.risk")}</span>
              <span>{t("dashboard.table.lastAssessment")}</span>
              <span></span>
            </div>

            {loading ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
                <Loader2 className="animate-spin" size={24} style={{ margin: "0 auto 0.5rem" }} />
                <span>Loading patient data...</span>
              </div>
            ) : error && filteredPatients.length === 0 ? (
              <div style={{ padding: "1.5rem", textAlign: "center", color: "#ef4444" }}>
                {error}
              </div>
            ) : filteredPatients.length === 0 ? (
              <div style={{ padding: "1.5rem", textAlign: "center", color: "#64748b" }}>
                No patient records found.
              </div>
            ) : (
              filteredPatients.map((patient) => {
                const pId = patient.id || patient.patientId || "N/A";
                const pName = patient.name || patient.patientName || "Unknown Patient";
                const pAge = patient.age ?? "N/A";
                const pAssessment = patient.assessment || patient.assessmentType || "General Assessment";
                const pRisk = patient.risk || patient.risk_level || "Low";
                const pDate = patient.date || patient.lastAssessmentDate || "Recent";

                return (
                  <div className="patient-row" key={pId}>
                    <div className="patient-info">
                      <div className="patient-avatar">
                        {pName.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <strong>{pName}</strong>
                        <span>{pId}</span>
                      </div>
                    </div>

                    <span className="table-text">{pAge}</span>
                    <span className="table-text">{pAssessment}</span>

                    <RiskBadge risk={pRisk} t={t} />

                    <span className="table-text">{pDate}</span>

                    <button
                      className="row-action"
                      onClick={() => navigate(`/assessment/${pId}/results`)}
                    >
                      <ArrowRight size={16} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* SEARCH */}
        <section className="search-section">
          <div className="search-heading">
            <div>
              <h2>{t("dashboard.search.title")}</h2>
              <p>{t("dashboard.search.description")}</p>
            </div>
          </div>

          <div className="patient-search">
            <Search size={18} />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("dashboard.search.placeholder")}
            />

            <button onClick={() => navigate("/patients")}>
              {t("common.search")}
            </button>
          </div>
        </section>

        {/* DISCLAIMER */}
        <div className="clinical-disclaimer">
          <Activity size={19} />

          <div>
            <strong>{t("dashboard.disclaimer.title")}</strong>
            <p>{t("dashboard.disclaimer.description")}</p>
          </div>
        </div>
      </main>
    </div>
  );
}

/* Helper Components */
function StatCard({ icon, label, value, detail, type }) {
  return (
    <div className="clinical-stat-card">
      <div className={`stat-icon ${type}`}>{icon}</div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-number">{value}</div>
        <div className="stat-detail">{detail}</div>
      </div>
    </div>
  );
}

function QuickAction({ icon, title, description, onClick }) {
  return (
    <button className="quick-action" onClick={onClick}>
      <div className="quick-icon">{icon}</div>
      <div className="quick-content">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      <ArrowRight size={17} className="quick-arrow" />
    </button>
  );
}

function RiskBadge({ risk, t }) {
  const className = String(risk).toLowerCase();
  const translatedRisk = {
    High: t("risk.high"),
    Moderate: t("risk.moderate"),
    Low: t("risk.low"),
  };

  return (
    <span className={`risk-badge ${className}`}>
      <span />
      {translatedRisk[risk] || risk}
    </span>
  );
}

export default Dashboard;