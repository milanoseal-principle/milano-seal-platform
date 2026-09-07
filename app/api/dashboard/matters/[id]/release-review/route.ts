import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isFounderAdmin, isOperatorOrFounder } from "@/lib/security/access-control";
import { loadCanonicalReleaseReadiness } from "@/lib/release/releaseReviewEvidence";
import { recordSecurityEvent } from "@/lib/security/security-events";

export const runtime = "nodejs";

async function actor() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.app_metadata?.role as string | undefined;
  if (!user || !isOperatorOrFounder(role)) return null;
  return { user, role: role ?? "unknown", id: user.email ?? user.id };
}

async function resolveDeal(id: string) {
  const admin = createAdminClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const { data } = await admin
    .from("deals")
    .select("id, deal_id")
    .eq(isUuid ? "id" : "deal_id", id)
    .maybeSingle();
  return data;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await actor();
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const deal = await resolveDeal(id);
  if (!deal) return NextResponse.json({ error: "Matter not found" }, { status: 404 });

  const readiness = await loadCanonicalReleaseReadiness(deal.id);
  return NextResponse.json({
    ok: true,
    matter_id: deal.id,
    matter_reference: deal.deal_id,
    evidence: readiness.evidence,
    facts: readiness.facts,
    gate: readiness.gate,
    founder_mode: isFounderAdmin(auth.role),
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await actor();
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const deal = await resolveDeal(id);
  if (!deal) return NextResponse.json({ error: "Matter not found" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const allowed = [
    "final_pdf_locked",
    "pathway_reviewed",
    "delivery_recipient_confirmed",
    "founder_approved",
    "compliance_hold",
  ] as const;

  const requested: Record<string, boolean> = {};
  for (const key of allowed) {
    if (typeof body[key] === "boolean") requested[key] = body[key] as boolean;
  }

  if ((requested.founder_approved === true || requested.compliance_hold === false) && !isFounderAdmin(auth.role)) {
    await recordSecurityEvent({
      event_name: "ADMIN_ACTION_DENIED",
      severity: "high",
      actor: auth.id,
      matter_id: deal.id,
      route: "/api/dashboard/matters/[id]/release-review",
      client_safe: false,
      metadata: { reason: "founder_only_release_evidence", role: auth.role },
    });
    return NextResponse.json({ error: "Founder approval required" }, { status: 403 });
  }

  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 1000) : null;
  const evidencePatch = body.evidence && typeof body.evidence === "object" && !Array.isArray(body.evidence)
    ? body.evidence as Record<string, unknown>
    : {};

  const admin = createAdminClient();
  const { data: previous } = await admin
    .from("final_release_review_evidence")
    .select("*")
    .eq("deal_id", deal.id)
    .maybeSingle();

  const mergedEvidence = {
    ...((previous?.evidence ?? {}) as Record<string, unknown>),
    ...evidencePatch,
  };

  const next = {
    deal_id: deal.id,
    final_pdf_locked: requested.final_pdf_locked ?? previous?.final_pdf_locked ?? false,
    pathway_reviewed: requested.pathway_reviewed ?? previous?.pathway_reviewed ?? false,
    delivery_recipient_confirmed: requested.delivery_recipient_confirmed ?? previous?.delivery_recipient_confirmed ?? false,
    founder_approved: requested.founder_approved ?? previous?.founder_approved ?? false,
    compliance_hold: requested.compliance_hold ?? previous?.compliance_hold ?? true,
    evidence: mergedEvidence,
    reviewed_by: auth.id,
    reviewed_role: auth.role,
    review_reason: reason,
    updated_at: new Date().toISOString(),
  };

  const { data: saved, error } = await admin
    .from("final_release_review_evidence")
    .upsert(next, { onConflict: "deal_id" })
    .select("*")
    .single();

  if (error || !saved) {
    return NextResponse.json({ error: "Failed to persist release review evidence" }, { status: 500 });
  }

  await admin.from("final_release_review_events").insert({
    deal_id: deal.id,
    actor_id: auth.id,
    actor_role: auth.role,
    previous_state: previous ?? {},
    new_state: saved,
    reason,
    evidence: evidencePatch,
  });

  await recordSecurityEvent({
    event_name: "FINAL_SEAL_REVIEW_STARTED",
    severity: "info",
    actor: auth.id,
    matter_id: deal.id,
    route: "/api/dashboard/matters/[id]/release-review",
    client_safe: false,
    metadata: { updated_fields: Object.keys(requested), founder_mode: isFounderAdmin(auth.role) },
  });

  const readiness = await loadCanonicalReleaseReadiness(deal.id);
  return NextResponse.json({
    ok: true,
    evidence: readiness.evidence,
    facts: readiness.facts,
    gate: readiness.gate,
  });
}
