// Source data is immutable evidence. Runtime policy controls what can execute.
export const PROHIBITED_OPERATIONAL_PAYMENT_PROVIDERS = new Set(["stripe"]);
export const CANONICAL_PAYMENT_PROVIDER = "wise" as const;

export function classifyWorkbookValue(value: unknown) {
  const text = String(value ?? "").trim();
  if (/stripe/i.test(text)) return { value, classification: "legacy_prohibited" as const };
  return { value, classification: "source_preserved" as const };
}

export function canExecutePaymentProvider(provider: string | null | undefined) {
  if (!provider) return false;
  return !PROHIBITED_OPERATIONAL_PAYMENT_PROVIDERS.has(provider.trim().toLowerCase()) && provider.trim().toLowerCase() === CANONICAL_PAYMENT_PROVIDER;
}
