"use client";

import { useEffect, useState } from "react";

interface MatterRow {
  id: string;
  client_name_masked: string;
  matter_status: string;
  destination_country: string;
  document_type: string;
  days_blocked: number;
  severity: string;
}

interface ExecutionData {
  payment_issues: MatterRow[];
  authority_issues: MatterRow[];
  courier_issues: MatterRow[];
  translation_issues: MatterRow[];
  missing_docs: MatterRow[];
  blocked_3d: MatterRow[];
  blocked_7d: MatterRow[];
  needs_operator: MatterRow[];
}

const SEVERITY_COLORS: Record<string, string> = {
  RED: "#ef4444",
  AMBER: "#f59e0b",
  GREEN: "#4a9e6b",
  GOLD: "#C6A55A",
};

const CATEGORY_CONFIG = [
  { key: "blocked_7d", label: "Blocked 7+ Days", severity: "RED" },
  { key: "payment_issues", label: "Payment Issues", severity: "RED" },
  { key: "blocked_3d", label: "Blocked 3+ Days", severity: "AMBER" },
  { key: "authority_issues", label: "Authority Review", severity: "AMBER" },
  { key: "translation_issues", label: "Translation Required", severity: "AMBER" },
  { key: "courier_issues", label: "Courier / Shipping", severity: "GREEN" },
  { key: "missing_docs", label: "Missing Documents", severity: "GREEN" },
  { key: "needs_operator", label: "Needs Operator", severity: "GOLD" },
] as const;

function SeverityChip({ severity }: { severity: string }) {
  const color = SEVERITY_COLORS[severity] ?? "#888";
  return (
    <span
      style={{
        fontSize: 8,
        fontFamily: "monospace",
        letterSpacing: "0.1em",
        textTransform: "uppercase" as const,
        color,
        background: `${color}18`,
        border: `1px solid ${color}40`,
        borderRadius: 2,
        padding: "1px 6px",
      }}
    >
      {severity}
    </span>
  );
}

function CategoryPanel({
  label,
  severity,
  matters,
}: {
  label: string;
  severity: string;
  matters: MatterRow[];
}) {
  const color = SEVERITY_COLORS[severity] ?? "#888";
  return (
    <div
      style={{
        background: "rgba(3,3,5,0.9)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 2,
        padding: "16px 18px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div
          style={{
            fontSize: 9,
            fontFamily: "monospace",
            letterSpacing: "0.32em",
            textTransform: "uppercase" as const,
            color: "rgba(198,165,90,0.5)",
          }}
        >
          {label}
        </div>
        <span
          style={{
            fontSize: 11,
            fontFamily: "monospace",
            fontWeight: 700,
            color,
            background: `${color}15`,
            border: `1px solid ${color}40`,
            borderRadius: 2,
            padding: "2px 8px",
          }}
        >
          {matters.length}
        </span>
      </div>

      {matters.length === 0 ? (
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>
          No issues
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {matters.slice(0, 10).map((m) => (
            <div
              key={m.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 8px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 2,
                borderLeft: `2px solid ${color}60`,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.8)" }}>
                    {m.client_name_masked}
                  </span>
                  <SeverityChip severity={m.severity} />
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>
                  {m.destination_country} · {m.document_type}
                </div>
              </div>
              <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: "monospace",
                    color: m.days_blocked >= 7 ? "#ef4444" : m.days_blocked >= 3 ? "#f59e0b" : "rgba(255,255,255,0.5)",
                  }}
                >
                  {m.days_blocked}d
                </div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
                  {m.matter_status?.replace(/_/g, " ")}
                </div>
              </div>
            </div>
          ))}
          {matters.length > 10 && (
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "monospace", textAlign: "center" as const, paddingTop: 4 }}>
              +{matters.length - 10} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ExecutionControlCenter() {
  const [data, setData] = useState<ExecutionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/execution-control")
      .then((r) => r.json())
      .then((d) => {
        setData(d as ExecutionData);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load execution control data");
        setLoading(false);
      });
  }, []);

  const totalIssues = data
    ? Object.values(data).reduce((acc, arr) => acc + arr.length, 0)
    : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#050507", padding: "32px 40px", color: "rgba(255,255,255,0.75)" }}>
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            fontSize: 9,
            fontFamily: "monospace",
            letterSpacing: "0.32em",
            textTransform: "uppercase" as const,
            color: "rgba(198,165,90,0.5)",
            marginBottom: 6,
          }}
        >
          Milano Seal — Operations
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "rgba(255,255,255,0.9)", margin: 0 }}>
            Execution Control Center
          </h1>
          {!loading && data && (
            <span
              style={{
                fontSize: 11,
                fontFamily: "monospace",
                color: totalIssues > 0 ? "#ef4444" : "#4a9e6b",
                background: totalIssues > 0 ? "rgba(239,68,68,0.1)" : "rgba(74,158,107,0.1)",
                border: `1px solid ${totalIssues > 0 ? "rgba(239,68,68,0.3)" : "rgba(74,158,107,0.3)"}`,
                borderRadius: 2,
                padding: "3px 10px",
              }}
            >
              {totalIssues} active issues
            </span>
          )}
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: "4px 0 0" }}>
          Real-time matter escalation queue. Operator-only.
        </p>
      </div>

      {loading && (
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
          Loading execution data...
        </div>
      )}

      {error && (
        <div style={{ fontSize: 13, color: "#ef4444", fontFamily: "monospace" }}>
          {error}
        </div>
      )}

      {data && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: 12,
          }}
        >
          {CATEGORY_CONFIG.map(({ key, label, severity }) => (
            <CategoryPanel
              key={key}
              label={label}
              severity={severity}
              matters={data[key as keyof ExecutionData] ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}
