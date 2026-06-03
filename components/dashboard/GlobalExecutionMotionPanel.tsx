"use client";

import { useEffect, useState } from "react";

interface PipelineCounts {
  intake: number;
  review: number;
  awaiting_payment: number;
  scheduled: number;
  in_execution: number;
  apostille_processing: number;
  in_transit: number;
  delivered: number;
  completed: number;
}

interface CourierCounts {
  label_created: number;
  in_transit: number;
  delivered: number;
  exception: number;
  returned: number;
}

interface MotionData {
  pipeline: PipelineCounts;
  courier: CourierCounts;
  verified_releases: number;
  last_updated: string;
}

const GOLD = "#C6A55A";
const EMERALD = "#3FA47A";
const RED = "#B85C5C";

const PIPELINE_NODES: { key: keyof PipelineCounts; label: string }[] = [
  { key: "intake", label: "Intake" },
  { key: "review", label: "Review" },
  { key: "awaiting_payment", label: "Awaiting Payment" },
  { key: "scheduled", label: "Scheduled" },
  { key: "in_execution", label: "In Execution" },
  { key: "apostille_processing", label: "Apostille" },
  { key: "in_transit", label: "In Transit" },
  { key: "delivered", label: "Delivered" },
  { key: "completed", label: "Completed" },
];

export function GlobalExecutionMotionPanel() {
  const [data, setData] = useState<MotionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/global-execution-motion")
      .then((r) => r.json() as Promise<MotionData>)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      style={{
        background: "#070707",
        border: "1px solid rgba(198,165,90,0.12)",
        borderRadius: 4,
        padding: "20px 24px",
        marginBottom: 24,
      }}
    >
      <div
        style={{
          fontSize: 9,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          fontFamily: "monospace",
          color: "rgba(198,165,90,0.5)",
          marginBottom: 18,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>Global Execution Pipeline</span>
        {data?.last_updated && (
          <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)" }}>
            {new Date(data.last_updated).toLocaleTimeString()}
          </span>
        )}
      </div>

      {loading && (
        <div style={{ height: 60, background: "rgba(255,255,255,0.02)", borderRadius: 3 }} />
      )}

      {!loading && data && (
        <>
          {/* Pipeline flow */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            {PIPELINE_NODES.map((node, i) => {
              const count = data.pipeline[node.key];
              const isLast = i === PIPELINE_NODES.length - 1;
              return (
                <div key={node.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      padding: "6px 10px",
                      borderRadius: 3,
                      background:
                        count > 0
                          ? node.key === "completed"
                            ? "rgba(63,164,122,0.08)"
                            : "rgba(198,165,90,0.06)"
                          : "rgba(255,255,255,0.02)",
                      border: `1px solid ${count > 0 ? (node.key === "completed" ? EMERALD + "30" : GOLD + "25") : "rgba(255,255,255,0.06)"}`,
                      textAlign: "center" as const,
                      minWidth: 60,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        fontFamily: "monospace",
                        color:
                          count > 0
                            ? node.key === "completed"
                              ? EMERALD
                              : GOLD
                            : "rgba(255,255,255,0.2)",
                      }}
                    >
                      {count}
                    </div>
                    <div
                      style={{
                        fontSize: 7,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.3)",
                        marginTop: 2,
                      }}
                    >
                      {node.label}
                    </div>
                  </div>
                  {!isLast && (
                    <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 10 }}>→</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Courier row */}
          <div style={{ borderTop: "1px solid rgba(198,165,90,0.08)", paddingTop: 16 }}>
            <div
              style={{
                fontSize: 8,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.25)",
                marginBottom: 10,
              }}
            >
              Courier Status
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px" }}>
              {[
                { label: "Label Created", value: data.courier.label_created, color: GOLD },
                { label: "In Transit", value: data.courier.in_transit, color: GOLD },
                { label: "Delivered", value: data.courier.delivered, color: EMERALD },
                { label: "Exceptions", value: data.courier.exception, color: data.courier.exception > 0 ? RED : "rgba(255,255,255,0.2)" },
                { label: "Returned", value: data.courier.returned, color: data.courier.returned > 0 ? RED : "rgba(255,255,255,0.2)" },
                { label: "Verified Releases", value: data.verified_releases, color: EMERALD },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ textAlign: "center" as const }}>
                  <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "monospace", color }}>
                    {value}
                  </div>
                  <div style={{ fontSize: 7, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!loading && !data && (
        <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>
          Pipeline data unavailable.
        </p>
      )}
    </div>
  );
}
