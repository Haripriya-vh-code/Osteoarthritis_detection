import React from "react";
import { AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";

function ResultCard({ analysisResult }) {
    if (!analysisResult) {
        return (
            <div className="card-placeholder" style={{ padding: "1.5rem", border: "1px dashed #ccc", borderRadius: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <AlertCircle size={20} color="#eab308" />
                    <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Analysis Not Available Yet</h3>
                </div>
                <p style={{ margin: "0.5rem 0 0 0", color: "#666", fontSize: "0.9rem" }}>
                    The assessment inputs have been recorded, but AI analysis data is missing or pending.
                </p>
            </div>
        );
    }

    const { oa_risk_score, risk_category, mapped_features } = analysisResult;

    return (
        <div className="result-card" style={{ padding: "1.5rem", border: "1px solid #e5e7eb", borderRadius: "8px", backgroundColor: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <CheckCircle2 size={22} color="#16a34a" />
                    <h3 style={{ margin: 0, fontSize: "1.2rem" }}>AI-Assisted Risk Assessment</h3>
                </div>
                <span className={`risk-badge ${risk_category?.toLowerCase()}`} style={{
                    padding: "0.25rem 0.75rem",
                    borderRadius: "9999px",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    backgroundColor: risk_category === "Low" ? "#dcfce7" : "#fef3c7",
                    color: risk_category === "Low" ? "#15803d" : "#b45309"
                }}>
                    {risk_category || "Pending"} Risk
                </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                <div style={{ padding: "1rem", backgroundColor: "#f9fafb", borderRadius: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#6b7280", fontSize: "0.85rem" }}>
                        <TrendingUp size={16} />
                        <span>OA Risk Score</span>
                    </div>
                    <div style={{ fontSize: "1.8rem", fontWeight: "bold", marginTop: "0.25rem" }}>
                        {oa_risk_score !== undefined ? oa_risk_score : "N/A"}
                    </div>
                </div>

                <div style={{ padding: "1rem", backgroundColor: "#f9fafb", borderRadius: "6px" }}>
                    <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>Total Raw Points</div>
                    <div style={{ fontSize: "1.8rem", fontWeight: "bold", marginTop: "0.25rem" }}>
                        {mapped_features?.total_raw_points ?? "N/A"}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ResultCard;