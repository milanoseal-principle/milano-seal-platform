"use client";

import { useState, useCallback } from "react";

interface ExecutionIntelligenceData {
  matter_id: string | null;
  country_id: string;
  document_id: string;
  readiness_score: number;
  risk_level: "low" | "medium" | "high";
  execution_ready: boolean;
  missing_items: string[];
  fatal_blockers: string[];
  operator_actions: {
    total_actions: number;
    critical_count: number;
    next_action: {
      priority: string;
      label: string;
      description: string;
      cta: string;
      route: string | null;
    } | null;
    operator_summary: string;
    actions: Array<{
      id: string;
      priority: string;
      category: string;
      label: string;
      description: string;
      cta: string;
      route: string | null;
    }>;
  };
  matter_intelligence: {
    authority_confidence: string | null;
    chain_certification_status: string | null;
    estimated_timeline_days: number | null;
    requires_qa_checklist: boolean;
    is_derived: boolean;
    next_action_operator: string | null;
  } | null;
  timeline: string;
  corridor_label: string;
  execution_path: string[];
  is_derived: boolean;
}

const PRIORITY_COLOR: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH: "#f59e0b",
  NORMAL: "#C6A55A",
  LOW: "#6b7280",
};

const RISK_COLOR: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#4a9e6b",
};

