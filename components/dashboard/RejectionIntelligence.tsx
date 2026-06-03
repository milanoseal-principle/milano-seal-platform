"use client";

import { useEffect, useState } from "react";

interface RejectionEvent {
  id: string;
  event_type: string;
  deal_id: string | null;
  destination_country: string | null;
  document_type: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

export function RejectionIntelligence() {
  const [events, setEvents] = useState<RejectionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/rejections")
      .then((r) => r.json())
      .then((d: { events?: RejectionEvent[]; warning?: string }) => {
        setEvents(d.events ?? []);
        if (d.warning) setWarning(d.warning);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Group by country + doctype for pattern view
  const patterns = new Map<string, number>();
  for (const e of events) {
    if (e.destination_country && e.document_type) {
      const key = `${e.destination_country} · ${e.document_type}`;
      patterns.set(key, (patterns.get(key) ?? 0) + 1);
    }
  }
  const patternList = Array.from(patterns.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div style={{ minHeight: "100vh", background: "#050507", padding: "32px 40px", color: "rgba(255,255,255,0.75)" }}>
      <div style={{ marginBottom: 24 }}>
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
          Milano Seal — Intelligence
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "rgba(255,255,255,0.9)", margin: 0 }}>
          Rejection Intelligence
        </h1>
        <p
          style={{
            fontSize: 11,
            color: "rgba(198,165,90,0.6)",
            margin: "6px 0 0",
            fontFamily: "monospace",
            letterSpacing: "0.05em",
          }}
        >
          Rejection Intelligence builds institutional memory. All entries are operator-only.
        </p>
      </div>

      {loading && (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>Loading...</div>
      )}

      {warning && (
        <div
          style={{
            fontSize: 10,
            color: "#f59e0b",
            fontFamily: "monospace",
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: 2,
            padding: "6px 12px",
            marginBottom: 16,
          }}
        >
          Note: {warning}
        </div>
      )}

      {!loading && patternList.length > 0 && (
        <div
          style={{
            background: "rgba(3,3,5,0.9)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 2,
            padding: "16px 20px",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontFamily: "monospace",
              letterSpacing: "0.32em",
              textTransform: "uppercase" as const,
              color: "rgba(198,165,90,0.5)",
              marginBottom: 12,
            }}
          >
            Rejection Patterns — Top corridors
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
            {patternList.map(([key, count]) => (
              <div
                key={key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 10px",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: 2,
                  borderLeft: "2px solid rgba(239,68,68,0.4)",
                }}
              >
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{key}</span>
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: "monospace",
                    color: "#ef4444",
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: 2,
                    padding: "1px 6px",
                  }}
                >
                  {count}×
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && (
        <div
          style={{
            background: "rgba(3,3,5,0.9)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 2,
            padding: "16px 20px",
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontFamily: "monospace",
              letterSpacing: "0.32em",
              textTransform: "uppercase" as const,
              color: "rgba(198,165,90,0.5)",
              marginBottom: 12,
            }}
          >
            Event Log — {events.length} entries
          </div>
          {events.length === 0 ? (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>
              No rejection or block events found.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 11 }}>
              <thead>
                <tr>
                  {["Event", "Country", "Document", "Date", "Resolution"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left" as const,
                        padding: "4px 8px",
                        fontSize: 9,
                        fontFamily: "monospace",
                        letterSpacing: "0.2em",
                        textTransform: "uppercase" as const,
                        color: "rgba(198,165,90,0.5)",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.slice(0, 100).map((e, i) => (
                  <tr
                    key={e.id}
                    style={{
                      borderBottom: i < events.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
                    }}
                  >
                    <td style={{ padding: "7px 8px", color: "#ef4444", fontFamily: "monospace", fontSize: 10 }}>
                      {e.event_type}
                    </td>
                    <td style={{ padding: "7px 8px", color: "rgba(255,255,255,0.6)" }}>
                      {e.destination_country ?? "—"}
                    </td>
                    <td style={{ padding: "7px 8px", color: "rgba(255,255,255,0.5)" }}>
                      {e.document_type ?? "—"}
                    </td>
                    <td style={{ padding: "7px 8px", color: "rgba(255,255,255,0.4)", fontFamily: "monospace", fontSize: 10 }}>
                      {new Date(e.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "7px 8px", color: "rgba(255,255,255,0.3)", fontSize: 10 }}>
                      {(e.metadata as Record<string, unknown>)?.resolution as string ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
