"use client";

import { useEffect, useState } from "react";

interface MonthPoint { month: string; count: number; revenue: number; }
interface CountryRevenue { country: string; revenue: number; }
interface SourceRevenue { source_type: string; count: number; }

interface ExecData {
  cash_collected: number;
  pipeline_value: number;
  open_matters: number;
  revenue_by_country: CountryRevenue[];
  revenue_by_source: SourceRevenue[];
  monthly_trend: MonthPoint[];
  authority_verification_pct: number;
  total_authorities: number;
  verified_authorities: number;
}

function Sparkline({ data }: { data: MonthPoint[] }) {
  if (!data.length) return null;
  const maxRev = Math.max(...data.map((d) => d.revenue), 1);
  const W = 320, H = 60, PAD = 8;
  const pts = data.map((d, i) => {
    const x = PAD + (i / Math.max(data.length - 1, 1)) * (W - PAD * 2);
    const y = H - PAD - ((d.revenue / maxRev) * (H - PAD * 2));
    return `${x},${y}`;
  });
  return (
    <svg width={W} height={H} style={{ display: "block" }}>
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke="#C6A55A"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {data.map((d, i) => {
        const x = PAD + (i / Math.max(data.length - 1, 1)) * (W - PAD * 2);
        const y = H - PAD - ((d.revenue / maxRev) * (H - PAD * 2));
        return (
          <circle key={i} cx={x} cy={y} r={2.5} fill="#C6A55A" />
        );
      })}
    </svg>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
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
          marginBottom: 10,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 30, fontWeight: 700, fontFamily: "monospace", color: "#C6A55A" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4, fontFamily: "monospace" }}>{sub}</div>}
    </div>
  );
}

export function ExecutiveDashboard() {
  const [data, setData] = useState<ExecData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/executive")
      .then((r) => r.json())
      .then((d) => { setData(d as ExecData); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#050507", padding: "32px 40px", color: "rgba(255,255,255,0.75)" }}>
      <div style={{ marginBottom: 32 }}>
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
          Milano Seal — Executive
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "rgba(255,255,255,0.9)", margin: 0 }}>
          Executive Dashboard
        </h1>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", margin: "4px 0 0" }}>
          Real-time financial and operational intelligence. Operator access only.
        </p>
      </div>

      {loading && (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>Loading...</div>
      )}

      {data && (
        <>
          {/* KPI row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
            <Stat label="Cash Collected" value={`$${data.cash_collected.toLocaleString()}`} sub="paid & completed matters" />
            <Stat label="Pipeline Value" value={`$${data.pipeline_value.toLocaleString()}`} sub="open matters" />
            <Stat label="Open Matters" value={String(data.open_matters)} sub="not completed or closed" />
          </div>

          {/* Revenue by Country */}
          <div
            style={{
              background: "rgba(3,3,5,0.9)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 2,
              padding: "20px 24px",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontFamily: "monospace",
                letterSpacing: "0.32em",
                textTransform: "uppercase" as const,
                color: "rgba(198,165,90,0.5)",
                marginBottom: 14,
              }}
            >
              Revenue by Country — Top 5
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
              {data.revenue_by_country.map((r) => {
                const pct = data.revenue_by_country[0]?.revenue
                  ? (r.revenue / data.revenue_by_country[0].revenue) * 100
                  : 0;
                return (
                  <div key={r.country} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 120, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{r.country}</div>
                    <div
                      style={{
                        flex: 1,
                        height: 6,
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
                        width: 90,
                        textAlign: "right" as const,
                        fontFamily: "monospace",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "#C6A55A",
                      }}
                    >
                      ${r.revenue.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            {/* Monthly Trend */}
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
                  marginBottom: 14,
                }}
              >
                Monthly Trend — 6 months
              </div>
              <Sparkline data={data.monthly_trend} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                {data.monthly_trend.map((m) => (
                  <div
                    key={m.month}
                    style={{ textAlign: "center" as const, fontSize: 8, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}
                  >
                    {m.month.slice(5)}
                    <br />
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>{m.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Authority Verification */}
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
                  marginBottom: 14,
                }}
              >
                Authority Verification Progress
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, fontFamily: "monospace", color: "#C6A55A", marginBottom: 8 }}>
                {data.authority_verification_pct}%
              </div>
              <div
                style={{
                  height: 8,
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 4,
                  overflow: "hidden",
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    width: `${data.authority_verification_pct}%`,
                    height: "100%",
                    background: data.authority_verification_pct >= 80 ? "#4a9e6b" : data.authority_verification_pct >= 50 ? "#f59e0b" : "#ef4444",
                    borderRadius: 4,
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
                {data.verified_authorities} of {data.total_authorities} authorities verified
              </div>
            </div>
          </div>

          {/* Revenue by Source */}
          {data.revenue_by_source.length > 0 && (
            <div
              style={{
                background: "rgba(3,3,5,0.9)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 2,
                padding: "20px 24px",
                marginBottom: 16,
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
                Referrals by Source
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const }}>
                {data.revenue_by_source.map((s) => (
                  <div
                    key={s.source_type}
                    style={{
                      padding: "8px 14px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 2,
                    }}
                  >
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "monospace", marginBottom: 4 }}>
                      {s.source_type}
                    </div>
                    <div style={{ fontSize: 16, fontFamily: "monospace", fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>
                      {s.count}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.04)",
              paddingTop: 12,
              fontSize: 9,
              color: "rgba(255,255,255,0.2)",
              fontFamily: "monospace",
              letterSpacing: "0.08em",
            }}
          >
            Executive view — operator access only. Data is real-time from production.
          </div>
        </>
      )}
    </div>
  );
}
