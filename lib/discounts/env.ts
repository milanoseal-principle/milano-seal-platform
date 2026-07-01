// Discount engine environment configuration.
//
// The engine is disabled by default. When DISCOUNT_ENGINE_ENABLED !== "true",
// the request/approval APIs return a disabled response. Comp (100%) approval
// additionally requires DISCOUNT_ALLOW_OPERATOR_COMP === "true".

export function isDiscountEngineEnabled(): boolean {
  return process.env.DISCOUNT_ENGINE_ENABLED === "true";
}

export function isOperatorCompAllowed(): boolean {
  return process.env.DISCOUNT_ALLOW_OPERATOR_COMP === "true";
}

function parseEmails(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function ownerEmails(): string[] {
  return parseEmails(process.env.DISCOUNT_OWNER_EMAILS);
}

export function operatorEmails(): string[] {
  return parseEmails(process.env.DISCOUNT_OPERATOR_EMAILS);
}

export function maxClientPercent(): number {
  const n = Number(process.env.DISCOUNT_MAX_CLIENT_PERCENT);
  return Number.isFinite(n) && n > 0 ? n : 20;
}

export function maxPartnerPercent(): number {
  const n = Number(process.env.DISCOUNT_MAX_PARTNER_PERCENT);
  return Number.isFinite(n) && n > 0 ? n : 15;
}
