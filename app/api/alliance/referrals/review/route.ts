import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOperatorApiAccess } from "@/lib/auth/operatorApiAccess";
import { canPerformProtectedMatterTransition } from "@/lib/auth/protectedMatterTransitions";
import { reviewPartnerReferral } from "@/lib/alliance/referralLeads";

// POST — operator review of a partner referral: { id, action: "accept" | "reject" | "convert" }.
// Accepts JSON or a form post. The actor is always the verified session user.
export async function POST(req: NextRequest) {
  const access = await requireOperatorApiAccess();
  if (!access.ok) return access.response;

  let id: unknown = null;
  let action: unknown = null;
  try {
    if ((req.headers.get("content-type") ?? "").includes("application/json")) {
      const body = (await req.json()) as Record<string, unknown> | null;
      id = body?.id;
      action = body?.action;
    } else {
      const form = await req.formData();
      id = form.get("id");
      action = form.get("action");
    }
  } catch {
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }
  if (!id || !action) return NextResponse.json({ error: "Missing id or action." }, { status: 400 });

  let result;
  try {
    result = await reviewPartnerReferral(createAdminClient(), { id, action, actorId: access.userId, canConvert: canPerformProtectedMatterTransition(access.role) });
  } catch {
    // Anything unexpected is a failure, never a success.
    return NextResponse.json({ error: "REFERRALS_UNAVAILABLE" }, { status: 503 });
  }
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  // The Matter exists but its partner attribution was not stored: say so instead of redirecting.
  if (result.status === 202) return NextResponse.json({ ok: true, matter_id: result.matterId, attribution: result.attribution }, { status: 202 });

  return NextResponse.redirect(new URL("/dashboard/alliance/referrals", req.url), 303);
}
