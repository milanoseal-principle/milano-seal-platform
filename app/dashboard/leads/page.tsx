export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Lead Pipeline — Milano Seal",
};

interface LeadRow {
  id: string;
  kind: string;
  client_name: string | null;
  email: string | null;
  destination_country: string | null;
  document_type: string | null;
  urgency: string | null;
  source: string | null;
  question: string | null;
  notification_status: string | null;
  created_at: string | null;
  conversion_score: number | null;
}

export default async function LeadsPage() {
  await requireDashboardAccess();

  const supabase = createAdminClient();

  const [matterResult, conciergeResult, pricingResult, notificationResult] = await Promise.all([
    supabase
      .from("deals")
      .select("id, client_name, email, destination_country, document_type, created_at, conversion_score, payment_status, matter_status")
      .or("payment_status.eq.unpaid,matter_status.eq.lead")
      .order("created_at", { ascending: false }),
    supabase
      .from("sales_leads")
      .select("id,full_name,email,country,product_interest,urgency,source_route,details,created_at")
      .eq("lead_type", "concierge_inquiry")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("sales_leads")
      .select("id,full_name,email,country,document_type,product_interest,urgency,source_route,details,created_at,canonical_matter_id")
      .eq("lead_type", "pricing_request")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("notifications")
      .select("status,delivery_status,metadata,created_at,type")
      .in("type", ["operator_concierge_inquiry", "operator_pricing_request"])
      .order("created_at", { ascending: false })
      .limit(400),
  ]);
  const pipelineDataUnavailable = Boolean(matterResult.error || conciergeResult.error || pricingResult.error || notificationResult.error);

  const alertsByLead = new Map<string, string>();
  for (const notification of notificationResult.data ?? []) {
    const metadata = notification.metadata as Record<string, unknown> | null;
    const leadId = typeof metadata?.concierge_inquiry_id === "string"
      ? metadata.concierge_inquiry_id
      : typeof metadata?.pricing_request_id === "string"
        ? metadata.pricing_request_id
        : null;
    if (leadId && !alertsByLead.has(leadId)) {
      alertsByLead.set(leadId, notification.delivery_status ?? notification.status ?? "unknown");
    }
  }

  const leads: LeadRow[] = [
    ...(matterResult.data ?? []).map((lead) => ({
      id: lead.id,
      kind: "Canonical Matter",
      client_name: lead.client_name,
      email: lead.email,
      destination_country: lead.destination_country,
      document_type: lead.document_type,
      urgency: null,
      source: null,
      question: null,
      notification_status: null,
      created_at: lead.created_at,
      conversion_score: lead.conversion_score,
    })),
    ...(conciergeResult.data ?? []).map((lead) => {
      const details = lead.details as Record<string, unknown> | null;
      return {
        id: lead.id,
        kind: "Concierge inquiry",
        client_name: lead.full_name,
        email: lead.email,
        destination_country: lead.country,
        document_type: lead.product_interest,
        urgency: lead.urgency,
        source: lead.source_route,
        question: typeof details?.question === "string" ? details.question : null,
        notification_status: alertsByLead.get(lead.id) ?? "not_confirmed",
        created_at: lead.created_at,
        conversion_score: null,
      };
    }),
    ...(pricingResult.data ?? []).map((lead) => {
      const details = lead.details as Record<string, unknown> | null;
      const uploadCount = Array.isArray(details?.uploads) ? (details!.uploads as unknown[]).length : 0;
      const serviceLabel = lead.product_interest ? `Pricing: ${lead.product_interest}` : "Pricing: review required";
      const baseLabel = lead.document_type ? `${serviceLabel} · ${lead.document_type}` : serviceLabel;
      // Reference/state only — never document contents.
      const docLabel = uploadCount ? `${baseLabel} · ${uploadCount} doc${uploadCount === 1 ? "" : "s"} attached` : baseLabel;
      return {
        id: lead.id,
        kind: lead.canonical_matter_id ? "Pricing request → Matter" : "Pricing request",
        client_name: lead.full_name,
        email: lead.email,
        destination_country: lead.country,
        document_type: docLabel,
        urgency: lead.urgency,
        source: lead.source_route,
        question: typeof details?.description === "string" ? details.description : null,
        notification_status: alertsByLead.get(lead.id) ?? "not_confirmed",
        created_at: lead.created_at,
        conversion_score: null,
      };
    }),
  ].sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());

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
        {pipelineDataUnavailable && (
          <p role="alert" style={{ margin: "0 0 20px", color: "#fca5a5", fontSize: 13 }}>
            Lead pipeline data is temporarily unavailable or incomplete. Refresh to retry.
          </p>
        )}

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
              {pipelineDataUnavailable ? "Lead data unavailable." : "No leads in pipeline."}
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Type", "Client", "Email", "Destination", "Service / Document", "Urgency / Alert", "Origin", "Created", "Score"].map((h) => (
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
                    <tr key={`${l.kind}-${l.id}`} id={`lead-${l.id}`} style={{ borderBottom: "1px solid rgba(212,175,55,0.04)" }}>
                      <td style={{ padding: "12px 16px", color: "rgba(198,165,90,0.8)", fontSize: 11 }}>{l.kind}</td>
                      <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.85)", fontSize: 13 }}>{l.client_name ?? "—"}</td>
                      <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "monospace" }}>{l.email ?? "—"}</td>
                      <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.75)", fontSize: 13 }}>{l.destination_country ?? "—"}</td>
                      <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
                        {l.document_type ?? "—"}
                        {l.question && <p style={{ margin: "4px 0 0", maxWidth: 280, color: "rgba(255,255,255,0.45)", fontSize: 12, lineHeight: 1.5 }}>{l.question}</p>}
                      </td>
                      <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.55)", fontSize: 12 }}>
                        {l.urgency ?? "—"}<br />{l.notification_status?.replace(/_/g, " ") ?? "—"}
                      </td>
                      <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.45)", fontSize: 12 }}>{l.source ?? "—"}</td>
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
