export type CertificationResult = "PASS" | "FAIL" | "PENDING";
export type CertificationRunStatus = "OPEN" | "IN_PROGRESS" | "BLOCKED" | "READY_FOR_FINAL_REVIEW" | "CERTIFIED" | "FAILED";
export type CertificationPhase = "PHASE_1" | "PHASE_2" | "PHASE_2A" | "PHASE_3" | "PHASE_4" | "PHASE_5";

export interface CertificationCheck {
  key: string;
  phase: CertificationPhase;
  label: string;
  manual: true;
  matterContinuity?: boolean;
}

export interface CertificationEvidence {
  step_key: string;
  phase: CertificationPhase;
  result: CertificationResult;
  matter_id: string | null;
  evidence_reference: string | null;
  route: string | null;
  authoritative_source: string | null;
  operator_note: string | null;
  observed_value: Record<string, unknown> | null;
  observed_at: string | null;
  recorded_by: string | null;
  recorded_at: string;
}

export interface CertificationRun {
  id: string;
  production_sha: string;
  environment: "production";
  status: CertificationRunStatus;
  final_decision: "GO" | "NO_GO" | null;
}
