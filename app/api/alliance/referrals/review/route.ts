import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOperatorApiAccess } from "@/lib/auth/operatorApiAccess";
import { canPerformProtectedMatterTransition } from "@/lib/auth/protectedMatterTransitions";
import { ALLIANCE_REFERRAL_LEAD_TYPE, recordPartnerReferralAttribution } from "@/lib/alliance/referralLeads";

export async function POST(req: NextRequest) {
  const access = await requireOperatorApiAccess();
  if (!access.ok) return access.response;
  try {
    let id: string | null = null;
    let action: string | null = null;

    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      id = body.id;
      action = body.action;
    } else {
      const form = await req.formData();
      id = form.get("id") as string | null;
      action = form.get("action") as string | null;
    }

    if (!id || !action) {
      return NextResponse.json({ error: "Missing id or action." }, { status: 400 });
    }

    const supabase = createAdminClient();
    // Partner referrals are canonical leads (sales_leads, lead_type alliance_referral).
    const { data: lead, error: leadError } = await supabase
      .from("sales_leads")
      .select("id, lead_type, details, canonical_matter_id")
      .eq("id", id)
      .eq("lead_type", ALLIANCE_REFERRAL_LEAD_TYPE)
      .maybeSingle();
    if (leadError) return NextResponse.json({ error: "Referrals are unavailable right now." }, { status: 503 });
    if (!lead) return NextResponse.json({ error: "Referral not found." }, { status: 404 });

    if (action === "accept" || action === "reject") {
      const details = { ...((lead.details ?? {}) as Record<string, unknown>), review_status: action === "accept" ? "accepted" : "rejected", reviewed_by: access.userId, reviewed_at: new Date().toISOString() };
      const { error } = await supabase.from("sales_leads").update({ details }).eq("id", id);
      if (error) return NextResponse.json({ error: "Action failed." }, { status: 503 });
    } else if (action === "convert") {
      // Creating a Matter is a protected transition: same authority as the Leads workspace.
      if (!canPerformProtectedMatterTransition(access.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
      const { data, error } = await supabase.rpc("convert_sales_lead_to_matter", { p_lead_id: id, p_actor_id: access.userId });
      const matterId = (Array.isArray(data) ? data[0] : data)?.matter_id as string | undefined;
      if (error || !matterId) return NextResponse.json({ error: "LEAD_CONVERSION_FAILED" }, { status: 503 });
      await recordPartnerReferralAttribution(supabase, id, matterId);
    } else {
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }

    // Redirect back to operator referral review page
    return NextResponse.redirect(new URL("/dashboard/alliance/referrals", req.url));
  } catch {
    return NextResponse.json({ error: "Action failed." }, { status: 500 });
  }
}
