// Complexity scoring + flag derivation for Smart Intake. INTERNAL ONLY.

import type { ComplexityFlag, SmartPricingInput } from "./types";

// Derive the set of complexity flags for an intake. Pure, deterministic.
export function deriveComplexityFlags(input: SmartPricingInput): ComplexityFlag[] {
  const flags = new Set<ComplexityFlag>();
  const docCount = input.documentCount ?? 1;
  const signerCount = input.signerCount ?? 1;

  flags.add(docCount > 1 ? "multiple_documents" : "single_document");
  flags.add(signerCount > 1 ? "multiple_signers" : "single_signer");

  if (input.apostilleRequired) flags.add("apostille_required");
  if (input.authenticationRequired) flags.add("federal_document");
  if (input.apostilleRequired && input.authenticationRequired) flags.add("mixed_state_federal");
  if (input.translationNeeded === "unknown" || input.translationNeeded === true) flags.add("translation_sensitive");
  if (input.receivingAuthorityType === "embassy_consular") flags.add("foreign_receiving_authority");
  if (input.urgency === "urgent" || input.urgency === "same_day") flags.add("urgent_deadline");
  if (input.professionalIntermediary) flags.add("professional_intermediary");
  if (input.regulatedUseCase) flags.add("regulated_professional");
  if (input.fingerprintUseCase) flags.add("fingerprinting_route");
  if (input.loanSigningNeeded) flags.add("loan_signing");
  if (input.documentFamily === "education_credentials") flags.add("education_credentials");
  if (input.documentFamily === "immigration_citizenship") flags.add("immigration_citizenship");
  if (input.documentFamily === "business_corporate") flags.add("business_corporate");

  return Array.from(flags);
}

// Score complexity 0–100 from flags + counts. Higher = more operator attention.
export function scoreComplexity(input: SmartPricingInput, flags: ComplexityFlag[]): number {
  const docCount = input.documentCount ?? 1;
  const signerCount = input.signerCount ?? 1;
  const heavyFlags: ComplexityFlag[] = [
    "mixed_state_federal",
    "regulated_professional",
    "fingerprinting_route",
    "loan_signing",
    "immigration_citizenship",
    "high_value_transaction",
    "foreign_receiving_authority",
  ];
  const heavyCount = flags.filter((f) => heavyFlags.includes(f)).length;
  const raw = docCount * 5 + signerCount * 2 + heavyCount * 12 + (flags.includes("urgent_deadline") ? 10 : 0);
  return Math.min(100, raw);
}