export function ExecutionIntelligencePanel() {
  const [countryId, setCountryId] = useState("italy");
  const [documentId, setDocumentId] = useState("birth-certificate");
  const [result, setResult] = useState<ExecutionIntelligenceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ country: countryId, document: documentId });
      const res = await fetch(`/api/dashboard/execution-intelligence?${params}`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, [countryId, documentId]);

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(198,165,90,0.2)",
    borderRadius: 6,
    color: "#e5e0d8",
    fontSize: 13,
    padding: "6px 10px",
    outline: "none",
    width: "100%",
  };

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(198,165,90,0.12)",
        borderRadius: 10,
        padding: "20px 24px",
        fontFamily: "var(--font-geist-mono, monospace)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ color: "#C6A55A", fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", margin: 0 }}>
          EXECUTION INTELLIGENCE
        </h3>
        {result && (
          <span
            style={{
              fontSize: 11,
              color: RISK_COLOR[result.risk_level],
              border: `1px solid ${RISK_COLOR[result.risk_level]}`,
              borderRadius: 4,
              padding: "2px 8px",
            }}
          >
            {result.risk_level.toUpperCase()} RISK
          </span>
        )}
      </div>

      {/* Inputs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <div>
          <label style={{ color: "#6b7280", fontSize: 10, letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>
            COUNTRY
          </label>
          <input
            value={countryId}
            onChange={(e) => setCountryId(e.target.value)}
            style={inputStyle}
            placeholder="italy"
          />
        </div>
        <div>
          <label style={{ color: "#6b7280", fontSize: 10, letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>
            DOCUMENT TYPE
          </label>
          <input
            value={documentId}
            onChange={(e) => setDocumentId(e.target.value)}
            style={inputStyle}
            placeholder="birth-certificate"
          />
        </div>
      </div>

      <button
        onClick={run}
        disabled={loading}
        style={{
          background: loading ? "rgba(198,165,90,0.1)" : "rgba(198,165,90,0.15)",
          border: "1px solid rgba(198,165,90,0.3)",
          borderRadius: 6,
          color: "#C6A55A",
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: 12,
          padding: "7px 18px",
          letterSpacing: "0.06em",
          marginBottom: 16,
          width: "100%",
        }}
      >
        {loading ? "COMPUTING..." : "RUN EXECUTION INTELLIGENCE"}
      </button>

      {error && (
        <p style={{ color: "#ef4444", fontSize: 12, marginBottom: 12 }}>Error: {error}</p>
      )}

      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Score rail */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: "#9ca3af", fontSize: 11 }}>Readiness Score</span>
              <span style={{ color: result.execution_ready ? "#4a9e6b" : "#f59e0b", fontSize: 13, fontWeight: 600 }}>
                {result.readiness_score}/100 {result.execution_ready ? "✓" : ""}
              </span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 4, height: 6, overflow: "hidden" }}>
              <div
                style={{
                  background: result.execution_ready ? "#4a9e6b" : "#f59e0b",
                  borderRadius: 4,
                  height: "100%",
                  width: `${result.readiness_score}%`,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>

          {/* Matter intelligence overlay */}
          {result.matter_intelligence && (
            <div
              style={{
                background: "rgba(198,165,90,0.04)",
                border: "1px solid rgba(198,165,90,0.1)",
                borderRadius: 8,
                padding: "12px 14px",
              }}
            >
              <div style={{ color: "#C6A55A", fontSize: 10, letterSpacing: "0.08em", marginBottom: 8 }}>
                AUTHORITY INTELLIGENCE OVERLAY
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <div style={{ color: "#6b7280", fontSize: 10 }}>Confidence</div>
                  <div style={{ color: "#e5e0d8", fontSize: 12 }}>
                    {result.matter_intelligence.authority_confidence ?? "—"}
                  </div>
                </div>
                <div>
                  <div style={{ color: "#6b7280", fontSize: 10 }}>Chain Status</div>
                  <div style={{ color: "#e5e0d8", fontSize: 12 }}>
                    {result.matter_intelligence.chain_certification_status ?? "—"}
                  </div>
                </div>
                <div>
                  <div style={{ color: "#6b7280", fontSize: 10 }}>Est. Timeline</div>
                  <div style={{ color: "#e5e0d8", fontSize: 12 }}>
                    {result.matter_intelligence.estimated_timeline_days
                      ? `${result.matter_intelligence.estimated_timeline_days} days`
                      : "—"}
                  </div>
                </div>
                <div>
                  <div style={{ color: "#6b7280", fontSize: 10 }}>QA Required</div>
                  <div style={{ color: result.matter_intelligence.requires_qa_checklist ? "#f59e0b" : "#4a9e6b", fontSize: 12 }}>
                    {result.matter_intelligence.requires_qa_checklist ? "Yes" : "No"}
                  </div>
                </div>
              </div>
              {result.matter_intelligence.next_action_operator && (
                <div
                  style={{
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: "1px solid rgba(198,165,90,0.08)",
                    color: "#C6A55A",
                    fontSize: 12,
                  }}
                >
                  → {result.matter_intelligence.next_action_operator}
                </div>
              )}
            </div>
          )}

          {/* Operator action queue */}
          {result.operator_actions.total_actions > 0 && (
            <div>
              <div style={{ color: "#9ca3af", fontSize: 10, letterSpacing: "0.06em", marginBottom: 8 }}>
                OPERATOR ACTION QUEUE ({result.operator_actions.total_actions})
                {result.operator_actions.critical_count > 0 && (
                  <span style={{ color: "#ef4444", marginLeft: 8 }}>
                    {result.operator_actions.critical_count} CRITICAL
                  </span>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {result.operator_actions.actions.slice(0, 5).map((action) => (
                  <div
                    key={action.id}
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: `1px solid ${PRIORITY_COLOR[action.priority]}22`,
                      borderLeft: `3px solid ${PRIORITY_COLOR[action.priority]}`,
                      borderRadius: 6,
                      padding: "8px 12px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#e5e0d8", fontSize: 12, fontWeight: 500 }}>{action.label}</span>
                      <span
                        style={{
                          color: PRIORITY_COLOR[action.priority],
                          fontSize: 10,
                          letterSpacing: "0.06em",
                        }}
                      >
                        {action.priority}
                      </span>
                    </div>
                    <p style={{ color: "#6b7280", fontSize: 11, margin: "4px 0 0" }}>{action.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.operator_actions.total_actions === 0 && (
            <div
              style={{
                background: "rgba(74,158,107,0.06)",
                border: "1px solid rgba(74,158,107,0.15)",
                borderRadius: 8,
                padding: "10px 14px",
                color: "#4a9e6b",
                fontSize: 12,
                textAlign: "center",
              }}
            >
              ✓ No pending operator actions
            </div>
          )}

          {/* Missing items */}
          {result.missing_items.length > 0 && (
            <div>
              <div style={{ color: "#9ca3af", fontSize: 10, letterSpacing: "0.06em", marginBottom: 6 }}>
                MISSING ITEMS
              </div>
              <ul style={{ margin: 0, padding: "0 0 0 16px" }}>
                {result.missing_items.map((item) => (
                  <li key={item} style={{ color: "#ef4444", fontSize: 12, marginBottom: 3 }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Execution path */}
          {result.execution_path.length > 0 && (
            <div>
              <div style={{ color: "#9ca3af", fontSize: 10, letterSpacing: "0.06em", marginBottom: 8 }}>
                EXECUTION PATH
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {result.execution_path.map((step, i) => (
                  <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        background: "rgba(198,165,90,0.1)",
                        border: "1px solid rgba(198,165,90,0.2)",
                        borderRadius: 4,
                        color: "#C6A55A",
                        fontSize: 11,
                        padding: "2px 8px",
                      }}
                    >
                      {step}
                    </span>
                    {i < result.execution_path.length - 1 && (
                      <span style={{ color: "#374151", fontSize: 11 }}>→</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <span style={{ color: "#374151", fontSize: 10 }}>{result.corridor_label}</span>
            <span style={{ color: "#374151", fontSize: 10 }}>{result.timeline}</span>
          </div>
        </div>
      )}
    </div>
  );
}
