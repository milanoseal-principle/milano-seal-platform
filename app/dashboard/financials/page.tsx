export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Financial Intelligence — Milano Seal",
};

interface DealFinancial {
  total_price: number | null;
  payment_status: string | null;
  matter_status: string | null;
  destination_country: string | null;
  lane: string | null;
  document_type: string | null;
}

export default async function FinancialsPage() {
  await requireDashboardAccess();

  const supabase = createAdminClient();

  let cashCollected = 0;
  let outstandingInvoices = 0;
  let pipelineValue = 0;
  let pendingReleases = 0;
  let countryBreakdown: { country: string; revenue: number; count: number }[] = [];
  let laneBreakdown: { lane: string; revenue: number; count: number }[] = [];
  let docBreakdown: { doc: string; revenue: number; count: number }[] = [];

  try {
    const { data } = await supabase
      .from("deals")
      .select("total_price, payment_status, matter_status, destination_country, lane, document_type");

    const deals: DealFinancial[] = data ?? [];

    for (const d of deals) {
      const price = d.total_price ?? 0;
      const isPaid = d.payment_status === "paid";
      const isUnpaid = d.payment_status === "unpaid";
      const isCancelled = d.matter_status === "cancelled";
      const isReleasable =
        d.matter_status === "apostille_complete" || d.matter_status === "ready_for_release";

      if (isPaid) cashCollected += price;
      if (isUnpaid && !isCancelled) {
        outstandingInvoices++;
        pipelineValue += price;
      }
      if (isReleasable) pendingReleases++;
    }

    const countryMap = new Map<string, { revenue: number; count: number }>();
    for (const d of deals) {
      if (d.payment_status !== "paid") continue;
      const key = d.destination_country ?? "Unknown";
      const cur = countryMap.get(key) ?? { revenue: 0, count: 0 };
      cur.revenue += d.total_price ?? 0;
      cur.count++;
      countryMap.set(key, cur);
    }
    countryBreakdown = Array.from(countryMap.entries())
      .map(([country, v]) => ({ country, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const laneMap = new Map<string, { revenue: number; count: number }>();
    for (const d of deals) {
      if (d.payment_status !== "paid") continue;
      const key = d.lane ?? "standard";
      const cur = laneMap.get(key) ?? { revenue: 0, count: 0 };
      cur.revenue += d.total_price ?? 0;
      cur.count++;
      laneMap.set(key, cur);
    }
    laneBreakdown = Array.from(laneMap.entries())
      .map(([lane, v]) => ({ lane, ...v }))
      .sort((a, b) => b.revenue - a.revenue);

    const docMap = new Map<string, { revenue: number; count: number }>();
    for (const d of deals) {
      if (d.payment_status !== "paid" || !d.document_type) continue;
      const key = d.document_type;
      const cur = docMap.get(key) ?? { revenue: 0, count: 0 };
      cur.revenue += d.total_price ?? 0;
      cur.count++;
      docMap.set(key, cur);
    }
    docBreakdown = Array.from(docMap.entries())
      .map(([doc, v]) => ({ doc, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  } catch {}

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);

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

  const emptyMsg = (msg: string) => (
    <p style={{ padding: 20, color: "rgba(255,255,255,0.35)", fontFamily: "monospace", fontSize: 12, margin: 0, textAlign: "center" }}>
      {msg}
    </p>
  );

  return (
    <div style={{ padding: "32px 24px" }} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Founder private banner */}
        <div
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.4)",
            borderRadius: 6,
            padding: "12px 20px",
            marginBottom: 28,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontFamily: "monospace", fontSize: 11, color: "#ef4444", fontWeight: 700 }}>
            FOUNDER PRIVATE
          </span>
          <span style={{ fontSize: 12, color: "rgba(239,68,68,0.85)" }}>
            This view is never shared. Do not screenshot.
          </span>
        </div>

        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 4px" }}>
          MILANO SEAL / FINANCIAL INTELLIGENCE CENTER
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.92)", margin: "0 0 32px" }}>
          Financial Intelligence Center
        </h1>

        {/* Stat chips */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 36 }}>
          {[
            { label: "Cash Collected", value: fmt(cashCollected), sub: "Paid deals total" },
            { label: "Pipeline Value", value: fmt(pipelineValue), sub: "Unpaid, active" },
            { label: "Outstanding Invoices", value: String(outstandingInvoices), sub: "Unpaid matters" },
            { label: "Pending Releases", value: String(pendingReleases), sub: "Ready to ship" },
          ].map((c) => (
            <div
              key={c.label}
              style={{
                background: "rgba(8,5,1,0.97)",
                border: "1px solid rgba(212,175,55,0.08)",
                borderRadius: 8,
                padding: "20px 24px",
                flex: 1,
                minWidth: 160,
              }}
            >
              <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 8px" }}>
                {c.label}
              </p>
              <p style={{ fontSize: 22, fontWeight: 700, color: "#C6A55A", margin: "0 0 4px", fontFamily: "monospace" }}>
                {c.value}
              </p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0, fontFamily: "monospace" }}>
                {c.sub}
              </p>
            </div>
          ))}
        </div>

        {/* 3 breakdown tables */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {/* By Country */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 10px" }}>
              REVENUE BY DESTINATION COUNTRY
            </p>
            <div style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)", borderRadius: 8, overflow: "hidden" }}>
              {countryBreakdown.length === 0 ? emptyMsg("No paid deal country data.") : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Country", "Revenue", "Deals"].map((h) => <th key={h} style={thStyle}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {countryBreakdown.map((r) => (
                      <tr key={r.country}>
                        <td style={{ ...tdBase, color: "rgba(255,255,255,0.85)" }}>{r.country}</td>
                        <td style={{ ...tdBase, color: "#C6A55A", fontWeight: 600 }}>{fmt(r.revenue)}</td>
                        <td style={{ ...tdBase, color: "rgba(255,255,255,0.35)" }}>{r.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* By Lane */}
          <div style={{ flex: 1, minWidth: 220 }}>
            <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 10px" }}>
              REVENUE BY LANE
            </p>
            <div style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)", borderRadius: 8, overflow: "hidden" }}>
              {laneBreakdown.length === 0 ? emptyMsg("No lane data.") : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Lane", "Revenue", "Deals"].map((h) => <th key={h} style={thStyle}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {laneBreakdown.map((r) => (
                      <tr key={r.lane}>
                        <td style={{ ...tdBase, color: "#C6A55A", textTransform: "uppercase" }}>{r.lane}</td>
                        <td style={{ ...tdBase, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>{fmt(r.revenue)}</td>
                        <td style={{ ...tdBase, color: "rgba(255,255,255,0.35)" }}>{r.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* By Document Type */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 10px" }}>
              REVENUE BY DOCUMENT TYPE
            </p>
            <div style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)", borderRadius: 8, overflow: "hidden" }}>
              {docBreakdown.length === 0 ? emptyMsg("No document type data.") : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Document Type", "Revenue", "Deals"].map((h) => <th key={h} style={thStyle}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {docBreakdown.map((r) => (
                      <tr key={r.doc}>
                        <td style={{ ...tdBase, color: "rgba(255,255,255,0.85)" }}>{r.doc}</td>
                        <td style={{ ...tdBase, color: "#C6A55A", fontWeight: 600 }}>{fmt(r.revenue)}</td>
                        <td style={{ ...tdBase, color: "rgba(255,255,255,0.35)" }}>{r.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
