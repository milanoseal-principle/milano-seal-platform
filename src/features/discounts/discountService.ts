import { createAdminClient } from "@/lib/supabase/admin";
import {
  computeDiscountAmount,
  normalizeDiscountCode,
  validateCodeRedeemable,
  type DiscountCode,
} from "@/lib/discountCodes";
import { writeEventLedger } from "@/src/features/audit/eventLedgerService";

function money(value: number) {
  return Math.max(0, Math.round(value * 100) / 100);
}

function eligibleSubtotalForMatter(matter: Record<string, unknown>): number {
  const raw = matter.eligible_subtotal;
  const explicit = Number(raw);
  if (raw === null || raw === undefined || !Number.isFinite(explicit) || explicit < 0) {
    throw new Error("DISCOUNT_REVIEW_REQUIRED: eligible subtotal is not explicitly stored.");
  }
  return money(explicit);
}

async function getMatterById(id: string) {
  const supabase = createAdminClient();
  return supabase.from("deals").select("*").eq("id", id).single();
}

async function updateMatter(id: string, values: Record<string, unknown>) {
  const supabase = createAdminClient();
  return supabase.from("deals").update(values).eq("id", id).select("*").single();
}

export async function applyDiscountToMatter(
  matterId: string,
  rawCode: string,
  actorEmail?: string | null,
) {
  const supabase = createAdminClient();
  const matterResult = await getMatterById(matterId);
  if (matterResult.error) throw matterResult.error;
  const matter = matterResult.data as Record<string, unknown>;

  if (["paid", "deposit_paid", "payment_confirmed"].includes(String(matter.payment_status))) {
    await writeEventLedger({
      matterId,
      actorEmail,
      eventType: "DISCOUNT_REJECTED",
      message: "Discount rejected after payment began.",
      metadata: { code: normalizeDiscountCode(rawCode) },
    });
    throw new Error("Discount cannot be applied after payment has started.");
  }

  const code = normalizeDiscountCode(rawCode);
  const { data, error } = await supabase
    .from("discount_codes")
    .select("id,code,discount_type,discount_value,status,usage_limit,usage_count,starts_at,expires_at,applies_to,matter_id,client_id,client_label,internal_reason,created_by,updated_by,metadata")
    .eq("code", code)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    await writeEventLedger({
      matterId,
      actorEmail,
      eventType: "DISCOUNT_REJECTED",
      message: "Discount code not found.",
      metadata: { code },
    });
    throw new Error("Discount code not found.");
  }

  const discount = data as DiscountCode;
  const validation = validateCodeRedeemable(discount, matterId);
  if (!validation.ok) {
    await writeEventLedger({
      matterId,
      actorEmail,
      eventType: "DISCOUNT_REJECTED",
      message: validation.error,
      metadata: { code },
    });
    throw new Error(validation.error ?? "Discount code is not eligible.");
  }

  if (discount.client_id && matter.client_id && discount.client_id !== matter.client_id) {
    throw new Error("Discount code is not eligible for this client.");
  }

  const eligibleSubtotal = eligibleSubtotalForMatter(matter);
  const nonDiscountableTotal = money(Number(matter.non_discountable_total ?? 0));
  const discountAmount = computeDiscountAmount(discount, eligibleSubtotal);
  const originalTotal = money(eligibleSubtotal + nonDiscountableTotal);
  const finalTotal = money(eligibleSubtotal - Math.min(eligibleSubtotal, discountAmount) + nonDiscountableTotal);
  const priorTotal = money(Number(matter.total_price ?? originalTotal));
  const priorRetainer = money(Number(matter.invoice_retainer ?? priorTotal));
  const retainerRatio = priorTotal > 0 ? Math.min(1, Math.max(0, priorRetainer / priorTotal)) : 1;
  const depositAmount = money(finalTotal * retainerRatio);
  const balanceDue = money(finalTotal - depositAmount);
  const updated = await updateMatter(matterId, {
    discount_code: discount.code, discount_type: discount.discount_type,
    discount_value: Number(discount.discount_value), discount_amount: discountAmount,
    original_total: originalTotal, final_total: finalTotal, total_price: finalTotal,
    invoice_retainer: depositAmount, invoice_balance: balanceDue, amount_due: depositAmount,
  });
  if (updated.error) throw updated.error;

  // IMPORTANT: applying/entering a code does NOT consume it. Redemption is
  // recorded atomically only after confirmed Wise reconciliation.
  await writeEventLedger({
    matterId,
    actorEmail,
    eventType: "DISCOUNT_APPLIED",
    metadata: {
      code: discount.code,
      discountCodeId: discount.id,
      eligibleSubtotal,
      discountAmount,
      finalTotal,
      redemptionStatus: "not_redeemed",
    },
  });
  return updated.data;
}

