export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Inbox, CheckCheck, XCircle, ArrowRight } from "lucide-react";
import { ALLIANCE_REFERRAL_LEAD_TYPE } from "@/lib/alliance/referralLeads";

// Partner referrals are canonical leads (sales_leads, lead_type alliance_referral). Rows are
// mapped to the review table's shape; a read failure is reported, never shown as no referrals.
async function getReferralObservations(): Promise<{ rows: Obs[]; unavailable: boolean }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("sales_leads")
    .select("id, country, document_type, urgency, canonical_matter_id, details, created_at")
    .eq("lead_type", ALLIANCE_REFERRAL_LEAD_TYPE)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return { rows: [], unavailable: true };
  const rows = (data ?? []).map((lead) => {
    const d = (lead.details ?? {}) as Record<string, unknown>;
    const meta = [`Partner: ${typeof d.partner_id === "string" ? d.partner_id.slice(0, 8) : "unattributed"}`, `Urgency: ${lead.urgency ?? "Standard"}`].join(" | ");
    const notes = [d.partner_context_note, d.receiving_authority_note ? `Authority note: ${d.receiving_authority_note}` : null].filter(Boolean).join("\n\n");
    return {
      id: String(lead.id),
      partner_id: typeof d.partner_id === "string" ? d.partner_id : null,
      country: (lead.country as string | null) ?? null,
      document_type: (lead.document_type as string | null) ?? null,
      observation_text: notes ? `${meta}\n\n${notes}` : meta,
      status: lead.canonical_matter_id ? "converted" : String(d.review_status ?? "pending_review"),
      created_at: String(lead.created_at),
    };
  });
  return { rows, unavailable: false };
}

type Obs = {
  id: string;
  partner_id: string | null;
  country: string | null;
  document_type: string | null;
  observation_text: string | null;
  status: string;
  created_at: string;
};

function parseMetaLine(text: string | null, key: string): string | null {
  if (!text) return null;
  // Meta summary is on first line, pipe-delimited
  const firstLine = text.split("\n\n")[0] ?? "";
  const segment = firstLine.split(" | ").find((s) => s.toLowerCase().startsWith(key.toLowerCase() + ":"));
  return segment ? segment.slice(key.length + 1).trim() : null;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    pending_review: { background: "rgba(212,175,55,0.08)", color: "#d4af37", border: "1px solid rgba(212,175,55,0.2)" },
    accepted: { background: "rgba(34,197,94,0.06)", color: "rgba(34,197,94,0.7)", border: "1px solid rgba(34,197,94,0.15)" },
    converted: { background: "rgba(34,197,94,0.06)", color: "rgba(34,197,94,0.7)", border: "1px solid rgba(34,197,94,0.15)" },
    rejected: { background: "rgba(180,50,50,0.06)", color: "rgba(255,100,100,0.5)", border: "1px solid rgba(180,50,50,0.15)" },
  };
  const labels: Record<string, string> = { pending_review: "Pending Review", accepted: "Accepted", rejected: "Not Accepted", converted: "Matter Created" };
  const s = styles[status] ?? styles.pending_review;
  return (
    <span className="text-[8px] font-mono uppercase tracking-[0.1em] px-2 py-0.5 rounded-sm" style={s}>
      {labels[status] ?? status}
    </span>
  );
}

