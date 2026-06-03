"use client";

import { useEffect, useState } from "react";

interface ScoreboardRow {
  id: string;
  operator_name: string;
  referral_count: number;
  conversion_count: number;
  revenue_contribution: number;
  intelligence_contributions: number;
  rating: string;
}

export function AllianceScoreboard() {
  const [rows, setRows] = useState<ScoreboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Pull referral ledger data
    fetch("/api/dashboard/referral-ledger")
      .then((r) => r.json())
      .then((d: { entries?: Array<{ id: string; source_name?: string; source_type?: string; deal_id?: string; commission_amount?: number; created_at?: string }> }) => {
        const entries = d.entries ?? [];

        // Group by source_name
        const byPartner = new Map<string, {
          referral_count: number;
          revenue: number;
          deal_ids: Set<string>;
        }>();

        for (const e of entries) {
          const name = e.source_name ?? "Unknown";
          if (!byPartner.has(name)) {
            byPartner.set(name, { referral_count: 0, revenue: 0, deal_ids: new Set() });
          }
          const entry = byPartner.get(name)!;
          entry.referral_count++;
          entry.revenue += Number(e.commission_amount) || 0;
          if (e.deal_id) entry.deal_ids.add(e.deal_id);
        }

        const result: ScoreboardRow[] = Array.from(byPartner.entries())
          .map(([name, stats], i) => ({
            id: String(i),
            operator_name: name,
            referral_count: stats.referral_count,
            conversion_count: stats.deal_ids.size,
            revenue_contribution: stats.revenue,
            intelligence_contributions: 0,
            rating: stats.referral_count >= 10 ? "Elite" : stats.referral_count >= 5 ? "Active" : stats.referral_count >= 1 ? "New" : "—",
          }))
          .sort((a, b) => b.referral_count - a.referral_count);

        setRows(result);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
        Alliance Scoreboard — Operator-only · Revenue data hidden from partners
      </div>

      {loading && (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>Loading...</div>
      )}

      {!loading && rows.length === 0 && (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>
          No partner data available.
        </div>
      )}

      {!loading && rows.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: 12 }}>
          <thead>
            <tr>
              {["Partner", "Referrals", "Conversions", "Revenue Contribution", "Intelligence", "Rating"].map((h) => (
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
            {rows.map((row, i) => (
              <tr
                key={row.id}
                style={{
                  borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
                }}
              >
                <td style={{ padding: "8px 8px", color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
                  {row.operator_name}
                </td>
                <td style={{ padding: "8px 8px", color: "rgba(255,255,255,0.6)", fontFamily: "monospace" }}>
                  {row.referral_count}
                </td>
                <td style={{ padding: "8px 8px", color: "rgba(255,255,255,0.6)", fontFamily: "monospace" }}>
                  {row.conversion_count}
                </td>
                <td style={{ padding: "8px 8px", fontFamily: "monospace", color: "#C6A55A", fontWeight: 600 }}>
                  ${row.revenue_contribution.toLocaleString()}
                </td>
                <td style={{ padding: "8px 8px", color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>
                  {row.intelligence_contributions}
                </td>
                <td style={{ padding: "8px 8px" }}>
                  <span
                    style={{
                      fontSize: 9,
                      fontFamily: "monospace",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase" as const,
                      color: row.rating === "Elite" ? "#C6A55A" : row.rating === "Active" ? "#4a9e6b" : "rgba(255,255,255,0.3)",
                    }}
                  >
                    {row.rating}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