export async function removeDiscountFromMatter(
  matterId: string,
  actorEmail?: string | null,
) {
  const matterResult = await getMatterById(matterId);
  if (matterResult.error) throw matterResult.error;
  const matter = matterResult.data as Record<string, unknown>;

  if (["paid", "deposit_paid", "payment_confirmed"].includes(String(matter.payment_status))) {
    throw new Error("Discount cannot be removed after payment has started.");
  }

  const eligibleSubtotal = eligibleSubtotalForMatter(matter);
  const nonDiscountableTotal = money(Number(matter.non_discountable_total ?? 0));
  const originalTotal = money(Number(matter.original_total ?? (eligibleSubtotal + nonDiscountableTotal)));
  const priorFinal = money(Number(matter.final_total ?? matter.total_price ?? originalTotal));
  const priorRetainer = money(Number(matter.invoice_retainer ?? priorFinal));
  const retainerRatio = priorFinal > 0 ? Math.min(1, Math.max(0, priorRetainer / priorFinal)) : 1;
  const depositAmount = money(originalTotal * retainerRatio);
  const balanceDue = money(originalTotal - depositAmount);
  const updated = await updateMatter(matterId, {
    discount_code: null, discount_type: null, discount_value: null, discount_amount: 0,
    final_total: originalTotal, total_price: originalTotal, invoice_retainer: depositAmount,
    invoice_balance: balanceDue, amount_due: depositAmount,
  });
  if (updated.error) throw updated.error;
  await writeEventLedger({ matterId, actorEmail, eventType: "DISCOUNT_REMOVED" });
  return updated.data;
}

export async function redeemDiscountAfterWiseReconciliation(params: {
  matterId: string;
  paymentReference: string;
  wiseTransactionReference?: string | null;
  currency: string;
  actor?: string;
}) {
  const supabase = createAdminClient();
  const matterResult = await getMatterById(params.matterId);
  if (matterResult.error || !matterResult.data) return { redeemed: false, reason: "matter_not_found" };

  const matter = matterResult.data as Record<string, unknown>;
  const code = normalizeDiscountCode(String(matter.discount_code ?? ""));
  if (!code) return { redeemed: false, reason: "no_discount_attached" };

  const { data: discount, error } = await supabase
    .from("discount_codes")
    .select("id")
    .eq("code", code)
    .maybeSingle();
  if (error) throw error;
  if (!discount?.id) return { redeemed: false, reason: "discount_not_found" };

  const { data, error: rpcError } = await supabase.rpc("redeem_discount_for_matter", {
    p_discount_code_id: discount.id,
    p_matter_id: params.matterId,
    p_payment_reference: params.paymentReference,
    p_wise_transaction_reference: params.wiseTransactionReference ?? null,
    p_currency: params.currency.toUpperCase(),
    p_created_by: params.actor ?? "wise-webhook",
  });
  if (rpcError) throw rpcError;

  await writeEventLedger({
    matterId: params.matterId,
    actorEmail: params.actor ?? "wise-webhook",
    eventType: "DISCOUNT_REDEEMED",
    metadata: { code, redemptionId: data, paymentReference: params.paymentReference },
  });
  return { redeemed: true, redemptionId: data };
}
