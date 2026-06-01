export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Advertising Intelligence — Milano Seal",
};

interface Deal {
  referral_source: string | null;
}

export default async function AdsPage() {
  await requireDashboardAccess();

  const supabase = createAdminClient();

  let referralSources: { source: string; count: number }[] = [];

  try {
    const { data } = await supabase
      .from("deals")
      .select("referral_source")
      .not("referral_source", "is", null);

    const deals: Deal[] = data ?? [];

    const sourceMap = new Map<string, number>();
    for (const d of deals) {
      const src = d.referral_source ?? "Unknown";
      sourceMap.set(src, (sourceMap.get(src) ?? 0) + 1);
    }
    referralSources = Array.from(sourceMap.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);
  } catch {}

  const cardStyle: React.CSSProperties = {
    background: "rgba(8,5,1,0.97)",
    border: "1px solid rgba(212,175,55,0.08)",
    borderRadius: 8,
    padding: "24px",
    marginBottom: 16,
  };

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

  const pendingBadge = (
    <span style={{
      fontSize: 10,
      fontFamily: "monospace",
      color: "#f59e0b",
      background: "rgba(245,158,11,0.08)",
      border: "1px solid rgba(245,158,11,0.2)",
      borderRadius: 4,
      padding: "2px 8px",
    }}>
      Pending Integration
    </span>
  );

  const PlaceholderMetric = ({ label }: { label: string }) => (
    <div style={{ flex: 1, minWidth: 100 }}>
      <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 6px" }}>
        {label}
      </p>
      <p style={{ fontSize: 20, fontWeight: 700, color: "rgba(255,255,255,0.25)", margin: 0, fontFamily: "monospace" }}>
        --
      </p>
    </div>
  );

  return (
    <div style={{ padding: "32px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 4px" }}>
          MILANO SEAL / ADVERTISING INTELLIGENCE
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.92)", margin: "0 0 32px" }}>
          Advertising Intelligence
        </h1>

        {/* Google Ads */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)", margin: 0 }}>Google Ads</p>
            {pendingBadge}
          </div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 20px", fontFamily: "monospace" }}>
            Google Ads API integration pending
          </p>
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            <PlaceholderMetric label="Spend" />
            <PlaceholderMetric label="Clicks" />
            <PlaceholderMetric label="Conversions" />
            <PlaceholderMetric label="CPL" />
          </div>
        </div>

        {/* Meta Ads */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)", margin: 0 }}>Meta Ads</p>
            {pendingBadge}
          </div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 20px", fontFamily: "monospace" }}>
            Meta Ads API integration pending
          </p>
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            <PlaceholderMetric label="Spend" />
            <PlaceholderMetric label="Clicks" />
            <PlaceholderMetric label="Conversions" />
            <PlaceholderMetric label="CPL" />
          </div>
        </div>

        {/* LinkedIn */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)", margin: 0 }}>LinkedIn</p>
            {pendingBadge}
          </div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 20px", fontFamily: "monospace" }}>
            LinkedIn Ads API integration pending
          </p>
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            <PlaceholderMetric label="Spend" />
            <PlaceholderMetric label="Clicks" />
            <PlaceholderMetric label="Conversions" />
            <PlaceholderMetric label="CPL" />
          </div>
        </div>

        {/* Alliance Campaigns */}
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 10px" }}>
          ALLIANCE CAMPAIGNS — REFERRAL SOURCE ATTRIBUTION
        </p>
        <div style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)", borderRadius: 8, overflow: "hidden", marginBottom: 20 }}>
          {referralSources.length === 0 ? (
            <p style={{ padding: 24, color: "rgba(255,255,255,0.35)", fontFamily: "monospace", fontSize: 12, margin: 0, textAlign: "center" }}>
              No referral source data recorded.
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Referral Source", "Deal Count"].map((h) => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {referralSources.map((r) => (
                  <tr key={r.source}>
                    <td style={{ ...tdBase, color: "rgba(255,255,255,0.85)" }}>{r.source}</td>
                    <td style={{ ...tdBase, color: "#C6A55A", fontWeight: 600 }}>{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>
          Ad performance data requires API key configuration. Referral source attribution is tracked in the matters database.
        </p>
      </div>
    </div>
  );
}
