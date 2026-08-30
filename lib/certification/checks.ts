import type { CertificationCheck, CertificationPhase } from "./types";

const checks = (phase: CertificationPhase, labels: string[], continuity = false): CertificationCheck[] => labels.map((label, index) => ({ key: `${phase === "PHASE_2A" ? "2A" : phase.replace("PHASE_", "")}.${index + 1}`, phase, label, manual: true, matterContinuity: continuity }));

export const PRODUCTION_CERTIFICATION_CHECKS = Object.freeze([
  ...checks("PHASE_1", ["Deployed production SHA", "Production deployment ready", "/api/health", "/professional/damiani", "/portal/payment"]),
  ...checks("PHASE_2", ["Disposable eligible Matter", "Courier included", "Approved Wise beneficiary configuration", "amount_due continuity", "Controlled Wise payment", "Amount reconciliation", "Currency reconciliation", "Reference reconciliation", "Transaction ID reconciliation", "Canonical payment confirmation", "TIFFTEST50 single redemption", "Canonical scheduling authority", "Portal payment and discount state", "Deliberate mismatch rejected", "No second payment on replay", "No second discount redemption", "No duplicate scheduling transition"], true),
  ...checks("PHASE_2A", ["Mobile fresh load", "Normal intake navigation", "Matter submission", "Document upload", "Single Matter persistence", "Quote and Matter parity", "TIFFTEST50", "Wise payment", "Wise reconciliation and idempotency", "Payment to scheduling gate", "Matter Control Portal entry", "Notification delivery", "Portal and Supabase parity", "Governed execution to close", "Mobile UX and dead-action sweep"], true),
  ...checks("PHASE_3", ["Damiani route opens", "Italian default language", "DAMIANI50 auto-carried", "Representative Matter submitted", "Eligible subtotal only discounted", "Courier untouched", "Correct final total", "Correct Wise amount and reference", "STOP BEFORE PAYMENT", "DAMIANI50 usage count zero", "No redemption row", "No payment confirmation", "No scheduled status"], true),
  ...checks("PHASE_4", ["Legal name", "Codice fiscale", "Destination", "Document type", "Authentication authority", "Notarization requirement", "Wise beneficiary details", "Wise reference", "Final amount due", "Rendered document character comparison"], true),
  ...checks("PHASE_5", ["Final human GO or NO-GO decision"]),
]) satisfies readonly CertificationCheck[];

export const CERTIFICATION_PHASES: CertificationPhase[] = ["PHASE_1", "PHASE_2", "PHASE_2A", "PHASE_3", "PHASE_4", "PHASE_5"];
