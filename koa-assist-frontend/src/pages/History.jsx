import { useNavigate } from "react-router-dom";
import {
  Activity,
  ClipboardList,
  Search,
  History as HistoryIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLanguage } from "../hooks/useLanguage";

function History() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [search, setSearch] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = "http://127.0.0.1:8001/api/v1";

  // Helper to attach Auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");

    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // Convert backend data into the format used by this page
  const processAndSetHistory = (data) => {
    const mapped = (Array.isArray(data) ? data : []).map((item) => ({
      assessmentId: String(item.assessment_id ?? item.id ?? ""),
      patientId: String(item.patient_id ?? item.patientId ?? ""),
      patientName:
        item.patient_name ??
        item.patient?.name ??
        `Patient #${item.patient_id ?? ""}`,
      date: item.created_at
        ? new Date(item.created_at).toLocaleDateString()
        : item.date ?? "Unknown Date",
      status: item.status ?? item.risk_category ?? "Completed",
      severity: item.kl_grade ?? item.severity ?? null,
    }));

    setHistory(mapped);
  };

  // Fetch assessment history from backend
  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/assessments/history`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        // Fallback endpoint
        const fallbackRes = await fetch(`${API_BASE_URL}/assessments/`, {
          headers: getAuthHeaders(),
        });

        if (!fallbackRes.ok) {
          throw new Error("Failed to fetch assessment history");
        }

        const fallbackData = await fallbackRes.json();
        processAndSetHistory(fallbackData);
        return;
      }

      const data = await res.json();
      processAndSetHistory(data);
    } catch (err) {
      console.error("Error fetching assessment history:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load history when page opens
  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      await fetchHistory();
    };

    loadHistory();
  }, []);

  const query = search.trim().toLowerCase();

  const filteredHistory = history.filter(
    (item) =>
      !query ||
      item.patientName?.toLowerCase().includes(query) ||
      item.patientId?.toLowerCase().includes(query) ||
      item.assessmentId?.toLowerCase().includes(query)
  );

  return (
    <div className="history-page">
      <div className="history-header">
        <div>
          <div className="page-breadcrumb">{t("history.breadcrumb")}</div>

          <h1>{t("history.title")}</h1>

          <p>{t("history.description")}</p>
        </div>
      </div>

      <div className="history-toolbar">
        <div className="history-search">
          <Search size={17} />

          <input
            type="text"
            placeholder={t("history.search.placeholder")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="history-empty">
          <p>Loading assessment history...</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="history-empty">
          <div className="history-empty-icon">
            <HistoryIcon size={30} />
          </div>

          <h2>{t("history.empty.title")}</h2>

          <p>{t("history.empty.description")}</p>

          <button
            className="primary-action"
            onClick={() => navigate("/patients")}
          >
            <ClipboardList size={17} />
            {t("history.empty.button")}
          </button>
        </div>
      ) : (
        <div className="history-list">
          {filteredHistory.map((item) => (
            <div
              className="history-card"
              key={item.assessmentId}
              onClick={() =>
                navigate(`/assessment/${item.patientId}/results`)
              }
              style={{ cursor: "pointer" }}
            >
              <div className="history-card-icon">
                <Activity size={21} />
              </div>

              <div className="history-card-content">
                <h3>{item.patientName}</h3>

                <p>
                  {t("history.patientId")}: {item.patientId}
                </p>
              </div>

              <div className="history-card-meta">
                <span>{item.date}</span>

                <strong>
                  {item.severity
                    ? `${item.status} (${item.severity})`
                    : item.status}
                </strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default History;

