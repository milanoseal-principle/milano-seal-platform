"use client";

import { useApi } from "@/hooks/useApi";

interface AccessEvent {
  id: string;
  event: string;
  actor: string | null;
  resource: string | null;
  created_at: string;
}

interface ApiResponse {
  events: AccessEvent[];
}

function eventLabel(event: string): string {
  switch (event) {
    case "resource.view":
      return "Document Viewed";
    case "resource.download":
      return "Document Downloaded";
    case "resource.signed_url_generated":
      return "Signed URL Generated";
    case "resource.upload":
      return "Document Uploaded";
    case "resource.access.denied":
      return "Access Denied";
    default: {
      const words = event.replace(/\./g, " ");
      return words.charAt(0).toUpperCase() + words.slice(1);
    }
  }
}

function timeAgoShort(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

const gold = "rgba(198,165,90,0.5)";
const textMuted = "rgba(255,255,255,0.28)";

export function CustodyAccessAuditPanel() {
  const { data, isLoading } = useApi<ApiResponse>("/api/dashboard/access-audit");
  const events = data?.events ?? [];

  const containerStyle: React.CSSProperties = {
    background: "rgba(8,5,1,0.97)",
    border: "1px solid rgba(212,175,55,0.08)",
    padding: "1.5rem",
  };

  return (
    <div style={containerStyle}>
      <p
        style={{
          color: gold,
          fontSize: 9,
          fontFamily: "monospace",
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          marginBottom: "1.25rem",
        }}
      >
        Custody Access Audit
      </p>

      {isLoading && (
        <div style={{ color: textMuted, fontSize: 12 }}>Loading…</div>
      )}

      {!isLoading && events.length === 0 && (
        <p style={{ color: textMuted, fontSize: 13, textAlign: "center", paddingTop: "1.5rem", paddingBottom: "1.5rem" }}>
          No document access events recorded for the selected period.
        </p>
      )}

      {!isLoading && events.length > 0 && (
        <div>
          {/* Column headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "80px 1fr 1fr 1fr",
              gap: "0.5rem",
              paddingBottom: "0.5rem",
              borderBottom: "1px solid rgba(198,165,90,0.08)",
              marginBottom: "0.5rem",
            }}
          >
            {["Time", "Event", "Actor", "Resource"].map((h) => (
              <span
                key={h}
                style={{
                  fontSize: 9,
                  fontFamily: "monospace",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "rgba(198,165,90,0.3)",
                }}
              >
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {events.map((e) => (
            <div
              key={e.id}
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr 1fr 1fr",
                gap: "0.5rem",
                padding: "0.5rem 0",
                borderBottom: "1px solid rgba(255,255,255,0.03)",
                alignItems: "center",
              }}
            >
              <span style={{ color: textMuted, fontSize: 10, fontFamily: "monospace" }}>
                {timeAgoShort(e.created_at)}
              </span>
              <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>
                {eventLabel(e.event)}
              </span>
              <span
                style={{
                  color: textMuted,
                  fontSize: 11,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {e.actor ?? "—"}
              </span>
              <span
                style={{
                  color: textMuted,
                  fontSize: 11,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {e.resource ?? "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
