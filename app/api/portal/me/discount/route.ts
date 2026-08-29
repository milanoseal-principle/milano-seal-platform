import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentClientDeal } from "@/lib/portalAuth";
import { buildPaymentLink } from "@/lib/dealId";
import {
  buildClientInvoiceSnapshot,
  calculateCourtesyAdjustment,
} from "@/lib/portalInvoice";

export const runtime = "nodejs";

function codeOf(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function num(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function activeNow(row: Record<string, unknown>) {
  const now = Date.now();
  if (row.status !== "active") return false;
  if (row.starts_at && new Date(String(row.starts_at)).getTime() > now) return false;
  if (row.expires_at && new Date(String(row.expires_at)).getTime() < now) return false;
  const limit = row.usage_limit == null ? null : Number(row.usage_limit);
  const used = Number(row.usage_count ?? 0);
  if (limit != null && Number.isFinite(limit) && used >= limit) return false;
  return true;
}

const DEAL_SELECT = [
  "id",
  "deal_id",
  "client_name",
  "email",
  "document_type",
  "destination_country",
  "lane",
  "execution_lane",
  "base_price",
  "docs_count",
  "signers",
  "witness_total",
  "apostille_required",
  "requires_apostille",
  "urgency",
  "internal_notes",
  "original_total",
  "eligible_subtotal",
  "non_discountable_total",
  "discount_code",
  "discount_type",
  "discount_value",
  "discount_amount",
  "final_total",
  "total_price",
  "invoice_subtotal",
  "invoice_retainer",
  "invoice_balance",
  "amount_due",
  "amount_paid",
  "payment_amount_received",
  "payment_status",
  "payment_confirmed",
  "currency",
  "payment_link",
  "payment_reference",
  "wise_reference",
].join(",");

export async function POST(req: NextRequest) {
  const server = await createClient();
  const {
    data: { user },
  } = await server.auth.getUser();
  if (!user?.id || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    code?: unknown;
    deal_id?: unknown;
  };
  const code = codeOf(body.code);
  const dealId = typeof body.deal_id === "string" ? body.deal_id : null;
  if (!code) {
    return NextResponse.json({ error: "Enter a valid discount code." }, { status: 400 });
  }

  const clientCtx = await getCurrentClientDeal(dealId);
  if (!clientCtx?.deal) {
    return NextResponse.json({ error: "Matter not found." }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data: deal, error: dealError } = await admin
    .from("deals")
    .select(DEAL_SELECT)
    .eq("id", clientCtx.deal.id)
    .single();
  if (dealError || !deal) {
    return NextResponse.json({ error: "Matter pricing is unavailable." }, { status: 500 });
  }

  const row = deal as Record<string, unknown>;
  const paid = Boolean(row.payment_confirmed) || ["paid", "confirmed", "payment_confirmed"].includes(String(row.payment_status ?? "").toLowerCase()) || num(row.amount_paid ?? row.payment_amount_received) > 0;
  if (paid) {
    return NextResponse.json({ error: "Discounts cannot be changed after payment has been verified." }, { status: 409 });
  }

  const existingCode = codeOf(row.discount_code);
  if (existingCode) {
    if (existingCode === code) {
      return NextResponse.json({ success: true, invoice: buildClientInvoiceSnapshot(row) });
    }
    return NextResponse.json({ error: "A discount has already been applied to this Matter." }, { status: 409 });
  }

  const { data: discount, error: discountError } = await admin
    .from("discount_codes")
    .select("id,code,discount_type,discount_value,status,usage_limit,usage_count,starts_at,expires_at,applies_to,client_id,matter_id,metadata")
    .eq("code", code)
    .maybeSingle();

  if (discountError) {
    return NextResponse.json({ error: "Discount validation is temporarily unavailable." }, { status: 503 });
  }
  if (!discount || !activeNow(discount as Record<string, unknown>)) {
    return NextResponse.json({ error: "That discount code is invalid or unavailable." }, { status: 400 });
  }

  const d = discount as Record<string, unknown>;
  const restrictedClientId = String(d.client_id ?? "");
  if (restrictedClientId && restrictedClientId !== user.id) {
    return NextResponse.json({ error: "That discount code is not eligible for this account." }, { status: 403 });
  }
  const restrictedMatterId = String(d.matter_id ?? "");
  if (restrictedMatterId && restrictedMatterId !== String(row.id)) {
    return NextResponse.json({ error: "That discount code is restricted to another Matter." }, { status: 403 });
  }

  const appliesTo = String(d.applies_to ?? "eligible_subtotal");
  if (!['eligible_subtotal', 'matter_total'].includes(appliesTo)) {
    return NextResponse.json({ error: "This discount requires operator review." }, { status: 409 });
  }

  const originalTotal = num(row.original_total ?? row.total_price ?? row.final_total);
  const nonDiscountableTotal = num(row.non_discountable_total);
  const eligibleSubtotal = num(row.eligible_subtotal) || Math.max(0, originalTotal - nonDiscountableTotal);
  if (!(originalTotal > 0)) {
    return NextResponse.json({ error: "The Matter must have a final quote before a discount can be applied." }, { status: 409 });
  }

  const adjustment = calculateCourtesyAdjustment({
    originalTotal,
    eligibleSubtotal,
    appliesTo,
    discountType: String(d.discount_type ?? "percentage"),
    discountValue: num(d.discount_value),
  });

  const displayId = String(row.deal_id ?? row.id);
  const currency = String(row.currency ?? "USD");
  const paymentLink = buildPaymentLink(displayId, adjustment.retainer, currency);

  const update = {
    discount_code: code,
    discount_type: String(d.discount_type ?? "percentage"),
    discount_value: num(d.discount_value),
    discount_amount: adjustment.discountAmount,
    final_total: adjustment.finalTotal,
    final_price: adjustment.finalTotal,
    total_price: adjustment.finalTotal,
    invoice_subtotal: adjustment.finalTotal,
    invoice_retainer: adjustment.retainer,
    invoice_balance: adjustment.balance,
    amount_due: adjustment.retainer,
    payment_link: paymentLink,
    payment_reference: displayId,
    wise_reference: displayId,
  };

  const { data: updated, error: updateError } = await admin
    .from("deals")
    .update(update)
    .eq("id", row.id)
    .eq("payment_confirmed", false)
    .select(DEAL_SELECT)
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ error: "The discount could not be applied. No payment state was changed." }, { status: 409 });
  }

  // Audit and redemption records are append-only evidence. They do not grant
  // payment authority; Wise settlement remains the only paid-state authority.
  const usageCount = Number(d.usage_count ?? 0);
  void admin
    .from("discount_codes")
    .update({ usage_count: usageCount + 1 })
    .eq("id", d.id)
    .eq("usage_count", usageCount)
    .then(() => undefined);

  void admin.from("discount_redemptions").insert({
    discount_code_id: d.id,
    code,
    matter_id: row.id,
    client_id: user.id,
    eligible_subtotal: adjustment.base,
    discount_amount: adjustment.discountAmount,
    final_amount: adjustment.finalTotal,
    redeemed_by: user.id,
    payment_reference: displayId,
    currency,
    status: "redeemed",
    redeemed_at: new Date().toISOString(),
    created_by: "client_portal",
    metadata: { applies_to: appliesTo, source: "portal_invoice" },
  }).then(() => undefined);

  void admin.from("discount_audit_log").insert({
    discount_code_id: d.id,
    action: "client_applied",
    actor_id: user.id,
    matter_id: row.id,
    client_id: user.id,
    internal_reason: "Client applied authorized discount before payment",
    metadata: {
      source: "portal_invoice",
      original_total: originalTotal,
      discount_amount: adjustment.discountAmount,
      final_total: adjustment.finalTotal,
      retainer: adjustment.retainer,
    },
  }).then(() => undefined);

  return NextResponse.json({
    success: true,
    invoice: buildClientInvoiceSnapshot(updated as Record<string, unknown>),
  });
}
