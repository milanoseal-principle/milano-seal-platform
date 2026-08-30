import { PRODUCTION_CERTIFICATION_CHECKS } from "./checks";
import { validateMatterContinuity } from "./evidence";
import type { CertificationEvidence, CertificationPhase, CertificationResult } from "./types";

export function buildCertificationReport(evidence: CertificationEvidence[]) {
  const byKey = new Map(evidence.map((item) => [item.step_key, item]));
  const phaseStatus = {} as Record<CertificationPhase, CertificationResult>;
  for (const phase of ["PHASE_1", "PHASE_2", "PHASE_2A", "PHASE_3", "PHASE_4", "PHASE_5"] as CertificationPhase[]) {
    const results = PRODUCTION_CERTIFICATION_CHECKS.filter((check) => check.phase === phase).map((check) => byKey.get(check.key)?.result ?? "PENDING");
    phaseStatus[phase] = results.includes("FAIL") ? "FAIL" : results.every((result) => result === "PASS") ? "PASS" : "PENDING";
  }
  const continuity = validateMatterContinuity(evidence);
  const eligibleForGo = continuity.valid && PRODUCTION_CERTIFICATION_CHECKS.every((check) => byKey.get(check.key)?.result === "PASS");
  return { phaseStatus, continuity, eligibleForGo, finalDecision: eligibleForGo ? "GO" as const : evidence.some((item) => item.result === "FAIL") ? "NO_GO" as const : "NOT_ELIGIBLE" as const };
}
