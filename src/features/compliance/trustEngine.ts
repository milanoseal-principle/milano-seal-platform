import type { IntakePayload } from "@/src/features/milano/types";
import { routeCompliance } from "./complianceRouter";

export type TrustEngineDecision =
  | "approved_for_quote"
  | "needs_operator_review"
  | "missing_document"
  | "signer_issue"
  | "ron_eligibility_review"
  | "translation_review"
  | "compliance_review"
  | "out_of_scope";

export interface TrustEngineResult {
  decision: TrustEngineDecision;
  flags: TrustEngineDecision[];
  approved_for_quote: boolean;
  operator_message: string;
}

export function runTrustEngine(input: IntakePayload): TrustEngineResult {
  const flags = new Set<TrustEngineDecision>();
  const compliance = routeCompliance(input.destination_country);

  if (!input.document_type || !input.destination_country) flags.add("needs_operator_review");
  if (Number(input.signer_count ?? 1) < 1) flags.add("signer_issue");
  if (String(input.execution_type ?? "").toLowerCase() === "unsure") flags.add("ron_eligibility_review");
  if (compliance.translation_likely) flags.add("translation_review");
  if (compliance.compliance_review_required) flags.add("compliance_review");

  const decision = flags.has("compliance_review")
    ? "compliance_review"
    : flags.has("needs_operator_review")
      ? "needs_operator_review"
      : flags.has("translation_review")
        ? "translation_review"
        : "approved_for_quote";

  return {
    decision,
    flags: Array.from(flags),
    approved_for_quote: decision === "approved_for_quote" || decision === "translation_review",
    operator_message: decision === "approved_for_quote" ? "Matter can proceed to quote." : "Operator review required before final quote or execution commitment.",
  };
}
