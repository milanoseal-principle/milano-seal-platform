import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAlliancePartner } from "@/lib/alliance/partnerContext";
import { ALLIANCE_REFERRAL_LEAD_TYPE } from "@/lib/alliance/referralLeads";

// GET /api/alliance/dashboard — the signed-in partner's referral overview, partner-safe only.
// Identity is the canonical operator account (operators.user_id = verified session user); never
// an auth-id-equals-partner-id assumption or an email match.
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminClient();
  let partner;
  try {
    partner = await resolveAlliancePartner(user?.id, admin);
  } catch {
    return NextResponse.json({ error: "Dashboard is unavailable right now." }, { status: 503 });
  }
  if (!partner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: leads, error } = await admin
    .from("sales_leads")
    .select("id, country, document_type, canonical_matter_id, details, created_at")
    .eq("lead_type", ALLIANCE_REFERRAL_LEAD_TYPE)
    .eq("details->>partner_id", partner.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: "Dashboard is unavailable right now." }, { status: 503 });

  const referredMatters = (leads ?? []).map((lead) => {
    const review = String((lead.details as Record<string, unknown> | null)?.review_status ?? "pending_review");
    return {
      matter_id: `REF-${String(lead.id).slice(0, 8).toUpperCase()}`,
      destination_country: lead.country ?? "—",
      document_type: lead.document_type ?? "—",
      status: lead.canonical_matter_id ? "In Progress" : review === "rejected" ? "Not Accepted" : "In Review",
      submitted_at: lead.created_at as string,
    };
  });
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  return NextResponse.json({
    no_data: referredMatters.length === 0,
    referred_matters: referredMatters,
    stats: {
      active_matters: referredMatters.filter((m) => m.status === "In Progress").length,
      this_month: referredMatters.filter((m) => new Date(m.submitted_at) >= monthStart).length,
      total_referred: referredMatters.length,
      outstanding_commission: null,
    },
    // Commission tracking is not configured (no commission policy or ledger exists).
    commissions: [],
    commission_policy: "NOT_CONFIGURED",
  });
}
