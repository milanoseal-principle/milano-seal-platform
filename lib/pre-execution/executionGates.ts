/**
 * Pre-Execution Intelligence — non-bypassable execution gates.
 *
 * Deterministic gate ladder that BLOCKS matter progression until each required
 * gate passes. No role may bypass a gate. This reuses the canonical
 * scheduling/payment and QA-before-release doctrine; it does not modify the
 * protected payment/release systems — it reads their normalized outcomes.
 *
 * Milano Seal only. No provider/medical/Liaison-OS concepts.
 */

export type ExecutionGateId =
  | "payment"
  | "identity"
  | "document_integrity"
  | "compliance_decision"
  | "ron_readiness"
  | "operator_review"
  | "seal_validation"
  | "post_execution_qc"
  | "apostille_readiness";

export type GateStatus = "not_started" | "in_progress" | "blocked" | "passed" | "not_required";

/** Canonical ordered ladder — a gate cannot pass until all prior required gates pass. */
export const EXECUTION_GATE_ORDER: ExecutionGateId[] = [
  "payment",
  "identity",
  "document_integrity",
  "compliance_decision",
  "ron_readiness",
  "operator_review",
  "seal_validation",
  "post_execution_qc",
  "apostille_readiness",
];

export const GATE_LABEL: Record<ExecutionGateId, string> = {
  payment: "Payment / Scheduling Authority",
  identity: "Identity Verification",
  document_integrity: "Document Integrity",
  compliance_decision: "Compliance Decision",
  ron_readiness: "RON Readiness",
  operator_review: "Operator Review",
  seal_validation: "Seal Validation",
  post_execution_qc: "Post-Execution QC",
  apostille_readiness: "Apostille Readiness",
};

export interface GateInput {
  /** Normalized statuses read from canonical systems (unknown => not_started). */
  statuses?: Partial<Record<ExecutionGateId, GateStatus>>;
  /** Gates that do not apply to this matter (e.g. no apostille needed). */
  notRequired?: ExecutionGateId[];
}

export interface GateEvaluation {
  gate: ExecutionGateId;
  label: string;
  status: GateStatus;
  blockedByPriorGate: boolean;
}

export interface ExecutionReadiness {
  gates: GateEvaluation[];
  firstBlockingGate: ExecutionGateId | null;
  mayProceed: boolean;
  nextRequiredGate: ExecutionGateId | null;
}

/** No role — founder, operator, alliance, VA — may bypass a gate. Always false. */
export function canBypassGate(): false {
  return false;
}

/**
 * Evaluate the gate ladder. A gate is blocked when any prior REQUIRED gate has
 * not passed. Progression may proceed only when every required gate has passed.
 */
export function evaluateExecutionReadiness(input: GateInput = {}): ExecutionReadiness {
  const notRequired = new Set(input.notRequired ?? []);
  const statuses = input.statuses ?? {};

  const gates: GateEvaluation[] = [];
  let priorRequiredPassed = true;
  let firstBlockingGate: ExecutionGateId | null = null;

  for (const gate of EXECUTION_GATE_ORDER) {
    if (notRequired.has(gate)) {
      gates.push({ gate, label: GATE_LABEL[gate], status: "not_required", blockedByPriorGate: false });
      continue;
    }
    const raw = statuses[gate] ?? "not_started";
    const blockedByPriorGate = !priorRequiredPassed;
    // A gate cannot be "passed" if a prior required gate has not passed.
    const status: GateStatus = blockedByPriorGate && raw === "passed" ? "blocked" : raw;
    gates.push({ gate, label: GATE_LABEL[gate], status, blockedByPriorGate });

    if (status !== "passed") {
      if (firstBlockingGate === null) firstBlockingGate = gate;
      priorRequiredPassed = false;
    }
  }

  const mayProceed = firstBlockingGate === null;
  return {
    gates,
    firstBlockingGate,
    mayProceed,
    nextRequiredGate: firstBlockingGate,
  };
}
