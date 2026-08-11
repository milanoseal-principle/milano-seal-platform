// Discount / Courtesy Code Engine
// Canonical runtime contract. Founder/admin controlled; browser state is never
// authoritative for eligibility, usage, or redemption.

export type DiscountType = "percentage" | "fixed_amount";
export type DiscountStatus = "inactive" | "active" | "exhausted" | "expired" | "revoked";
export type DiscountScope = "eligible_subtotal" | "specific_line_items" | "matter_total";

export interface DiscountCode {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  status: DiscountStatus;
  usage_limit: number | null;
  usage_count: number;
  starts_at: string | null;
  expires_at: string | null;
  applies_to: DiscountScope;
  matter_id?: string | null;
  client_id?: string | null;
  client_label?: string | null;
  internal_reason?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  metadata?: Record<string, unknown>;
}

export interface DiscountValidationResult {
  valid: boolean;
  code?: DiscountCode;
  discount_amount?: number;
  error?: string;
}

function money(value: number): number {
  return Math.max(0, Math.round(value * 100) / 100);
}

export function normalizeDiscountCode(input: string): string {
  return input.trim().toUpperCase();
}

export function computeDiscountAmount(
  code: DiscountCode,
  eligibleSubtotal: number,
): number {
  const subtotal = money(eligibleSubtotal);
  if (code.discount_type === "percentage") {
    return money(Math.min(subtotal, subtotal * (code.discount_value / 100)));
  }
  return money(Math.min(subtotal, code.discount_value));
}

export function validateCodeRedeemable(
  code: DiscountCode,
  matterId?: string,
  now = new Date(),
): { ok: boolean; error?: string } {
  if (code.status !== "active") {
    return { ok: false, error: "This code is not active." };
  }
  if (code.starts_at && new Date(code.starts_at) > now) {
    return { ok: false, error: "This code is not yet valid." };
  }
  if (code.expires_at && new Date(code.expires_at) < now) {
    return { ok: false, error: "This code has expired." };
  }
  if (code.usage_limit !== null && code.usage_count >= code.usage_limit) {
    return { ok: false, error: "This code has reached its maximum usage." };
  }
  if (code.matter_id && matterId && code.matter_id !== matterId) {
    return { ok: false, error: "This code is restricted to a specific matter." };
  }
  return { ok: true };
}

export function generateCourtesyCode(prefix = "SEAL"): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const rand = Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
  return `${prefix}-${rand}`;
}
