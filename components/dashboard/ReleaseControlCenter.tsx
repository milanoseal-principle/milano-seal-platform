"use client";

import { useEffect, useState } from "react";

interface ReleaseRow {
  id: string;
  destination_country: string;
  document_type: string;
  matter_status: string;
  updated_at: string;
  days_in_state: number;
}

interface ReleaseData {
  ready_for_release: ReleaseRow[];
  waiting_approval: ReleaseRow[];
  waiting_courier: ReleaseRow[];
  waiting_verification: ReleaseRow[];
  completed: ReleaseRow[];
}

const COUNTRY_FLAGS: Record<string, string> = {
  Italy: "🇮🇹", Portugal: "🇵🇹", Mexico: "🇲🇽", Spain: "🇪🇸",
  France: "🇫🇷", Germany: "🇩🇪", Brazil: "🇧🇷", Argentina: "🇦🇷",
  Colombia: "🇨🇴", Peru: "🇵🇪", Chile: "🇨🇱", Japan: "🇯🇵",
  China: "🇨🇳", UAE: "🇦🇪", UK: "🇬🇧", Canada: "🇨🇦",
  Australia: "🇦🇺", Netherlands: "🇳🇱",
};

const QUEUE_CONFIG = [
  { key: "ready_for_release", label: "Ready for Release", color: "#C6A55A" },
  { key: "waiting_approval", label: "Waiting Approval", color: "#f59e0b" },
  { key: "waiting_courier", label: "Waiting Courier", color: "#f59e0b" },
  { key: "waiting_verification", label: "In Transit", color: "#4a9e6b" },
  { key: "completed", label: "Completed", color: "#4a9e6b" },
] as const;

function MatterCard({
  row,
  showRelease,
}: {
  row: ReleaseRow;
  showRelease?: boolean;
}) {
  const [marking, setMarking] = useState(false);
  const [marked, setMarked] = useState(false);
  const flag = COUNTRY_FLAGS[row.destination_country] ?? "🌍";

  async function markForReview() {
    setMarking(true);
    // Marks for operator review — does not auto-release
    await fetch(`/api/deals/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: "[release-review-requested]" }),
    });
    setMarked(true);
    setMarking(false);
  }

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 2,
        padding: "10px 12px",
        marginBottom: 6,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.8)", marginBottom: 2 }}>
            {flag} {row.destination_country}
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>
            {row.document_type}
          </div>
        </div>
        <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontFamily: "monospace",
              fontWeight: 700,
              color: row.days_in_state >= 7 ? "#ef4444" : row.days_in_state >= 3 ? "#f59e0b" : "rgba(255,255,255,0.5)",
            }}
          >
            {row.days_in_state}d
          </div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>
            {row.matter_status?.replace(/_/g, " ")}
          </div>
        </div>
      </div>
      {showRelease && (
        <button
          onClick={() => void markForReview()}
          disabled={marking || marked}
          style={{
            marginTop: 8,
            width: "100%",
            padding: "5px 0",
            fontSize: 10,
            fontFamily: "monospace",
            letterSpacing: "0.1em",
            textTransform: "uppercase" as const,
            color: marked ? "rgba(198,165,90,0.4)" : "#C6A55A",
            background: marked ? "rgba(198,165,90,0.04)" : "rgba(198,165,90,0.08)",
            border: `1px solid ${marked ? "rgba(198,165,90,0.15)" : "rgba(198,165,90,0.3)"}`,
            borderRadius: 2,
            cursor: marking || marked ? "default" : "pointer",
          }}
        >
          {marked ? "Marked for Review" : marking ? "Marking..." : "Mark Released"}
        </button>
      )}
    </div>
  );
}

function QueueColumn({
  label,
  color,
  rows,
  showRelease,
}: {
  label: string;
  color: string;
  rows: ReleaseRow[];
  showRelease?: boolean;
}) {
  return (
    <div
      style={{
        background: "rgba(3,3,5,0.9)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 2,
        padding: "16px",
        flex: 1,
        minWidth: 200,
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
            padding: "1px 7px",
          }}
        >
          {rows.length}
        </span>
      </div>
      {rows.length === 0 ? (
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>Empty</div>
      ) : (
        rows.slice(0, 20).map((r) => (
          <MatterCard key={r.id} row={r} showRelease={showRelease} />
        ))
      )}
    </div>
  );
}

export function ReleaseControlCenter() {
  const [data, setData] = useState<ReleaseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/releases")
      .then((r) => r.json())
      .then((d) => { setData(d as ReleaseData); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

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
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "rgba(255,255,255,0.9)", margin: 0 }}>
          Release Control Center
        </h1>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: "4px 0 0" }}>
          Document release queue. Operator-only. No automatic releases.
        </p>
      </div>

      {loading && (
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
          Loading release data...
        </div>
      )}

      {data && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const, alignItems: "flex-start" }}>
          {QUEUE_CONFIG.map(({ key, label, color }) => (
            <QueueColumn
              key={key}
              label={label}
              color={color}
              rows={data[key as keyof ReleaseData] ?? []}
              showRelease={key === "ready_for_release"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
