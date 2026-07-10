/**
 * safetyGuard — blocks prohibited claims for high-value asset outputs and
 * validates matters. Milano Seal provides document-execution support only.
 */

import type { HighValueAssetMatter } from "@/lib/high-value-assets/types";

export const HVA_BLOCKED_CLAIMS: readonly string[] = [
  "we guarantee title transfer",
  "guarantee title transfer",
  "we clear customs",
  "clear customs",
  "we register with uscg",
  "register with uscg",
  "we register with faa",
  "register with faa",
  "we approve ownership",
  "approve ownership",
  "we guarantee delivery",
  "guarantee delivery",
  "we provide legal advice",
  "legal advice",
  "we insure the asset",
  "insure the asset",
  "we certify value",
  "certify value",
  "we verify provenance as fact",
  "verify provenance",
  "we guarantee acceptance",
  "guarantee acceptance",
];

export const HVA_REQUIRED_DISCLAIMER =
  "Document execution support only — notarization / apostille coordination where applicable, review-dependent. Not legal, tax, title, customs, or insurance advice. Milano Seal does not transfer title, clear customs, register with USCG/FAA, approve ownership, insure, certify value, or guarantee acceptance.";

export interface SafetyValidation {
  ok: boolean;
  violations: string[];
}

/** Reject text that asserts a prohibited guarantee/approval. */
export function validateHighValueAssetOutput(text: string | null | undefined): SafetyValidation {
  if (!text) return { ok: true, violations: [] };
  const s = text.toLowerCase();
  const violations = HVA_BLOCKED_CLAIMS.filter((c) => s.includes(c));
  return { ok: violations.length === 0, violations };
}

/** A matter is valid only when it preserves the no-guarantee flag. */
export function validateHighValueAssetMatter(matter: HighValueAssetMatter): SafetyValidation {
  const violations: string[] = [];
  if (matter.safetyFlags.cannotGuaranteeOutcome !== true) {
    violations.push("cannotGuaranteeOutcome must remain true");
  }
  return { ok: violations.length === 0, violations };
}
