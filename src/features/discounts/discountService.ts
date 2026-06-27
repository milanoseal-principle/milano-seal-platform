import { createAdminClient } from "@/lib/supabase/admin";
import { getMatterById, updateMatter } from "@/src/features/matters/matterRepository";
import { writeEventLedger } from "@/src/features/audit/eventLedgerService";

function money(value: number) {
  return Math.max(0, Math.round(value * 100) / 100);
}

export async function applyDiscountToMatter(matterId: string, code: string, actorEmail?: string | null) {
  const supabase = createAdminClient();
  const matterResult = await getMatterById(matterId);
  if (matterResult.error) throw matterResult.error;
  const matter = matterResult.data;

  if (["paid", "deposit_paid"].includes(String(matter.payment_status))) {
    await writeEventLedger({ matterId, actorEmail, eventType: "DISCOUNT_REJECTED", message: "Discount rejected after payment began.", metadata: { code } });
    throw new Error("Discount cannot be applied after payment has started.");
  }

  const { data: discount, error } = await supabase
    .from("discount_codes")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .eq("active", true)
    .maybeSingle();

  if (error) throw error;
  if (!discount) {
    await writeEventLedger({ matterId, actorEmail, eventType: "DISCOUNT_REJECTED", message: "Discount code not found or inactive.", metadata: { code } });
    throw new Error("Discount code not found or inactive.");
  }

  if (discount.expires_at && new Date(discount.expires_at) < new Date()) throw new Error("Discount code expired.");
  if (discount.max_uses && Number(discount.current_use_count ?? 0) >= Number(discount.max_uses)) throw new Error("Discount code usage limit reached.");

  const originalTotal = Number(matter.original_total ?? matter.final_total ?? 0);
  const value = Number(discount.value ?? 0);
  const type = String(discount.type ?? "fixed");
  const discountAmount = money(type === "percentage" ? originalTotal * (value / 100) : value);
  const finalTotal = money(originalTotal - Math.min(originalTotal, discountAmount));
  const depositRequired = Boolean(matter.deposit_required);
  const depositAmount = depositRequired ? money(finalTotal / 2) : finalTotal;
  const balanceDue = depositRequired ? money(finalTotal - depositAmount) : 0;

  const updated = await updateMatter(matterId, {
    discount_code: discount.code,
    discount_type: type,
    discount_value: value,
    discount_amount: discountAmount,
    final_total: finalTotal,
    deposit_amount: depositAmount,
    balance_due: balanceDue,
  });
  if (updated.error) throw updated.error;

  await supabase.from("discount_redemptions").insert({
    discount_code_id: discount.id,
    matter_id: matterId,
    client_id: matter.client_id,
    original_total: originalTotal,
    discount_amount: discountAmount,
    final_total: finalTotal,
    redeemed_by: actorEmail,
  });
  await writeEventLedger({ matterId, actorEmail, eventType: "DISCOUNT_APPLIED", metadata: { code: discount.code, discountAmount, finalTotal } });
  return updated.data;
}

export async function removeDiscountFromMatter(matterId: string, actorEmail?: string | null) {
  const matterResult = await getMatterById(matterId);
  if (matterResult.error) throw matterResult.error;
  const matter = matterResult.data;
  const originalTotal = Number(matter.original_total ?? matter.final_total ?? 0);
  const depositRequired = Boolean(matter.deposit_required);
  const depositAmount = depositRequired ? money(originalTotal / 2) : originalTotal;
  const balanceDue = depositRequired ? money(originalTotal - depositAmount) : 0;
  const updated = await updateMatter(matterId, {
    discount_code: null,
    discount_type: null,
    discount_value: null,
    discount_amount: 0,
    final_total: originalTotal,
    deposit_amount: depositAmount,
    balance_due: balanceDue,
  });
  if (updated.error) throw updated.error;
  await writeEventLedger({ matterId, actorEmail, eventType: "DISCOUNT_REMOVED" });
  return updated.data;
}
