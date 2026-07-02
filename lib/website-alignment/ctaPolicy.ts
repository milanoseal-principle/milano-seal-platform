export const PUBLIC_ALLOWED_CTAS = ["Begin Secure Intake", "Secure Portal", "Request Execution Quote", "Global Document Intelligence"] as const;
export const PUBLIC_BLOCKED_CTAS = ["Begin Execution", "Start Now", "Get Instant Approval", "Cheap Notary", "Notary Near Me", "Guaranteed Acceptance"] as const;
export function isAllowedPublicCta(value: string) { return PUBLIC_ALLOWED_CTAS.some((cta) => cta.toLowerCase() === value.trim().toLowerCase()); }
export function getSafePublicCtaFallback() { return "Begin Secure Intake"; }
