import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveServerRole } from "@/lib/auth/server-role";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RECOVERY_ROLES = new Set([
  "founder",
  "founder_admin",
  "admin",
  "admin_operator",
  "ops_manager",
]);

async function authorize() {
  const ssr = await createClient();
  const { data: { user } } = await ssr.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 }) } as const;
  const role = await resolveServerRole(user);
  if (!RECOVERY_ROLES.has(role)) {
    return { error: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }) } as const;
  }
  return { user, role } as const;
}

export async function GET() {
  const auth = await authorize();
  if ("error" in auth) return auth.error;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("wise_reconciliation_exceptions")
    .select("id,deal_id,matter_reference,status,reason,severity,scheduling_authorized,payment_observed_at,provider_resource_id,amount_due,currency,attempt_count,first_detected_at,last_detected_at,next_action,resolution,resolved_at,updated_at")
    .order("status", { ascending: true })
    .order("severity", { ascending: true })
    .order("last_detected_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: "EXCEPTION_READ_FAILED" }, { status: 503 });
  return NextResponse.json({ ok: true, exceptions: data ?? [] });
}

export async function POST(req: NextRequest) {
  const auth = await authorize();
  if ("error" in auth) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = await req.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const matterId = String(body.matterId ?? "").trim();
  const paymentReference = String(body.paymentReference ?? "").trim();
  const providerResourceId = String(body.providerResourceId ?? "").trim();
  const currency = String(body.currency ?? "").trim().toUpperCase();
  const evidenceLocator = String(body.evidenceLocator ?? "").trim();
  const settledAt = String(body.settledAt ?? "").trim();
  const grossAmount = Number(body.grossAmount);
  const netAmount = Number(body.netAmount);
  const feeAmount = Number(body.feeAmount);

  if (!matterId || !paymentReference || !providerResourceId || !evidenceLocator || !settledAt) {
    return NextResponse.json({ error: "REQUIRED_EVIDENCE_MISSING" }, { status: 400 });
  }
  if (!/^[A-Z]{3}$/.test(currency)) {
    return NextResponse.json({ error: "INVALID_CURRENCY" }, { status: 400 });
  }
  if (![grossAmount, netAmount, feeAmount].every(Number.isFinite)) {
    return NextResponse.json({ error: "INVALID_AMOUNT" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: deal, error: dealError } = await admin
    .from("deals")
    .select("id,deal_id,payment_confirmed,payment_status,payment_settlement_status")
    .eq("id", matterId)
    .single();
  if (dealError || !deal) {
    return NextResponse.json({ error: "MATTER_NOT_FOUND" }, { status: 404 });
  }

  const actor = `operator:${auth.user.email ?? auth.user.id}`;
  const { data: result, error } = await admin.rpc("confirm_wise_payment_from_provider_notification", {
    p_deal_id: matterId,
    p_payment_reference: paymentReference,
    p_provider_resource_id: providerResourceId,
    p_gross_amount: grossAmount,
    p_net_amount: netAmount,
    p_fee_amount: feeAmount,
    p_currency: currency,
    p_settled_at: settledAt,
    p_evidence_locator: evidenceLocator,
    p_actor: actor,
  });

  if (error) {
    return NextResponse.json({ error: "WISE_RECOVERY_REJECTED", detail: error.message }, { status: 409 });
  }

  await admin
    .from("wise_reconciliation_exceptions")
    .update({
      status: "resolved",
      resolution: "Exact official Wise provider settlement evidence accepted by governed recovery authority.",
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("deal_id", matterId);

  void logActivity({
    deal_id: deal.deal_id ?? matterId,
    actor,
    action: "payment_updated",
    detail: "Wise provider settlement exception recovered through governed exact-evidence authority.",
    meta: {
      provider_resource_id: providerResourceId,
      payment_reference: paymentReference,
      evidence_scope: "official_wise_provider_settlement",
    },
  }).catch((activityError) => console.error("[wise-recovery] activity log failed", activityError));

  return NextResponse.json({
    ok: true,
    matterId,
    matterReference: deal.deal_id ?? paymentReference,
    canonicalConfirmation: result,
  });
}
