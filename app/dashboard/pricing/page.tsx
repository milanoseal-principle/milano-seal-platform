export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Pricing Engine — Milano Seal",
};

interface DealPrice {
  lane: string | null;
  document_type: string | null;
  total_price: number | null;
}

interface LaneStat {
  lane: string;
  avg: number;
  min: number;
  max: number;
  count: number;
}

interface DocStat {
  doc: string;
  avg: number;
  count: number;
}

export default async function PricingPage() {
  await requireDashboardAccess();

  const supabase = createAdminClient();

  let laneStats: LaneStat[] = [];
  let docStats: DocStat[] = [];

  try {
    const { data } = await supabase
      .from("deals")
      .select("lane, document_type, total_price")
      .eq("payment_status", "paid")
      .not("total_price", "is", null);

    const deals: DealPrice[] = data ?? [];

    // By lane
    const laneMap = new Map<string, number[]>();
    for (const d of deals) {
      const lane = d.lane ?? "standard";
      if (!laneMap.has(lane)) laneMap.set(lane, []);
      laneMap.get(lane)!.push(d.total_price!);
    }
    laneStats = Array.from(laneMap.entries()).map(([lane, prices]) => ({
      lane,
      avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      min: Math.min(...prices),
      max: Math.max(...prices),
      count: prices.length,
    })).sort((a, b) => b.avg - a.avg);

    // By document type
    const docMap = new Map<string, number[]>();
    for (const d of deals) {
      if (!d.document_type) continue;
      if (!docMap.has(d.document_type)) docMap.set(d.document_type, []);
      docMap.get(d.document_type)!.push(d.total_price!);
    }
    docStats = Array.from(docMap.entries()).map(([doc, prices]) => ({
      doc,
      avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      count: prices.length,
    })).sort((a, b) => b.avg - a.avg);
  } catch {}

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <div style={{ padding: "32px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Warning banner */}
        <div
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 6,
            padding: "12px 20px",
            marginBottom: 28,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontFamily: "monospace", fontSize: 11, color: "#ef4444", fontWeight: 700 }}>
            INTERNAL ONLY
          </span>
          <span style={{ fontSize: 12, color: "rgba(239,68,68,0.8)" }}>
            Do not share or screenshot this view. Pricing data is confidential operator intelligence.
          </span>
        </div>

        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 4px" }}>
          MILANO SEAL / PRICING ENGINE
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.92)", margin: "0 0 32px" }}>
          Internal Pricing Engine
        </h1>

        {/* By Lane */}
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 12px" }}>
          PRICING BY LANE
        </p>
        <div style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)", borderRadius: 8, overflow: "hidden", marginBottom: 28 }}>
          {laneStats.length === 0 ? (
            <p style={{ padding: 24, color: "rgba(255,255,255,0.35)", fontFamily: "monospace", fontSize: 12, margin: 0, textAlign: "center" }}>
              No paid deals to analyze.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Lane", "Avg Price", "Min Price", "Max Price", "Count"].map((h) => (
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
                  {laneStats.map((r) => (
                    <tr key={r.lane} style={{ borderBottom: "1px solid rgba(212,175,55,0.04)" }}>
                      <td style={{ padding: "12px 16px", color: "#C6A55A", fontSize: 12, fontFamily: "monospace", textTransform: "uppercase" }}>{r.lane}</td>
                      <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.9)", fontSize: 13, fontFamily: "monospace", fontWeight: 600 }}>{fmt(r.avg)}</td>
                      <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "monospace" }}>{fmt(r.min)}</td>
                      <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "monospace" }}>{fmt(r.max)}</td>
                      <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.35)", fontSize: 12, fontFamily: "monospace" }}>{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* By Document Type */}
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 12px" }}>
          PRICING BY DOCUMENT TYPE
        </p>
        <div style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)", borderRadius: 8, overflow: "hidden" }}>
          {docStats.length === 0 ? (
            <p style={{ padding: 24, color: "rgba(255,255,255,0.35)", fontFamily: "monospace", fontSize: 12, margin: 0, textAlign: "center" }}>
              No document type data available.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Document Type", "Avg Price", "Count"].map((h) => (
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
                  {docStats.map((r) => (
                    <tr key={r.doc} style={{ borderBottom: "1px solid rgba(212,175,55,0.04)" }}>
                      <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.85)", fontSize: 13 }}>{r.doc}</td>
                      <td style={{ padding: "12px 16px", color: "#C6A55A", fontSize: 13, fontFamily: "monospace", fontWeight: 600 }}>{fmt(r.avg)}</td>
                      <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.35)", fontSize: 12, fontFamily: "monospace" }}>{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
