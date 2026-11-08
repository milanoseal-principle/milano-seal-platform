import { CERTIFICATION_PHASES, PRODUCTION_CERTIFICATION_CHECKS } from "./checks";
import { validateMatterContinuity } from "./evidence";
import type { CertificationEvidence, CertificationPhase, CertificationResult } from "./types";

export function buildCertificationReport(evidence: CertificationEvidence[]) {
  const byKey = new Map(evidence.map((item) => [item.step_key, item]));
  const phaseStatus = {} as Record<CertificationPhase, CertificationResult>;
  for (const phase of CERTIFICATION_PHASES) {
    const results = PRODUCTION_CERTIFICATION_CHECKS.filter((check) => check.phase === phase).map((check) => byKey.get(check.key)?.result ?? "PENDING");
    phaseStatus[phase] = results.includes("FAIL") ? "FAIL" : results.every((result) => result === "PASS") ? "PASS" : "PENDING";
  }
  const continuity = validateMatterContinuity(evidence);
  const completeReferences=PRODUCTION_CERTIFICATION_CHECKS.every(check=>{const item=byKey.get(check.key);return Boolean(item?.evidence_reference?.trim()&&item.authoritative_source?.trim()&&item.recorded_by&&item.observed_at&&!Number.isNaN(Date.parse(item.observed_at)));});
  const eligibleForGo = continuity.valid && completeReferences && PRODUCTION_CERTIFICATION_CHECKS.every((check) => byKey.get(check.key)?.result === "PASS");
  return { phaseStatus, continuity, eligibleForGo, finalDecision: eligibleForGo ? "READY_FOR_HUMAN_GO" as const : evidence.some((item) => item.result === "FAIL") ? "NO_GO" as const : "NOT_ELIGIBLE" as const };
}
