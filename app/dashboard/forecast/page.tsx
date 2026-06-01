export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Forecast Engine — Milano Seal",
};

interface Deal {
  total_price: number | null;
  payment_status: string | null;
  matter_status: string | null;
  conversion_score: number | null;
  scheduled_at: string | null;
  created_at: string | null;
}

export default async function ForecastPage() {
  await requireDashboardAccess();

  const supabase = createAdminClient();

  let openPipelineTotal = 0;
  let forecast30 = 0;
  let forecast60 = 0;
  let forecast90 = 0;
  let likelyRevenue = 0;
  let expectedClosings = 0;
  let expectedReleases = 0;
  let pipelineDeals: Deal[] = [];

  try {
    const { data } = await supabase
      .from("deals")
      .select("total_price, payment_status, matter_status, conversion_score, scheduled_at, created_at")
      .neq("matter_status", "cancelled");

    const deals: Deal[] = data ?? [];

    const now = new Date();
    const d30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const d60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const d90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const d7ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (const d of deals) {
      const price = d.total_price ?? 0;
      const score = d.conversion_score ?? 0;
      const ms = d.matter_status ?? "";

      if (ms === "apostille_complete") expectedReleases++;

      if (d.payment_status !== "unpaid") continue;

      openPipelineTotal += price;
      likelyRevenue += price * (score / 100);
      if (score >= 70) expectedClosings++;
      pipelineDeals.push(d);

      const scheduled = d.scheduled_at ? new Date(d.scheduled_at) : null;
      const created = d.created_at ? new Date(d.created_at) : null;
      const isRecent = created && created >= d7ago;
      const in30 = scheduled && scheduled <= d30;
      const in60 = scheduled && scheduled <= d60;
      const in90 = scheduled && scheduled <= d90;

      const weighted = price * (score / 100);

      if (in30 || isRecent) forecast30 += weighted;
      if (in60 || isRecent) forecast60 += weighted;
      if (in90 || isRecent) forecast90 += weighted;
    }
  } catch {}

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const thStyle: React.CSSProperties = {
    padding: "10px 16px",
    textAlign: "left",
    fontFamily: "monospace",
    fontSize: 9,
    letterSpacing: "0.28em",
    textTransform: "uppercase",
    color: "rgba(198,165,90,0.5)",
    borderBottom: "1px solid rgba(212,175,55,0.06)",
    fontWeight: 400,
  };

  const tdBase: React.CSSProperties = {
    padding: "11px 16px",
    fontSize: 12,
    fontFamily: "monospace",
    borderBottom: "1px solid rgba(212,175,55,0.04)",
  };

  return (
    <div style={{ padding: "32px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 4px" }}>
          MILANO SEAL / FORECAST ENGINE
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.92)", margin: "0 0 32px" }}>
          Forecast Engine
        </h1>

        {/* 30/60/90 day cards */}
        <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
          {[
            { label: "30-Day Forecast", value: fmt(forecast30), sub: "Probability-weighted" },
            { label: "60-Day Forecast", value: fmt(forecast60), sub: "Probability-weighted" },
            { label: "90-Day Forecast", value: fmt(forecast90), sub: "Probability-weighted" },
          ].map((c) => (
            <div
              key={c.label}
              style={{
                flex: 1,
                minWidth: 180,
                background: "rgba(8,5,1,0.97)",
                border: "1px solid rgba(212,175,55,0.08)",
                borderRadius: 8,
                padding: "20px 24px",
              }}
            >
              <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 8px" }}>
                {c.label}
              </p>
              <p style={{ fontSize: 24, fontWeight: 700, color: "#4a9e6b", margin: "0 0 4px", fontFamily: "monospace" }}>
                {c.value}
              </p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>{c.sub}</p>
            </div>
          ))}
        </div>

        {/* Summary stats */}
        <div style={{ display: "flex", gap: 16, marginBottom: 36, flexWrap: "wrap" }}>
          {[
            { label: "Open Pipeline Total", value: fmt(openPipelineTotal) },
            { label: "Likely Revenue (Weighted)", value: fmt(likelyRevenue) },
            { label: "Expected Closings (Score ≥70)", value: String(expectedClosings) },
            { label: "Expected Releases", value: String(expectedReleases) },
          ].map((c) => (
            <div
              key={c.label}
              style={{
                flex: 1,
                minWidth: 160,
                background: "rgba(8,5,1,0.97)",
                border: "1px solid rgba(212,175,55,0.08)",
                borderRadius: 8,
                padding: "16px 20px",
              }}
            >
              <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 6px" }}>
                {c.label}
              </p>
              <p style={{ fontSize: 20, fontWeight: 700, color: "#C6A55A", margin: 0, fontFamily: "monospace" }}>
                {c.value}
              </p>
            </div>
          ))}
        </div>

        {/* Pipeline deals table */}
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 10px" }}>
          OPEN PIPELINE DEALS
        </p>
        <div style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)", borderRadius: 8, overflow: "hidden", marginBottom: 20 }}>
          {pipelineDeals.length === 0 ? (
            <p style={{ padding: 24, color: "rgba(255,255,255,0.35)", fontFamily: "monospace", fontSize: 12, margin: 0, textAlign: "center" }}>
              No open pipeline deals.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Deal Value", "Conv. Score", "Weighted Value", "Scheduled", "Created"].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pipelineDeals.slice(0, 50).map((d, i) => {
                    const score = d.conversion_score ?? 0;
                    const price = d.total_price ?? 0;
                    return (
                      <tr key={i}>
                        <td style={{ ...tdBase, color: "#C6A55A", fontWeight: 600 }}>{fmt(price)}</td>
                        <td style={{ ...tdBase, color: score >= 70 ? "#4a9e6b" : score >= 40 ? "#f59e0b" : "rgba(255,255,255,0.5)" }}>
                          {score}
                        </td>
                        <td style={{ ...tdBase, color: "rgba(255,255,255,0.85)" }}>{fmt(price * (score / 100))}</td>
                        <td style={{ ...tdBase, color: "rgba(255,255,255,0.5)" }}>
                          {d.scheduled_at ? new Date(d.scheduled_at).toLocaleDateString() : "—"}
                        </td>
                        <td style={{ ...tdBase, color: "rgba(255,255,255,0.35)" }}>
                          {d.created_at ? new Date(d.created_at).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>
          Forecast is probability-weighted from conversion scores. Not a guarantee.
        </p>
      </div>
    </div>
  );
}
