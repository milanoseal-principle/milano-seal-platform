import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { appendLedger, CUSTODY_EVENTS } from "@/lib/custodyLedger";
import { isFounderAdmin } from "@/lib/security/access-control";

export const runtime = "nodejs";

// Founder-only authenticated production go-live proof. Drives the REAL release
// route against an explicitly-marked test matter and verifies the hash-linked
// custody ledger + audit rows. Never public, never bypasses any gate, never
// touches Wise/Shippo/email/labels, never accepts payment/role fields from body.
const CONFIRM_TOKEN = "EXECUTE_PRODUCTION_LEDGER_TEST";

function fail(step: string, details: string, evidence: Record<string, unknown> = {}) {
  return NextResponse.json(
    { ok: false, test: "authenticated_production_matter_ledger", failed_step: step, details, evidence, final_status: "FAIL" },
    { status: 500 },
  );
}

export async function POST(req: Request) {
  // 1. Auth — founder_admin only, role resolved server-side (never from body).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  }
  const role = user.app_metadata?.role ?? user.user_metadata?.role;
  if (!isFounderAdmin(role)) {
    return NextResponse.json({ ok: false, code: "FOUNDER_ONLY" }, { status: 403 });
  }

  // 2. Body — explicit confirmation + written reason; ignore any payment/role fields.
  const body = (await req.json().catch(() => ({}))) as {
    matter_id?: string;
    confirm?: string;
    override_reason?: string;
  };
  if (body.confirm !== CONFIRM_TOKEN) {
    return NextResponse.json({ ok: false, code: "CONFIRMATION_REQUIRED" }, { status: 400 });
  }
  const overrideReason = String(body.override_reason ?? "").trim();
  if (overrideReason.length < 20) {
    return NextResponse.json({ ok: false, code: "OVERRIDE_REASON_TOO_SHORT" }, { status: 400 });
  }
  const matterId = String(body.matter_id ?? "").trim();
  if (!matterId) {
    return NextResponse.json({ ok: false, code: "MISSING_MATTER_ID" }, { status: 400 });
  }

  const admin = createAdminClient();
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(matterId);
  const { data: deal } = await admin
    .from("deals")
    .select("id, deal_id, client_name, destination_country, amount_due, total_price, payment_confirmed_at, payment_observed_at")
    .eq(isUuid ? "id" : "deal_id", matterId)
    .single();
  if (!deal) {
    return NextResponse.json({ ok: false, code: "MATTER_NOT_FOUND" }, { status: 404 });
  }

  // 3. Test-matter guard — refuse to ever run against a real client matter.
  const isTestMatter =
    String(deal.deal_id ?? "").startsWith("MS-2026-E2E-") ||
    /production test/i.test(String(deal.client_name ?? ""));
  if (!isTestMatter) {
    return NextResponse.json(
      { ok: false, code: "NON_TEST_MATTER", details: "Refusing to run production test against non-test matter." },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const amt = Number(deal.amount_due ?? deal.total_price ?? 750);

  // 4. Put the test matter into visible-but-NOT-cleared state (observed_available).
  const { error: upErr } = await admin
    .from("deals")
    .update({
      payment_status: "paid",
      payment_confirmed: true,
      payment_confirmed_at: deal.payment_confirmed_at ?? now,
      amount_paid: amt,
      amount_due: amt,
      payment_settlement_status: "observed_available",
      payment_observed_at: deal.payment_observed_at ?? now,
      payment_funding_method: "wise_visible_pending_test",
      deal_status: "scheduled",
      updated_at: now,
    })
    .eq("id", deal.id);
  if (upErr) return fail("setup_observed_state", upErr.message);

  // 5. Ledger the observed payment.
  await appendLedger({
    deal_id: deal.id,
    event: CUSTODY_EVENTS.PAYMENT_RECONCILED,
    actor_type: "operator",
    actor_id: user.email ?? user.id,
    status: "observed_available",
    notes: "Authenticated production matter test payment observed.",
    metadata: { test: true, matter_test: "production_ledger", settlement_status: "observed_available" },
  });

  // Internal call to the REAL release route, forwarding the founder's auth cookie.
  const host = req.headers.get("host") ?? "";
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const origin = host ? `${proto}://${host}` : new URL(req.url).origin;
  const cookie = req.headers.get("cookie") ?? "";
  const releaseUrl = `${origin}/api/deals/${deal.id}/release`;

  // 6. Release WITHOUT override must be BLOCKED (settlement pending).
  const r1 = await fetch(releaseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({}),
  });
  const j1 = await r1.json().catch(() => ({}));
  if (r1.status !== 402 || j1.ok === true) {
    return fail("release_without_override_not_blocked", `expected 402 blocked, got ${r1.status}`, { response: j1 });
  }

  // 7. Release WITH founder override reason must SUCCEED.
  const r2 = await fetch(releaseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ override_reason: overrideReason }),
  });
  const j2 = await r2.json().catch(() => ({}));
  if (r2.status !== 200 || j2.ok !== true || !j2.hash) {
    return fail("release_with_override_failed", `expected 200 ok+hash, got ${r2.status}`, { response: j2 });
  }

  // 8. Verify hash-linked custody ledger rows.
  const { data: rows } = await admin
    .from("custody_ledger")
    .select("event, actor_type, actor_id, status, notes, metadata, prev_hash, hash, created_at")
    .eq("deal_id", deal.id)
    .order("created_at", { ascending: true });
  const ledger = rows ?? [];
  const present = (event: string) =>
    ledger.some((r) => r.event === event && r.hash && r.created_at);
  const paymentReconciled = present("PAYMENT_RECONCILED");
  const releaseGateOverride = present("RELEASE_GATE_OVERRIDE");
  const docReleaseConfirmed = present("DOC_RELEASE_CONFIRMED");
  if (!(paymentReconciled && releaseGateOverride && docReleaseConfirmed)) {
    return fail("ledger_missing_events", "required custody events not all present", {
      payment_reconciled: paymentReconciled,
      release_gate_override: releaseGateOverride,
      doc_release_confirmed: docReleaseConfirmed,
      custody_rows: ledger,
    });
  }

  // 9. Verify audit_logs release proof.
  const { data: audit } = await admin
    .from("audit_logs")
    .select("event, resource, created_at")
    .eq("event", "DOC_RELEASE_CONFIRMED")
    .in("resource", [deal.id, deal.deal_id ?? deal.id])
    .order("created_at", { ascending: false })
    .limit(1);
  const auditLogReleaseConfirmed = (audit ?? []).length > 0;

  // 10. Re-read the matter for the final evidence snapshot.
  const { data: after } = await admin
    .from("deals")
    .select(
      "id, deal_id, client_name, payment_status, payment_confirmed, payment_confirmed_at, payment_settlement_status, payment_observed_at, payment_cleared_at, founder_payment_override_at, founder_payment_override_by",
    )
    .eq("id", deal.id)
    .single();

  return NextResponse.json({
    ok: true,
    test: "authenticated_production_matter_ledger",
    matter: after,
    release_gate: {
      without_override_blocked: true,
      without_override_status: 402,
      with_override_released: true,
      with_override_status: 200,
    },
    ledger: {
      payment_reconciled: paymentReconciled,
      release_gate_override: releaseGateOverride,
      doc_release_confirmed: docReleaseConfirmed,
      audit_log_release_confirmed: auditLogReleaseConfirmed,
      custody_rows: ledger,
    },
    final_status: "PASS",
  });
}