export default async function OperatorReferralReviewPage() {
  await requireDashboardAccess();
  const { rows: observations, unavailable } = await getReferralObservations();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-[11px] uppercase tracking-[0.25em] text-gold font-medium mb-1">
          Alliance OS™ — Referral Review
        </p>
        <h1 className="font-serif text-3xl text-foreground">
          Partner Referral Queue
        </h1>
        <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
          Review incoming partner referrals staged in the observation queue. Attribution is locked by operator only.
        </p>
      </div>

      {/* Operator notice */}
      <div
        className="rounded-sm px-5 py-3 text-[11px]"
        style={{
          background: "rgba(212,175,55,0.04)",
          border: "1px solid rgba(212,175,55,0.12)",
          color: "rgba(212,175,55,0.6)",
        }}
      >
        Referral review does not confirm payment. Attribution locked by operator only.
      </div>

      {/* Referral table */}
      <div
        className="rounded-sm"
        style={{ background: "rgba(8,5,1,0.96)", border: "1px solid rgba(212,175,55,0.1)" }}
      >
        <div className="px-6 py-4 border-b flex items-center gap-2" style={{ borderColor: "rgba(212,175,55,0.08)" }}>
          <Inbox className="w-4 h-4" style={{ color: "#d4af37" }} />
          <div>
            <p className="text-[9px] font-mono uppercase tracking-[0.25em]" style={{ color: "rgba(212,175,55,0.5)" }}>
              Operator Review
            </p>
            <h2 className="text-sm font-light" style={{ color: "rgba(255,255,255,0.75)", fontFamily: "var(--font-playfair),Georgia,serif" }}>
              Incoming Referrals
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(212,175,55,0.08)" }}>
                {["Submitted", "Partner", "Destination", "Document", "Urgency", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-[9px] font-mono uppercase tracking-[0.15em]"
                    style={{ color: "rgba(212,175,55,0.35)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {observations.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                    {unavailable ? "Referrals could not be loaded. This is not an empty queue — retry shortly." : "No referrals in queue."}
                  </td>
                </tr>
              )}
              {(observations as Obs[]).map((obs) => {
                const partner = parseMetaLine(obs.observation_text, "Partner") ?? obs.partner_id?.substring(0, 8) ?? "—";
                const urgency = parseMetaLine(obs.observation_text, "Urgency") ?? "Standard";
                const referralId = `REF-${obs.id.substring(0, 8).toUpperCase()}`;
                return (
                  <tr key={obs.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <td className="px-5 py-3 font-mono text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                      {new Date(obs.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3" style={{ color: "rgba(255,255,255,0.6)" }}>
                      <div>{partner}</div>
                      <div className="font-mono text-[9px] mt-0.5" style={{ color: "rgba(212,175,55,0.4)" }}>{referralId}</div>
                    </td>
                    <td className="px-5 py-3">{obs.country ?? "—"}</td>
                    <td className="px-5 py-3">{obs.document_type ?? "—"}</td>
                    <td className="px-5 py-3">
                      <span
                        className="text-[9px] font-mono uppercase tracking-[0.08em] px-1.5 py-0.5 rounded-sm"
                        style={{
                          background: urgency === "Urgent" ? "rgba(180,50,50,0.08)" : urgency === "Priority" ? "rgba(212,175,55,0.06)" : "rgba(255,255,255,0.04)",
                          color: urgency === "Urgent" ? "rgba(255,100,100,0.6)" : urgency === "Priority" ? "rgba(212,175,55,0.6)" : "rgba(255,255,255,0.3)",
                          border: `1px solid ${urgency === "Urgent" ? "rgba(180,50,50,0.15)" : urgency === "Priority" ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.06)"}`,
                        }}
                      >
                        {urgency}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={obs.status} />
                    </td>
                    <td className="px-5 py-3">
                      <ReferralActions obsId={obs.id} status={obs.status} hasAuthorityNote={!!parseMetaLine(obs.observation_text, "Authority note")} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
          <p className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.15)" }}>
            Payout eligibility not assessed here. Revenue, margin, and payout data are not visible on this page.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Link
          href="/dashboard/alliance"
          className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.15em]"
          style={{ color: "rgba(212,175,55,0.45)" }}
        >
          <ArrowRight className="w-3 h-3 rotate-180" />
          Alliance OS
        </Link>
      </div>
    </div>
  );
}

// Client component for action buttons — kept inline as a server page with interactive island
function ReferralActions({ obsId, status, hasAuthorityNote }: { obsId: string; status: string; hasAuthorityNote: boolean }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {status !== "accepted" && (
        <form action={`/api/alliance/referrals/review`} method="POST">
          <input type="hidden" name="id" value={obsId} />
          <input type="hidden" name="action" value="accept" />
          <button
            type="submit"
            className="text-[9px] font-mono uppercase tracking-[0.1em] px-2.5 py-1 rounded-sm flex items-center gap-1"
            style={{ background: "rgba(212,175,55,0.08)", color: "#d4af37", border: "1px solid rgba(212,175,55,0.2)" }}
          >
            <CheckCheck className="w-3 h-3" />
            Mark Reviewed
          </button>
        </form>
      )}
      {status !== "rejected" && (
        <form action={`/api/alliance/referrals/review`} method="POST">
          <input type="hidden" name="id" value={obsId} />
          <input type="hidden" name="action" value="reject" />
          <button
            type="submit"
            className="text-[9px] font-mono uppercase tracking-[0.1em] px-2.5 py-1 rounded-sm flex items-center gap-1"
            style={{ background: "rgba(255,60,60,0.04)", color: "rgba(255,100,100,0.5)", border: "1px solid rgba(255,60,60,0.1)" }}
          >
            <XCircle className="w-3 h-3" />
            Not Accepted
          </button>
        </form>
      )}
      {hasAuthorityNote && (
        <form action={`/api/alliance/referrals/review`} method="POST">
          <input type="hidden" name="id" value={obsId} />
          <input type="hidden" name="action" value="convert" />
          <button
            type="submit"
            className="text-[9px] font-mono uppercase tracking-[0.1em] px-2.5 py-1 rounded-sm"
            style={{ background: "rgba(212,175,55,0.04)", color: "rgba(212,175,55,0.5)", border: "1px solid rgba(212,175,55,0.1)" }}
          >
            Convert to Obs
          </button>
        </form>
      )}
    </div>
  );
}
