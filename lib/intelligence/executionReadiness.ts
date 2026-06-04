export type ReadinessVerdict = "READY" | "BLOCKED" | "REVIEW_REQUIRED" | "MISSING_INFO" | "ESCALATE_TO_NICHOLAS";

export interface ReadinessCheck {
  id: string;
  label: string;
  passed: boolean;
  reason?: string;
}

export interface ReadinessResult {
  verdict: ReadinessVerdict;
  checks: ReadinessCheck[];
  blockers: string[];
}

export function evaluateExecutionReadiness(matter: Record<string, unknown>): ReadinessResult {
  const checks: ReadinessCheck[] = [
    { id: "payment", label: "Payment confirmed", passed: matter.payment_status === "paid", reason: matter.payment_status !== "paid" ? "Payment not confirmed" : undefined },
    { id: "signer_info", label: "Signer info complete", passed: !!(matter.client_name && matter.client_email), reason: (!matter.client_name || !matter.client_email) ? "Missing signer name or email" : undefined },
    { id: "document_uploaded", label: "Document uploaded", passed: !!matter.document_count && (matter.document_count as number) > 0, reason: !matter.document_count ? "No documents uploaded" : undefined },
    { id: "destination", label: "Destination country set", passed: !!matter.destination_country, reason: !matter.destination_country ? "No destination country" : undefined },
    { id: "receiving_authority", label: "Receiving authority known", passed: !!matter.receiving_authority, reason: !matter.receiving_authority ? "Receiving authority not set" : undefined },
    { id: "ron_eligibility", label: "RON eligibility confirmed", passed: matter.signing_type !== "ron" || matter.ron_eligible === true, reason: matter.signing_type === "ron" && !matter.ron_eligible ? "RON eligibility not confirmed" : undefined },
    { id: "apostille_route", label: "Apostille route set", passed: matter.apostille_required !== true || !!matter.apostille_route, reason: matter.apostille_required && !matter.apostille_route ? "Apostille route not set" : undefined },
  ];
  const blockers = checks.filter(c => !c.passed).map(c => c.reason!).filter(Boolean);
  let verdict: ReadinessVerdict = "READY";
  if (blockers.length > 3) verdict = "ESCALATE_TO_NICHOLAS";
  else if (checks.find(c => c.id === "payment" && !c.passed)) verdict = "BLOCKED";
  else if (blockers.length > 0) verdict = "MISSING_INFO";
  else if (matter.trust_review_required) verdict = "REVIEW_REQUIRED";
  return { verdict, checks, blockers };
}
