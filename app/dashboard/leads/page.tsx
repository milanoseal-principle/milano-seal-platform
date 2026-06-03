export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Lead Pipeline — Milano Seal",
};

interface LeadRow {
  id: string;
  client_name: string | null;
  email: string | null;
  destination_country: string | null;
  document_type: string | null;
  created_at: string | null;
  conversion_score: number | null;
}

export default async function LeadsPage() {
  await requireDashboardAccess();

  const supabase = createAdminClient();

  let leads: LeadRow[] = [];

  try {
    const { data } = await supabase
      .from("deals")
      .select("id, client_name, email, destination_country, document_type, created_at, conversion_score, payment_status, matter_status")
      .or("payment_status.eq.unpaid,matter_status.eq.lead")
      .order("created_at", { ascending: false });
    leads = data ?? [];
  } catch {}

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 3600000;
  const newLeads = leads.filter((l) => l.created_at && new Date(l.created_at).getTime() >= sevenDaysAgo);

  return (
    <div style={{ padding: "32px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 4px" }}>
          MILANO SEAL / LEAD PIPELINE
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.92)", margin: "0 0 24px" }}>
          Lead Acquisition Pipeline
        </h1>

        {/* Count chips */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 32 }}>
          {[
            { label: "New Leads (7d)", count: newLeads.length, color: "#4a9e6b" },
            { label: "Total In Pipeline", count: leads.length, color: "#C6A55A" },
          ].map((chip) => (
            <div
              key={chip.label}
              style={{
                background: "rgba(8,5,1,0.97)",
                border: `1px solid ${chip.color}22`,
                borderRadius: 6,
                padding: "12px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <span style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)" }}>
                {chip.label}
              </span>
              <span style={{ fontSize: 26, fontWeight: 700, color: chip.color, lineHeight: 1 }}>
                {chip.count}
              </span>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(212,175,55,0.08)" }}>
            <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: 0 }}>
              LEAD REGISTRY
            </p>
          </div>
          {leads.length === 0 ? (
            <p style={{ padding: 32, color: "rgba(255,255,255,0.35)", fontFamily: "monospace", fontSize: 12, margin: 0, textAlign: "center" }}>
              No leads in pipeline.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Client", "Email", "Destination", "Document Type", "Created", "Score"].map((h) => (
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
                  {leads.map((l) => (
                    <tr key={l.id} style={{ borderBottom: "1px solid rgba(212,175,55,0.04)" }}>
                      <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.85)", fontSize: 13 }}>{l.client_name ?? "—"}</td>
                      <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "monospace" }}>{l.email ?? "—"}</td>
                      <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.75)", fontSize: 13 }}>{l.destination_country ?? "—"}</td>
                      <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.75)", fontSize: 13 }}>{l.document_type ?? "—"}</td>
                      <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.35)", fontSize: 12, fontFamily: "monospace" }}>
                        {l.created_at ? new Date(l.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td style={{ padding: "12px 16px", color: l.conversion_score != null ? "#C6A55A" : "rgba(255,255,255,0.35)", fontSize: 12, fontFamily: "monospace" }}>
                        {l.conversion_score != null ? l.conversion_score : "—"}
                      </td>
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
