// Discount / Courtesy Code Engine
// Founder-controlled only. VA and operators cannot create or modify codes.

export interface DiscountCode {
  id: string;
  code: string;
  label: string;
  discount_type: "percent" | "fixed" | "waive_service_fee" | "courtesy";
  discount_value: number;
  max_uses: number | null;
  uses_count: number;
  valid_from: string;
  valid_until: string | null;
  active: boolean;
  created_by: string;
  notes: string | null;
  deal_id_restriction: string | null;
  single_use: boolean;
}

export interface DiscountValidationResult {
  valid: boolean;
  code?: DiscountCode;
  discount_amount?: number;
  error?: string;
}

export function computeDiscountAmount(
  code: DiscountCode,
  originalAmount: number
): number {
  if (code.discount_type === "percent") {
    return Math.round((originalAmount * code.discount_value) / 100 * 100) / 100;
  }
  if (code.discount_type === "fixed" || code.discount_type === "courtesy") {
    return Math.min(code.discount_value, originalAmount);
  }
  if (code.discount_type === "waive_service_fee") {
    return code.discount_value;
  }
  return 0;
}

export function validateCodeRedeemable(
  code: DiscountCode,
  dealId?: string
): { ok: boolean; error?: string } {
  if (!code.active) return { ok: false, error: "This code is no longer active." };

  const now = new Date();
  if (new Date(code.valid_from) > now) {
    return { ok: false, error: "This code is not yet valid." };
  }
  if (code.valid_until && new Date(code.valid_until) < now) {
    return { ok: false, error: "This code has expired." };
  }
  if (code.max_uses !== null && code.uses_count >= code.max_uses) {
    return { ok: false, error: "This code has reached its maximum usage." };
  }
  if (code.single_use && code.uses_count >= 1) {
    return { ok: false, error: "This code has already been redeemed." };
  }
  if (code.deal_id_restriction && dealId && code.deal_id_restriction !== dealId) {
    return { ok: false, error: "This code is restricted to a specific matter." };
  }
  return { ok: true };
}

export function generateCourtesyCode(prefix = "SEAL"): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rand = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${prefix}-${rand}`;
}
