"use client";

import { useEffect, useState } from "react";

interface CourierHealthData {
  labels_created: number;
  tracking_registered: number;
  in_transit_count: number;
  delivered_count: number;
  exception_count: number;
  returned_count: number;
  delivered_not_released_count: number;
  no_data?: boolean;
}

const GOLD = "#C6A55A";

export function CourierHealthCard() {
  const [data, setData] = useState<CourierHealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/shippo/health")
      .then((r) => r.json() as Promise<CourierHealthData>)
      .then(setData)
      .catch(() => setData({ no_data: true } as CourierHealthData))
      .finally(() => setLoading(false));
  }, []);

  const hasData =
    data &&
    !data.no_data &&
    (data.labels_created > 0 ||
      data.tracking_registered > 0 ||
      data.in_transit_count > 0 ||
      data.delivered_count > 0 ||
      data.exception_count > 0 ||
      data.returned_count > 0);

  return (
    <div
      style={{
        background: "#0a0a0a",
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
          marginBottom: 14,
        }}
      >
        Courier Health
      </div>

      {loading && (
        <div style={{ height: 20, background: "rgba(255,255,255,0.03)", borderRadius: 3, maxWidth: 200 }} />
      )}

      {!loading && !hasData && (
        <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
          No courier data yet.
        </p>
      )}

      {!loading && hasData && data && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: 12,
          }}
        >
          {[
            { label: "Labels Created", value: data.labels_created },
            { label: "Tracking Registered", value: data.tracking_registered },
            { label: "In Transit", value: data.in_transit_count },
            { label: "Delivered", value: data.delivered_count, color: "#3FA47A" },
            { label: "Exceptions", value: data.exception_count, color: data.exception_count > 0 ? "#B85C5C" : undefined },
            { label: "Returned", value: data.returned_count, color: data.returned_count > 0 ? "#B85C5C" : undefined },
            { label: "Delivered Not Released", value: data.delivered_not_released_count, color: data.delivered_not_released_count > 0 ? "#C99A3D" : undefined },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div
                style={{
                  fontSize: 8,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.3)",
                  marginBottom: 4,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  fontFamily: "monospace",
                  color: color ?? GOLD,
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
