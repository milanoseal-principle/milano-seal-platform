"use client";

import { useEffect, useState } from "react";

interface CountryRow {
  country: string;
  matter_count: number;
  open_count: number;
  blocked_count: number;
  revenue: number;
}

interface ExecControlItem {
  id: string;
  client_name_masked: string;
  matter_status: string;
  destination_country: string;
  document_type: string;
  days_blocked: number;
  severity: string;
}

interface ExecData {
  blocked_7d?: ExecControlItem[];
  blocked_3d?: ExecControlItem[];
  translation_issues?: ExecControlItem[];
}

export function IntelligenceCommandCenter2() {
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [execData, setExecData] = useState<ExecData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/country-ops").then((r) => r.json()).catch(() => ({ countries: [] })),
      fetch("/api/dashboard/execution-control").then((r) => r.json()).catch(() => ({})),
    ]).then(([countryResp, exec]: [{ countries?: CountryRow[] }, ExecData]) => {
      setCountries((countryResp.countries ?? []).filter((c) => c.blocked_count > 0).slice(0, 5));
      setExecData(exec);
      setLoading(false);
    });
  }, []);

  // Top delayed translation countries from exec data
  const translationDemand = new Map<string, number>();
  for (const item of execData?.translation_issues ?? []) {
    translationDemand.set(item.destination_country, (translationDemand.get(item.destination_country) ?? 0) + 1);
  }
  const translationList = Array.from(translationDemand.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Revenue corridors from countries
  const corridors = countries.slice(0, 5).map((c) => ({
    key: c.country,
    value: c.revenue,
  }));

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
          marginBottom: 20,
        }}
      >
        Execution Center 2.0
      </div>

      {loading && (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>Loading...</div>
      )}

      {!loading && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Top Blocked Countries */}
          <div>
            <div
              style={{
                fontSize: 9,
                fontFamily: "monospace",
                letterSpacing: "0.2em",
                textTransform: "uppercase" as const,
                color: "rgba(198,165,90,0.5)",
                marginBottom: 10,
              }}
            >
              Top Blocked Countries
            </div>
            {countries.length === 0 ? (
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>None</div>
            ) : (
              countries.map((c) => (
                <div
                  key={c.country}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "5px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: "rgba(255,255,255,0.7)" }}>{c.country}</span>
                  <span style={{ color: "#ef4444", fontFamily: "monospace", fontWeight: 600 }}>
                    {c.blocked_count} blocked
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Translation Demand */}
          <div>
            <div
              style={{
                fontSize: 9,
                fontFamily: "monospace",
                letterSpacing: "0.2em",
                textTransform: "uppercase" as const,
                color: "rgba(198,165,90,0.5)",
                marginBottom: 10,
              }}
            >
              Translation Demand
            </div>
            {translationList.length === 0 ? (
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>No pending</div>
            ) : (
              translationList.map(([country, count]) => (
                <div
                  key={country}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "5px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: "rgba(255,255,255,0.7)" }}>{country}</span>
                  <span style={{ color: "#f59e0b", fontFamily: "monospace" }}>{count} open</span>
                </div>
              ))
            )}
          </div>

          {/* Revenue by Corridor */}
          <div style={{ gridColumn: "span 2" }}>
            <div
              style={{
                fontSize: 9,
                fontFamily: "monospace",
                letterSpacing: "0.2em",
                textTransform: "uppercase" as const,
                color: "rgba(198,165,90,0.5)",
                marginBottom: 10,
              }}
            >
              Revenue by Country (Top 5)
            </div>
            {corridors.length === 0 ? (
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>No data</div>
            ) : (
              corridors.map((c) => {
                const maxVal = corridors[0]?.value ?? 1;
                const pct = maxVal > 0 ? (c.value / maxVal) * 100 : 0;
                return (
                  <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <div style={{ width: 120, fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{c.key}</div>
                    <div
                      style={{
                        flex: 1,
                        height: 5,
                        background: "rgba(255,255,255,0.05)",
                        borderRadius: 2,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: "#C6A55A",
                          borderRadius: 2,
                        }}
                      />
                    </div>
                    <div
                      style={{
                        width: 80,
                        textAlign: "right" as const,
                        fontFamily: "monospace",
                        fontSize: 11,
                        color: "#C6A55A",
                      }}
                    >
                      ${c.value.toLocaleString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
