"use client";

import { useEffect, useState } from "react";

interface CountryRow {
  country: string;
  matter_count: number;
  open_count: number;
  revenue: number;
  blocked_count: number;
  avg_completion_days: number | null;
}

const COUNTRY_FLAGS: Record<string, string> = {
  Italy: "🇮🇹", Portugal: "🇵🇹", Mexico: "🇲🇽", Spain: "🇪🇸",
  France: "🇫🇷", Germany: "🇩🇪", Brazil: "🇧🇷", Argentina: "🇦🇷",
  Colombia: "🇨🇴", Peru: "🇵🇪", Chile: "🇨🇱", Japan: "🇯🇵",
  China: "🇨🇳", UAE: "🇦🇪", UK: "🇬🇧", Canada: "🇨🇦",
};

export function CountryOpsCenter() {
  const [data, setData] = useState<CountryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/country-ops")
      .then((r) => r.json())
      .then((d: { countries?: CountryRow[] }) => {
        setData(d.countries ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const maxRevenue = Math.max(...data.map((r) => r.revenue), 1);

  return (
    <div
      style={{
        background: "rgba(3,3,5,0.9)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 2,
        padding: "20px 24px",
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontFamily: "monospace",
          letterSpacing: "0.32em",
          textTransform: "uppercase" as const,
          color: "rgba(198,165,90,0.5)",
          marginBottom: 16,
        }}
      >
        Country Operations — {data.length} active corridors
      </div>

      {loading && (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
          Loading...
        </div>
      )}

      {!loading && data.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 12 }}>
          <thead>
            <tr>
              {["Country", "Open", "Revenue", "Avg Days", "Blocked", "Status"].map((h) => (
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
                    whiteSpace: "nowrap" as const,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const isHighRevenue = row.revenue > maxRevenue * 0.4;
              return (
                <tr
                  key={row.country}
                  style={{
                    borderBottom: i < data.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
                    background: isHighRevenue ? "rgba(198,165,90,0.03)" : "transparent",
                  }}
                >
                  <td style={{ padding: "8px 8px", color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
                    {COUNTRY_FLAGS[row.country] ?? "🌍"} {row.country}
                  </td>
                  <td style={{ padding: "8px 8px", color: "rgba(255,255,255,0.6)", fontFamily: "monospace" }}>
                    {row.open_count}
                  </td>
                  <td
                    style={{
                      padding: "8px 8px",
                      fontFamily: "monospace",
                      fontWeight: 600,
                      color: isHighRevenue ? "#C6A55A" : "rgba(255,255,255,0.6)",
                    }}
                  >
                    ${row.revenue.toLocaleString()}
                  </td>
                  <td style={{ padding: "8px 8px", color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>
                    {row.avg_completion_days != null ? `${row.avg_completion_days}d` : "—"}
                  </td>
                  <td style={{ padding: "8px 8px" }}>
                    {row.blocked_count > 0 ? (
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
                        {row.blocked_count} blocked
                      </span>
                    ) : (
                      <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 10 }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "8px 8px" }}>
                    <span
                      style={{
                        fontSize: 9,
                        fontFamily: "monospace",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase" as const,
                        color: row.open_count > 0 ? "#4a9e6b" : "rgba(255,255,255,0.25)",
                      }}
                    >
                      {row.open_count > 0 ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
