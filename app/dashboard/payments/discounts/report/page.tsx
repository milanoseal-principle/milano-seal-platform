"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface MonetaryTotal {
  currency: string;
  eligible_value: number;
  discounted_value: number;
  adjusted_matter_value: number;
}

interface ReportRow {
  id: string;
  code: string;
  discount_value: number;
  status: string;
  usage_limit: number | null;
  usage_count: number;
  redemption_rate: number | null;
  redeemed_matter_count: number;
  monetary_totals: MonetaryTotal[];
  repeat_client_rate: number | null;
  alliance_member_id: string | null;
  partner_referral_volume: number;
  service_scope: string;
}

interface ReportBody {
  generated_at: string;
  revenue_note: string;
  totals: {
    codes: number;
    active_codes: number;
    redeemed_matters: number;
    monetary_totals: MonetaryTotal[];
    partner_referrals: number;
  };
  rows: ReportRow[];
  error?: string;
}

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function pct(value: number | null) {
  if (value == null) return "—";
  return `${Math.round(value * 1000) / 10}%`;
}

function monetarySummary(items: MonetaryTotal[], key: keyof Omit<MonetaryTotal, "currency">) {
  if (items.length === 0) return "—";
  return items.map((item) => `${item.currency} ${money(item[key], item.currency)}`).join(" · ");
}

export default function DiscountReportPage() {
  const [report, setReport] = useState<ReportBody | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    const response = await fetch("/api/dashboard/discounts/report", { cache: "no-store" });
    const body = (await response.json()) as ReportBody;
    if (!response.ok) {
      setError(body.error ?? "Unable to load discount report");
      return;
    }
    setReport(body);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div style={{ padding: "32px 28px", minHeight: "100vh", background: "#050505", color: "#F6F1E6" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gap: 22 }}>
        <header style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(198,165,90,0.55)" }}>
              Payments / Discount Governance / Reporting
            </div>
            <h1 style={{ margin: "7px 0 0", fontFamily: "'Playfair Display', Georgia, serif", fontSize: 30 }}>
              Courtesy Program Intelligence
            </h1>
            <p style={{ maxWidth: 780, margin: "8px 0 0", fontSize: 12, lineHeight: 1.6, color: "rgba(246,241,230,0.56)" }}>
              Auditable code performance, redeemed Matter value, discount value, repeat-client signal, and Alliance referral attribution. Monetary totals stay separated by original currency. Wise reconciliation remains authoritative for paid revenue.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link href="/dashboard/payments/discounts" style={secondaryLink}>Manage Codes</Link>
            <button type="button" onClick={() => void load()} style={secondaryButton}>Refresh</button>
          </div>
        </header>

        {error && <div style={{ padding: 12, border: "1px solid rgba(184,92,92,0.28)", borderRadius: 8, color: "#D78484", fontSize: 12 }}>{error}</div>}

        {!report ? (
          <div style={{ padding: 32, color: "rgba(246,241,230,0.42)", fontSize: 12 }}>Loading governed report…</div>
        ) : (
          <>
            <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(155px,1fr))", gap: 10 }}>
              {[
                ["Active Codes", report.totals.active_codes],
                ["Redeemed Matters", report.totals.redeemed_matters],
                ["Eligible Value", monetarySummary(report.totals.monetary_totals, "eligible_value")],
                ["Courtesy Value", monetarySummary(report.totals.monetary_totals, "discounted_value")],
                ["Adjusted Matter Value", monetarySummary(report.totals.monetary_totals, "adjusted_matter_value")],
                ["Partner Referrals", report.totals.partner_referrals],
              ].map(([label, value]) => (
                <div key={String(label)} style={metricCard}>
                  <div style={metricLabel}>{label}</div>
                  <div style={{ marginTop: 7, fontSize: 20, color: "#F6F1E6" }}>{value}</div>
                </div>
              ))}
            </section>

            <div style={{ padding: 12, border: "1px solid rgba(198,165,90,0.12)", borderRadius: 8, background: "rgba(198,165,90,0.035)", fontSize: 11, color: "#A8A29A", lineHeight: 1.55 }}>
              {report.revenue_note}
            </div>

            <section style={{ display: "grid", gap: 9 }}>
              {report.rows.length === 0 ? (
                <div style={{ padding: 24, border: "1px solid rgba(198,165,90,0.1)", borderRadius: 8, color: "#A8A29A", fontSize: 12 }}>No governed discount codes found.</div>
              ) : report.rows.map((row) => (
                <article key={row.id} style={{ padding: 16, border: "1px solid rgba(198,165,90,0.12)", borderRadius: 9, background: "#0B0B0B", display: "grid", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                    <div>
                      <strong style={{ fontFamily: "monospace", fontSize: 15 }}>{row.code}</strong>
                      <span style={{ marginLeft: 10, fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", color: row.status === "active" ? "#3FA47A" : "#C6A55A" }}>{row.status}</span>
                      <div style={{ marginTop: 4, color: "#C6A55A", fontSize: 16 }}>{row.discount_value}% · {row.service_scope.replaceAll("_", " ")}</div>
                    </div>
                    <div style={{ textAlign: "right", fontSize: 10, color: "#A8A29A" }}>
                      {row.usage_count}/{row.usage_limit ?? "∞"} uses · redemption rate {pct(row.redemption_rate)}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(135px,1fr))", gap: 8 }}>
                    <div style={detailCard}><span style={detailLabel}>Redeemed Matters</span>{row.redeemed_matter_count}</div>
                    <div style={detailCard}><span style={detailLabel}>Eligible Value</span>{monetarySummary(row.monetary_totals, "eligible_value")}</div>
                    <div style={detailCard}><span style={detailLabel}>Courtesy Value</span>{monetarySummary(row.monetary_totals, "discounted_value")}</div>
                    <div style={detailCard}><span style={detailLabel}>Adjusted Value</span>{monetarySummary(row.monetary_totals, "adjusted_matter_value")}</div>
                    <div style={detailCard}><span style={detailLabel}>Repeat Client Rate</span>{pct(row.repeat_client_rate)}</div>
                    <div style={detailCard}><span style={detailLabel}>Partner Referrals</span>{row.partner_referral_volume}</div>
                  </div>

                  {row.alliance_member_id && (
                    <div style={{ fontSize: 10, color: "#817B72" }}>Alliance assignment: <span style={{ fontFamily: "monospace" }}>{row.alliance_member_id}</span></div>
                  )}
                </article>
              ))}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

const metricCard: React.CSSProperties = {
  padding: 14,
  border: "1px solid rgba(198,165,90,0.12)",
  borderRadius: 9,
  background: "#0B0B0B",
};

const metricLabel: React.CSSProperties = {
  fontSize: 9,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "rgba(198,165,90,0.48)",
};

const detailCard: React.CSSProperties = {
  display: "grid",
  gap: 4,
  padding: 10,
  border: "1px solid rgba(198,165,90,0.08)",
  borderRadius: 6,
  color: "#F6F1E6",
  fontSize: 12,
};

const detailLabel: React.CSSProperties = {
  fontSize: 8,
  letterSpacing: "0.11em",
  textTransform: "uppercase",
  color: "#777168",
};

const secondaryLink: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid rgba(198,165,90,0.18)",
  borderRadius: 6,
  color: "#F6E8B8",
  fontSize: 10,
  textDecoration: "none",
};

const secondaryButton: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid rgba(198,165,90,0.14)",
  borderRadius: 6,
  background: "transparent",
  color: "#A8A29A",
  fontSize: 10,
  cursor: "pointer",
};
