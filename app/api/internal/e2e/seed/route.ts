import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";

function demoMatterRef() {
  return `MS-DEMO-${new Date().getFullYear()}-000001`;
}

function requireDemoMode() {
  if (process.env.MILANO_E2E_DEMO_MODE !== "true") {
    return NextResponse.json(
      { error: "E2E demo mode is not enabled." },
      { status: 403 },
    );
  }
  return null;
}

export async function POST(req: NextRequest) {
  const guard = requireDemoMode();
  if (guard) return guard;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as { reset?: boolean };
  const admin = createAdminClient();
  const DEMO_REF = demoMatterRef();
  const DEMO_EMAIL = "tiffany-demo@themilanoseal.test";

  // --- Discount code ---
  const { data: existingCode } = await admin
    .from("discount_codes")
    .select("id, status")
    .eq("code", "TIFFANYTEST")
    .maybeSingle();

  let discountCodeId: string;
  if (existingCode) {
    discountCodeId = existingCode.id as string;
    if (existingCode.status !== "ACTIVE") {
      await admin.from("discount_codes").update({ status: "ACTIVE" }).eq("id", discountCodeId);
    }
  } else {
    const { data: newCode, error: codeErr } = await admin
      .from("discount_codes")
      .insert({
        code: "TIFFANYTEST",
        discount_type: "fixed_amount",
        discount_value: 100,
        status: "ACTIVE",
        description: "Tiffany E2E demo code",
        internal_note: "Tiffany E2E demo — do not delete",
        usage_limit: null,
        usage_count: 0,
        expires_at: null,
      })
      .select("id")
      .single();
    if (codeErr || !newCode) {
      return NextResponse.json({ error: "Failed to create discount code: " + codeErr?.message }, { status: 500 });
    }
    discountCodeId = newCode.id as string;
  }

  // --- Demo matter ---
  const { data: existing } = await admin
    .from("deals")
    .select("id, deal_id, status, payment_status, discount_code_id")
    .eq("deal_id", DEMO_REF)
    .maybeSingle();

  let dealId: string;

  if (existing && body.reset) {
    // Hard reset: restore to awaiting_payment with original amount
    await admin
      .from("deals")
      .update({
        status: "awaiting_payment",
        invoice_status: "unpaid",
        payment_status: "unpaid",
        payment_reference: null,
        payment_amount_received: null,
        payment_confirmed: false,
        payment_method: "wise",
        amount_due: 1250,
        payment_amount_due: 1250,
        discount_code_id: null,
        tracking_number: null,
        carrier: null,
        scheduled_at: null,
        execution_at: null,
        apostille_at: null,
        shipped_at: null,
        completed_at: null,
        delivery_timestamp: null,
      })
      .eq("id", existing.id);

    // Clear prior redemptions for this matter
    await admin.from("discount_redemptions").delete().eq("deal_id", existing.id);

    dealId = existing.id as string;
    await logActivity({
      deal_id: existing.deal_id as string,
      actor: user.email ?? "operator",
      action: "system",
      detail: "E2E demo matter reset to awaiting_payment",
      meta: { source: "e2e-seed-reset" },
    });
  } else if (existing) {
    dealId = existing.id as string;
  } else {
    const { data: created, error: createErr } = await admin
      .from("deals")
      .insert({
        deal_id: DEMO_REF,
        matter_id: DEMO_REF,
        display_id: DEMO_REF,
        client_name: "Tiffany Demo Client",
        email: DEMO_EMAIL,
        phone: "+15550102026",
        document_type: "Power of Attorney",
        destination_country: "Italy",
        origin_state: "Florida",
        assigned_lane: "priority",
        status: "awaiting_payment",
        invoice_status: "unpaid",
        payment_status: "unpaid",
        payment_method: "wise",
        amount_due: 1250,
        payment_amount_due: 1250,
        currency: "USD",
        apostille_required: true,
        internal_notes: "E2E demo matter — Tiffany operator confidence test",
      })
      .select("id")
      .single();

    if (createErr || !created) {
      return NextResponse.json(
        { error: "Failed to create demo matter: " + createErr?.message },
        { status: 500 },
      );
    }
    dealId = created.id as string;

    const seedEvents = [
      { action: "INTAKE_CREATED", detail: "Demo intake received from Tiffany E2E seed" },
      { action: "MATTER_CREATED", detail: `Matter ${DEMO_REF} created — Power of Attorney · Italy · Priority` },
      { action: "QUOTE_GENERATED", detail: "Quote generated: $975 base + $275 apostille = $1,250" },
      { action: "PORTAL_LINK_CREATED", detail: "Client portal token issued for Tiffany Demo Client" },
      { action: "PAYMENT_INSTRUCTIONS_SENT", detail: "Wise payment instructions sent · Amount due: $1,250" },
    ];
    for (const evt of seedEvents) {
      await logActivity({ deal_id: DEMO_REF, actor: "system", action: evt.action, detail: evt.detail, meta: { source: "e2e-seed" } });
    }
  }

  return NextResponse.json({
    success: true,
    deal_id: dealId,
    matter_ref: DEMO_REF,
    reset: !!body.reset,
    discount_code_id: discountCodeId,
  });
}
