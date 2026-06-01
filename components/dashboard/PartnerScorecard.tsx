"use client";

// Operator-only. Never exposed to partners, VA, or portal.
// Displays referral count, conversion %, completion %, avg cycle, intelligence contributions.

interface PartnerScore {
  partner_id: string;
  partner_name: string;
  referral_count: number;
  conversion_count: number;
  completion_count: number;
  conversion_rate: number | null;
  completion_rate: number | null;
  avg_cycle_days: number | null;
  intelligence_contributions: number;
  score_label: "inactive" | "developing" | "active" | "preferred";
}

const SCORE_COLORS = {
  inactive: "#6b7280",
  developing: "#9ca3af",
  active: "#C6A55A",
  preferred: "#4a9e6b",
};

export function PartnerScorecard({ scores }: { scores: PartnerScore[] }) {
  if (!scores.length) {
    return (
      <div style={{ color: "#374151", fontSize: 12, padding: "20px 0", textAlign: "center" }}>
        No partner scorecard data yet. Scores populate once referrals convert to completed matters.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {scores.map((p) => (
        <div
          key={p.partner_id}
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
            borderLeft: `3px solid ${SCORE_COLORS[p.score_label]}`,
            borderRadius: 6,
            padding: "12px 16px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ color: "#e5e0d8", fontSize: 13, fontWeight: 500 }}>{p.partner_name}</span>
            <span style={{ color: SCORE_COLORS[p.score_label], fontSize: 10, letterSpacing: "0.08em" }}>
              {p.score_label.toUpperCase()}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
            {[
              ["Referrals", p.referral_count],
              ["Conversions", p.conversion_count],
              ["Conv %", p.conversion_rate != null ? `${p.conversion_rate}%` : "—"],
              ["Avg Days", p.avg_cycle_days != null ? `${p.avg_cycle_days}d` : "—"],
              ["Intel Contributions", p.intelligence_contributions],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <div style={{ color: "#6b7280", fontSize: 9, letterSpacing: "0.06em" }}>{label}</div>
                <div style={{ color: "#e5e0d8", fontSize: 13, fontWeight: 500, marginTop: 2 }}>{String(value)}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
