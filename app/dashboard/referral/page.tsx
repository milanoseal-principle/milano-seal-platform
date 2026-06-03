export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Referral Engine — Milano Seal",
};

interface SourceCount {
  source: string;
  count: number;
}

export default async function ReferralPage() {
  await requireDashboardAccess();

  const supabase = createAdminClient();

  let sourceCounts: SourceCount[] = [];
  let totalReferrals = 0;

  try {
    const { data } = await supabase
      .from("deals")
      .select("referral_source")
      .not("referral_source", "is", null);

    if (data && data.length > 0) {
      const map = new Map<string, number>();
      for (const d of data) {
        if (!d.referral_source) continue;
        map.set(d.referral_source, (map.get(d.referral_source) ?? 0) + 1);
      }
      sourceCounts = Array.from(map.entries())
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count);
      totalReferrals = data.length;
    }
  } catch {}

  return (
    <div style={{ padding: "32px 24px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 4px" }}>
          MILANO SEAL / REFERRAL ENGINE
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.92)", margin: "0 0 32px" }}>
          Attorney &amp; Partner Referral Engine
        </h1>

        {/* Referral Stats */}
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 12px" }}>
          REFERRAL SOURCES
        </p>

        {sourceCounts.length === 0 ? (
          <div
            style={{
              background: "rgba(8,5,1,0.97)",
              border: "1px solid rgba(212,175,55,0.08)",
              borderRadius: 8,
              padding: "32px 24px",
              marginBottom: 32,
              textAlign: "center",
            }}
          >
            <p style={{ color: "rgba(255,255,255,0.35)", fontFamily: "monospace", fontSize: 12, margin: 0 }}>
              No referral data available. Referral source tracking will populate here once the{" "}
              <code style={{ color: "rgba(198,165,90,0.6)" }}>referral_source</code> field is in use.
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 8, color: "rgba(255,255,255,0.35)", fontSize: 12, fontFamily: "monospace" }}>
              {totalReferrals} total referred matter{totalReferrals !== 1 ? "s" : ""} from {sourceCounts.length} source{sourceCounts.length !== 1 ? "s" : ""}
            </div>
            <div style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)", borderRadius: 8, overflow: "hidden", marginBottom: 32 }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Referral Source", "Matter Count"].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "10px 16px",
                            textAlign: "left",
                            fontFamily: "monospace",
                            fontSize: 9,
                            letterSpacing: "0.28em",
                            textTransform: "uppercase",
                            color: "rgba(198,165,90,0.5)",
                            borderBottom: "1px solid rgba(212,175,55,0.06)",
                            fontWeight: 400,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sourceCounts.map((r) => (
                      <tr key={r.source} style={{ borderBottom: "1px solid rgba(212,175,55,0.04)" }}>
                        <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.85)", fontSize: 13 }}>{r.source}</td>
                        <td style={{ padding: "12px 16px", color: "#C6A55A", fontSize: 13, fontFamily: "monospace", fontWeight: 600 }}>{r.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Referral Script */}
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 12px" }}>
          ATTORNEY INTRODUCTION SCRIPT
        </p>
        <div style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)", borderRadius: 8, padding: 24 }}>
          <p style={{ fontFamily: "monospace", fontSize: 9, color: "rgba(198,165,90,0.5)", textTransform: "uppercase", letterSpacing: "0.2em", margin: "0 0 16px" }}>
            TEMPLATE — ATTORNEY REFERRAL SCRIPT
          </p>
          <pre
            style={{
              margin: 0,
              fontFamily: "monospace",
              fontSize: 12,
              color: "rgba(255,255,255,0.7)",
              whiteSpace: "pre-wrap",
              lineHeight: 1.75,
            }}
          >
{`"Hello [ATTORNEY NAME], this is [YOUR NAME] from The Milano Seal™.

We specialize in international document execution — apostilles, notarizations, and
foreign document authentication for clients dealing with European citizenship recovery,
estate matters, corporate filings, and immigration.

We work closely with attorneys to handle the execution side so you don't have to —
with fast turnaround and white-glove service your clients expect.

Would you be open to a 10-minute call this week? I'd love to share how we've helped
other firms in [CITY / REGION] streamline their international matters.

We also provide case tracking and status updates you can share directly with your clients."

—

FOLLOW-UP NOTE (Email or text after call):

"[ATTORNEY NAME], great speaking with you. As promised, here's a quick overview of our
services: [LINK TO SERVICES PAGE].

For any referrals, simply email us at [CONTACT EMAIL] with the client's name, document
type, and destination — we'll take it from there and keep you updated.

Our standard referral agreement is available upon request."
`}
          </pre>
        </div>
      </div>
    </div>
  );
}
