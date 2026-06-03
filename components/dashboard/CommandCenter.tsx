"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

// ── Types ──────────────────────────────────────────────────────────────────────

interface PaidDeal {
  total_price: number;
  created_at: string;
  destination_country: string;
  document_type: string;
  lane: string | null;
  matter_status: string;
}

interface OpenDeal {
  total_price: number;
  conversion_score: number | null;
  matter_status: string;
  destination_country: string;
  client_name: string | null;
  created_at: string;
}

interface ActiveMatter {
  id: string;
  client_name: string | null;
  matter_status: string;
  destination_country: string;
  apostille_at: string | null;
  updated_at: string;
  total_price: number;
  created_at: string;
}

interface ReleaseMatter {
  id: string;
  client_name: string | null;
  matter_status: string;
}

interface StaleMatter {
  id: string;
  client_name: string | null;
  matter_status: string;
  updated_at: string;
}

interface Props {
  paidDeals: PaidDeal[];
  openDeals: OpenDeal[];
  activeMatters: ActiveMatter[];
  releasesReady: ReleaseMatter[];
  staleMatters: StaleMatter[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

function fmtSmall(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

function daysAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function truncate(s: string | null | undefined, len: number): string {
  if (!s) return "—";
  return s.length > len ? s.slice(0, len) + "…" : s;
}

function statusLabel(s: string): string {
  return s.replace(/_/g, " ").toUpperCase();
}

function statusColor(status: string): string {
  if (status.includes("cancel") || status.includes("reject")) return "#ef4444";
  if (status.includes("complete") || status.includes("release")) return "#4a9e6b";
  if (status.includes("apostille") || status.includes("notariz")) return "#C6A55A";
  if (status.includes("wait") || status.includes("pending")) return "#f59e0b";
  return "rgba(255,255,255,0.5)";
}

function riskColor(matter: ActiveMatter, staleIds: Set<string>): string {
  if (staleIds.has(matter.id)) return "#ef4444";
  if (
    matter.matter_status.includes("wait") ||
    matter.matter_status.includes("pending")
  )
    return "#f59e0b";
  return "#4a9e6b";
}

function getMonthlyRevenue(paidDeals: PaidDeal[]): { label: string; value: number; isCurrent: boolean }[] {
  const now = new Date();
  const months: { label: string; value: number; isCurrent: boolean }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("en-US", { month: "short" });
    const y = d.getFullYear();
    const m = d.getMonth();
    const value = paidDeals
      .filter((deal) => {
        const dt = new Date(deal.created_at);
        return dt.getFullYear() === y && dt.getMonth() === m;
      })
      .reduce((sum, d) => sum + (d.total_price || 0), 0);
    months.push({ label, value, isCurrent: i === 0 });
  }
  return months;
}

function getTopCountries(paidDeals: PaidDeal[]): { country: string; value: number }[] {
  const map: Record<string, number> = {};
  for (const deal of paidDeals) {
    const c = deal.destination_country || "Unknown";
    map[c] = (map[c] || 0) + (deal.total_price || 0);
  }
  return Object.entries(map)
    .map(([country, value]) => ({ country, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
}

// ── Animated Number ────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 700): number {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (target === 0) {
      setCurrent(0);
      return;
    }
    const start = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      setCurrent(Math.round(ease(progress) * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return current;
}

// ── Live Clock ─────────────────────────────────────────────────────────────────

function LiveClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      const s = String(now.getSeconds()).padStart(2, "0");
      setTime(`${h}:${m}:${s} EST`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      style={{
        fontFamily: "monospace",
        fontSize: 12,
        color: "rgba(255,255,255,0.45)",
        letterSpacing: "0.12em",
      }}
    >
      {time}
    </span>
  );
}

// ── Stat Chip ──────────────────────────────────────────────────────────────────

interface ChipProps {
  label: string;
  value: number;
  sub?: string;
  format?: "currency" | "count";
  alert?: "gold" | "red" | null;
}

function StatChip({ label, value, sub, format = "count", alert }: ChipProps) {
  const animated = useCountUp(value, 700);
  const displayed =
    format === "currency" ? fmt(animated) : String(animated);

  const borderColor =
    alert === "red"
      ? "rgba(239,68,68,0.5)"
      : alert === "gold"
      ? "rgba(198,165,90,0.4)"
      : "rgba(212,175,55,0.08)";

  const valueColor =
    alert === "red" && value > 0 ? "#ef4444" : "rgba(255,255,255,0.9)";

  return (
    <div
      style={{
        background: "rgba(8,5,1,0.97)",
        border: `1px solid ${borderColor}`,
        borderRadius: 4,
        padding: "12px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        boxShadow:
          alert === "red" && value > 0
            ? "0 0 0 1px rgba(239,68,68,0.2)"
            : alert === "gold" && value > 0
            ? "0 0 0 1px rgba(198,165,90,0.4)"
            : "0 0 0 1px rgba(212,175,55,0.08)",
        flex: 1,
        minWidth: 0,
        animation:
          alert === "red" && value > 0 ? "pulse-border 2s ease infinite" : undefined,
      }}
    >
      <span
        style={{
          fontFamily: "monospace",
          fontSize: 9,
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          color: "rgba(198,165,90,0.5)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "monospace",
          fontSize: 28,
          fontWeight: 700,
          color: valueColor,
          lineHeight: 1,
        }}
      >
        {displayed}
      </span>
      {sub && (
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 10,
            color: "rgba(255,255,255,0.35)",
          }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

// ── Revenue Bar Strip ──────────────────────────────────────────────────────────

function RevenueBarStrip({ months }: { months: { label: string; value: number; isCurrent: boolean }[] }) {
  const maxVal = Math.max(...months.map((m) => m.value), 1);
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "flex-end",
        height: "100%",
        padding: "0 4px",
      }}
    >
      {months.map((m, i) => {
        const pct = m.value / maxVal;
        const barH = Math.round(pct * 48);
        return (
          <div
            key={m.label}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              flex: 1,
            }}
          >
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 8,
                color: "rgba(255,255,255,0.35)",
              }}
            >
              {m.value > 0 ? fmtSmall(m.value) : "—"}
            </span>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: barH }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              style={{
                width: "100%",
                background: "#C6A55A",
                opacity: m.isCurrent ? 1 : 0.6,
                borderRadius: 2,
                minHeight: barH > 0 ? 2 : 0,
              }}
            />
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 8,
                color: "rgba(198,165,90,0.5)",
                letterSpacing: "0.1em",
              }}
            >
              {m.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Country Bar ────────────────────────────────────────────────────────────────

function CountryBars({ countries }: { countries: { country: string; value: number }[] }) {
  const maxVal = Math.max(...countries.map((c) => c.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {countries.map((c, i) => {
        const pct = c.value / maxVal;
        return (
          <div key={c.country} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span
                style={{
                  fontFamily: "serif",
                  fontSize: 11,
                  color: "rgba(255,255,255,0.75)",
                }}
              >
                {c.country}
              </span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 10,
                  color: "#C6A55A",
                }}
              >
                {fmtSmall(c.value)}
              </span>
            </div>
            <div
              style={{
                height: 2,
                background: "rgba(212,175,55,0.08)",
                borderRadius: 1,
                overflow: "hidden",
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.round(pct * 100)}%` }}
                transition={{ duration: 0.4, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  height: "100%",
                  background: "#C6A55A",
                  opacity: 0.7,
                  borderRadius: 1,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Section Label ──────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: "monospace",
        fontSize: 9,
        letterSpacing: "0.32em",
        textTransform: "uppercase",
        color: "rgba(198,165,90,0.5)",
        display: "block",
        marginBottom: 8,
      }}
    >
      {children}
    </span>
  );
}

// ── Panel ──────────────────────────────────────────────────────────────────────

function Panel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: "rgba(8,5,1,0.97)",
        border: "1px solid rgba(212,175,55,0.08)",
        borderRadius: 4,
        padding: 12,
        boxShadow: "0 0 0 1px rgba(212,175,55,0.08)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Main CommandCenter ─────────────────────────────────────────────────────────

export function CommandCenter({
  paidDeals,
  openDeals,
  activeMatters,
  releasesReady,
  staleMatters,
}: Props) {
  // Derived values
  const cashCollected = paidDeals.reduce((s, d) => s + (d.total_price || 0), 0);
  const pipelineValue = openDeals.reduce(
    (s, d) => s + (d.total_price || 0) * ((d.conversion_score || 0) / 100),
    0
  );
  const staleIds = new Set(staleMatters.map((s) => s.id));

  const monthlyRevenue = getMonthlyRevenue(paidDeals);
  const topCountries = getTopCountries(paidDeals);

  // Forecast
  const avgDealSize =
    openDeals.length > 0
      ? openDeals.reduce((s, d) => s + (d.total_price || 0), 0) / openDeals.length
      : 0;

  const likely30 = openDeals
    .filter((d) => (d.conversion_score || 0) >= 50)
    .reduce((s, d) => s + (d.total_price || 0) * ((d.conversion_score || 0) / 100), 0);

  const likely60 = openDeals.reduce(
    (s, d) => s + (d.total_price || 0) * ((d.conversion_score || 0) / 100),
    0
  );

  const likely90 = likely60 + openDeals.length * avgDealSize * 0.3;
  const likelyClosings = openDeals.filter((d) => (d.conversion_score || 0) >= 70).length;

  // Trust strip
  const verifiedDeliveries = paidDeals.filter((d) => d.matter_status === "completed").length;

  // Today date
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        background: "#050507",
        minHeight: "100vh",
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        fontFamily: "system-ui, sans-serif",
        color: "rgba(255,255,255,0.85)",
      }}
    >
      <style>{`
        @keyframes pulse-border {
          0%, 100% { box-shadow: 0 0 0 1px rgba(239,68,68,0.2); }
          50% { box-shadow: 0 0 0 1px rgba(239,68,68,0.5); }
        }
      `}</style>

      {/* ── Header strip ──────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(212,175,55,0.08)",
          paddingBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 10,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "#C6A55A",
            }}
          >
            The Milano Seal™
          </span>
          <span
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 18,
              color: "rgba(255,255,255,0.9)",
              fontWeight: 400,
            }}
          >
            Command Center
          </span>
        </div>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 10,
              color: "rgba(255,255,255,0.35)",
              letterSpacing: "0.1em",
            }}
          >
            {today}
          </span>
          <LiveClock />
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 9,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(198,165,90,0.5)",
              borderLeft: "1px solid rgba(212,175,55,0.1)",
              paddingLeft: 16,
            }}
          >
            OPERATOR: N. MILANO
          </span>
        </div>
      </div>

      {/* ── Stat chips ──────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 12 }}>
        <StatChip
          label="Cash Collected"
          value={cashCollected}
          format="currency"
          sub="all time, paid matters"
        />
        <StatChip
          label="Pipeline Value"
          value={pipelineValue}
          format="currency"
          sub="probability-weighted"
        />
        <StatChip
          label="Active Matters"
          value={activeMatters.length}
          format="count"
          sub="in execution"
        />
        <StatChip
          label="Releases Ready"
          value={releasesReady.length}
          format="count"
          sub="awaiting dispatch"
          alert={releasesReady.length > 0 ? "gold" : null}
        />
        <StatChip
          label="Risk Alerts"
          value={staleMatters.length}
          format="count"
          sub="stale 7+ days"
          alert={staleMatters.length > 0 ? "red" : null}
        />
      </div>

      {/* ── Active matter queue ──────────────────────────────────────────── */}
      <Panel>
        <SectionLabel>Active Matter Queue — Top 8</SectionLabel>
        {activeMatters.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "rgba(255,255,255,0.25)",
              fontFamily: "monospace",
              fontSize: 11,
              padding: "16px 0",
            }}
          >
            No active matters
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Client", "Country", "Status", "Days", "Value", "Risk"].map((h) => (
                  <th
                    key={h}
                    style={{
                      fontFamily: "monospace",
                      fontSize: 8,
                      letterSpacing: "0.28em",
                      textTransform: "uppercase",
                      color: "rgba(198,165,90,0.4)",
                      textAlign: "left",
                      paddingBottom: 8,
                      fontWeight: 400,
                      borderBottom: "1px solid rgba(212,175,55,0.06)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeMatters.map((matter, i) => (
                <motion.tr
                  key={matter.id}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.25 }}
                  style={{ cursor: "default" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background =
                      "rgba(212,175,55,0.03)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = "transparent";
                  }}
                >
                  <td
                    style={{
                      fontFamily: "Georgia, serif",
                      fontSize: 12,
                      color: "rgba(255,255,255,0.8)",
                      padding: "7px 8px 7px 0",
                      maxWidth: 140,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {truncate(matter.client_name, 18)}
                  </td>
                  <td
                    style={{
                      fontFamily: "monospace",
                      fontSize: 10,
                      color: "rgba(255,255,255,0.5)",
                      padding: "7px 8px",
                    }}
                  >
                    {truncate(matter.destination_country, 10)}
                  </td>
                  <td style={{ padding: "7px 8px" }}>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 8,
                        letterSpacing: "0.1em",
                        color: statusColor(matter.matter_status),
                        background: `${statusColor(matter.matter_status)}14`,
                        padding: "2px 6px",
                        borderRadius: 2,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {statusLabel(matter.matter_status).slice(0, 20)}
                    </span>
                  </td>
                  <td
                    style={{
                      fontFamily: "monospace",
                      fontSize: 11,
                      color: "rgba(255,255,255,0.55)",
                      padding: "7px 8px",
                      textAlign: "right",
                    }}
                  >
                    {daysAgo(matter.created_at)}d
                  </td>
                  <td
                    style={{
                      fontFamily: "monospace",
                      fontSize: 11,
                      color: "#C6A55A",
                      padding: "7px 8px",
                      textAlign: "right",
                    }}
                  >
                    {fmtSmall(matter.total_price)}
                  </td>
                  <td style={{ padding: "7px 0", textAlign: "center" }}>
                    <span
                      style={{
                        color: riskColor(matter, staleIds),
                        fontSize: 14,
                        lineHeight: 1,
                      }}
                    >
                      ●
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      {/* ── Revenue bar strip ───────────────────────────────────────────── */}
      <Panel style={{ height: 100 }}>
        <SectionLabel>Revenue — Last 6 Months</SectionLabel>
        <div style={{ height: 68 }}>
          <RevenueBarStrip months={monthlyRevenue} />
        </div>
      </Panel>

      {/* ── Bottom two-column ───────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, flex: 1 }}>
        {/* Left — Top Countries */}
        <Panel>
          <SectionLabel>Top Countries by Revenue</SectionLabel>
          {topCountries.length === 0 ? (
            <div
              style={{
                color: "rgba(255,255,255,0.25)",
                fontFamily: "monospace",
                fontSize: 11,
              }}
            >
              No data
            </div>
          ) : (
            <CountryBars countries={topCountries} />
          )}
        </Panel>

        {/* Right — Forecast */}
        <Panel>
          <SectionLabel>Forecast &amp; Pipeline Intelligence</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
            {[
              { label: "30d Likely", value: likely30, note: "score ≥ 50" },
              { label: "60d Likely", value: likely60, note: "all open" },
              { label: "90d Est.*", value: likely90, note: "*+30% growth" },
            ].map((item) => (
              <div key={item.label}>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 8,
                    letterSpacing: "0.24em",
                    textTransform: "uppercase",
                    color: "rgba(198,165,90,0.45)",
                    marginBottom: 4,
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#C6A55A",
                    lineHeight: 1,
                    marginBottom: 2,
                  }}
                >
                  {fmt(item.value)}
                </div>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: 8,
                    color: "rgba(255,255,255,0.3)",
                  }}
                >
                  {item.note}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              borderTop: "1px solid rgba(212,175,55,0.06)",
              paddingTop: 12,
              display: "flex",
              gap: 24,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 8,
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: "rgba(198,165,90,0.45)",
                  marginBottom: 3,
                }}
              >
                Likely Closings
              </div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.85)",
                }}
              >
                {likelyClosings}
              </div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 8,
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                score ≥ 70
              </div>
            </div>
            <div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 8,
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: "rgba(198,165,90,0.45)",
                  marginBottom: 3,
                }}
              >
                Expected Releases
              </div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 20,
                  fontWeight: 700,
                  color: releasesReady.length > 0 ? "#4a9e6b" : "rgba(255,255,255,0.85)",
                }}
              >
                {releasesReady.length}
              </div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 8,
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                ready for dispatch
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {/* ── Trust strip ─────────────────────────────────────────────────── */}
      <div
        style={{
          borderTop: "1px solid rgba(212,175,55,0.06)",
          paddingTop: 12,
          display: "flex",
          gap: 32,
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 8,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "rgba(198,165,90,0.35)",
          }}
        >
          Trust Metrics
        </span>
        {[
          { label: "Verified Deliveries", value: verifiedDeliveries },
          { label: "Verified Authorities", value: 0 },
          { label: "Verified Corridors", value: 0 },
          { label: "Verified Partners", value: 0 },
        ].map((metric) => (
          <div key={metric.label} style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 16,
                fontWeight: 700,
                color: metric.value > 0 ? "#4a9e6b" : "rgba(255,255,255,0.2)",
              }}
            >
              {metric.value}
            </span>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 9,
                color: "rgba(255,255,255,0.3)",
                letterSpacing: "0.08em",
              }}
            >
              {metric.label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
