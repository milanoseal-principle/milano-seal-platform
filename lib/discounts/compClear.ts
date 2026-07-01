// Comp-clear service — applies an owner/operator-approved 100% comp to a matter
// and clears payment through an AUDITED discount redemption.
//
// Design (confirmed against live production schema):
//   * Operates on the `deals` table, mirroring the proven operator payment-clear
//     path in app/api/admin/matters/[id]/confirm-payment (payment_confirmed=true,
//     payment_status='confirmed', payment_settlement_status='observed_available').
//   * Does NOT introduce a new comped payment status and does NOT edit the release gate:
//     the gate already accepts payment_confirmed=true, so no bypass and no new
//     CHECK constraint are needed.
//   * The comp is distinguished — and justified — by an audited row in
//     discount_redemptions (final_amount = 0) that references a real 100% comp
//     discount_codes row, plus PAYMENT_COMPED / PAYMENT_BALANCE_UPDATED /
//     SCHEDULING_UNLOCKED events. Payment clearing is therefore always backed by an
//     audited discount state — never an unaudited payment_status write.
//
// Permission (canApproveComp) is enforced by the route before calling this.

import { createAdminClient } from "@/lib/supabase/admin";
import { writeEventLedger } from "@/src/features/audit/eventLedgerService";

export interface CompClearInput {
  dealId: string;            // deals.id (the matter)
  discountCodeId: string;    // discount_codes.id — must be an ACTIVE 100% comp
  approverUserId: string;    // authenticated approver (uuid)
  approverEmail: string | null;
  reason?: string | null;
}

export interface CompClearResult {
  ok: boolean;
  alreadyCleared?: boolean;
  originalAmount?: number;
  finalAmount?: number;
}

function money(v: number) {
  return Math.max(0, Math.round((Number(v) || 0) * 100) / 100);
}

export async function compClearMatter(input: CompClearInput): Promise<CompClearResult> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  // 1. Load the matter (deals row).
  const { data: deal, error: dealErr } = await admin
    .from("deals")
    .select("id, client_id, amount_due, payment_confirmed, payment_status")
    .eq("id", input.dealId)
    .single();
  if (dealErr) throw dealErr;
  if (!deal) throw new Error("Matter not found.");

  // Idempotency — never re-clear or double-write.
  if (deal.payment_confirmed === true) {
    return { ok: true, alreadyCleared: true };
  }

  // 2. Validate the discount code is a real, active 100% comp.
  const { data: code, error: codeErr } = await admin
    .from("discount_codes")
    .select("id, code, discount_type, discount_value, status")
    .eq("id", input.discountCodeId)
    .single();
  if (codeErr) throw codeErr;
  if (!code) throw new Error("Comp discount code not found.");
  if (String(code.status) !== "ACTIVE") throw new Error("Comp discount code is not active.");
  const isFullComp =
    String(code.discount_type) === "percentage" && Number(code.discount_value) >= 100;
  if (!isFullComp) {
    throw new Error("compClearMatter requires a 100% (percentage) comp discount code.");
  }

  const originalAmount = money(deal.amount_due ?? 0);
  const discountAmount = originalAmount; // full comp
  const finalAmount = money(originalAmount - discountAmount); // always 0, clamped >= 0

  // 3. Record the AUDITED redemption first — this is the discount state that
  //    justifies clearing payment. If this fails, we do not touch payment.
  const { error: redErr } = await admin.from("discount_redemptions").insert({
    discount_code_id: code.id,
    code: code.code,
    matter_id: input.dealId,
    client_id: deal.client_id ?? null,
    original_amount: originalAmount,
    discount_amount: discountAmount,
    final_amount: finalAmount,
    redeemed_by: input.approverUserId,
    approved_by: input.approverUserId,
  });
  if (redErr) throw redErr;

  // 4. Clear payment on the matter — mirror the proven operator confirm path.
  const { error: updErr } = await admin
    .from("deals")
    .update({
      payment_confirmed: true,
      payment_confirmed_at: now,
      payment_status: "confirmed", // existing accepted value — no new status
      paid_at: now,
      payment_settlement_status: "observed_available",
      payment_observed_at: now,
      amount_due: finalAmount, // 0
    })
    .eq("id", input.dealId);
  if (updErr) throw updErr;

  // 5. Best-effort usage increment on the comp code (non-payment-critical).
  try {
    const { data: fresh } = await admin
      .from("discount_codes")
      .select("usage_count")
      .eq("id", code.id)
      .single();
    const next = Number(fresh?.usage_count ?? 0) + 1;
    await admin.from("discount_codes").update({ usage_count: next }).eq("id", code.id);
  } catch {
    /* non-blocking; usage tracking is not payment-critical */
  }

  // 6. Audited events — the trail the release/scheduling state relies on.
  const meta = {
    comp_code: code.code,
    discount_code_id: code.id,
    original_amount: originalAmount,
    discount_amount: discountAmount,
    final_amount: finalAmount,
    approved_by: input.approverEmail,
    reason: input.reason ?? null,
    payment_reference: `DISCOUNT-COMP-${input.dealId}`,
    payment_method: "operator_comp",
  };
  await writeEventLedger({
    matterId: input.dealId,
    actorEmail: input.approverEmail,
    eventType: "PAYMENT_COMPED",
    message: "Matter cleared by owner/operator-approved 100% comp.",
    metadata: meta,
  });
  await writeEventLedger({
    matterId: input.dealId,
    actorEmail: input.approverEmail,
    eventType: "PAYMENT_BALANCE_UPDATED",
    statusBefore: String(deal.amount_due ?? ""),
    statusAfter: "0",
    metadata: meta,
  });
  await writeEventLedger({
    matterId: input.dealId,
    actorEmail: input.approverEmail,
    eventType: "SCHEDULING_UNLOCKED",
    message: "Scheduling unlocked by audited comp-cleared payment state.",
    metadata: meta,
  });

  return { ok: true, originalAmount, finalAmount };
}
