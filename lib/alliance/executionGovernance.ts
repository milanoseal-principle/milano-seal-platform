export type CapabilityState = "VERIFIED" | "UNVERIFIED" | "EXPIRED" | "UNAVAILABLE" | "REVIEW_REQUIRED";

export interface AllianceExecutionCapability {
  partnerId: string;
  jurisdictionsServed: string[];
  ronCapability: CapabilityState;
  mobileCapability: CapabilityState;
  inPersonCapability: CapabilityState;
  witnessCapability: CapabilityState;
  languages: string[];
  translationCapability: CapabilityState;
  apostilleHandling: CapabilityState;
  authenticationHandling: CapabilityState;
  courierCapability: CapabilityState;
  documentSpecialties: string[];
  turnaroundClass?: string;
  capacityState: CapabilityState;
  complianceState: CapabilityState;
  certificationState: CapabilityState;
  insuranceEvidence?: string;
  lastVerifiedAt?: string;
  verifiedBy?: string;
  staleAfter?: string;
  notes?: string;
}

export interface DispatchCandidate {
  partnerId: string;
  capability: AllianceExecutionCapability;
  geographyMatch: boolean;
  languageMatch: boolean;
  witnessMatch: boolean;
  conflictClear: boolean;
  available: boolean;
}

export interface DispatchRequest {
  matterId: string;
  jurisdiction: string;
  executionMethod: "ron" | "mobile" | "in_person" | "already_notarized_review";
  requiredCapabilities: Array<"ron" | "mobile" | "in_person" | "witness" | "translation" | "apostille" | "authentication" | "courier">;
  language?: string;
  witnessNeeded?: boolean;
  candidates: DispatchCandidate[];
  decisionBy: string;
  decisionAt?: string;
}

export interface DispatchDecision {
  eligible: boolean;
  selectedPartnerId?: string;
  decisionReasons: string[];
  rejectedCandidates: Array<{ partnerId: string; reasonCodes: string[] }>;
  decisionAt: string;
  decisionBy: string;
  evidenceSnapshot: Record<string, unknown>;
}

function capabilitySatisfied(capability: AllianceExecutionCapability, required: DispatchRequest["requiredCapabilities"][number]) {
  const map = {
    ron: capability.ronCapability,
    mobile: capability.mobileCapability,
    in_person: capability.inPersonCapability,
    witness: capability.witnessCapability,
    translation: capability.translationCapability,
    apostille: capability.apostilleHandling,
    authentication: capability.authenticationHandling,
    courier: capability.courierCapability,
  } as const;
  return map[required] === "VERIFIED";
}

export function deriveDispatchDecision(request: DispatchRequest): DispatchDecision {
  const rejectedCandidates: DispatchDecision["rejectedCandidates"] = [];
  const eligible = request.candidates.filter((candidate) => {
    const reasons: string[] = [];
    if (!candidate.geographyMatch) reasons.push("GEOGRAPHY_MISMATCH");
    if (!candidate.available || candidate.capability.capacityState !== "VERIFIED") reasons.push("CAPACITY_UNAVAILABLE");
    if (candidate.capability.complianceState !== "VERIFIED") reasons.push("COMPLIANCE_NOT_CURRENT");
    if (candidate.capability.certificationState !== "VERIFIED") reasons.push("CERTIFICATION_NOT_CURRENT");
    if (!candidate.conflictClear) reasons.push("CONFLICT_NOT_CLEAR");
    if (request.language && !candidate.languageMatch) reasons.push("LANGUAGE_MISMATCH");
    if (request.witnessNeeded && !candidate.witnessMatch) reasons.push("WITNESS_CAPABILITY_MISMATCH");
    for (const required of request.requiredCapabilities) if (!capabilitySatisfied(candidate.capability, required)) reasons.push(`CAPABILITY_${required.toUpperCase()}_NOT_VERIFIED`);
    if (reasons.length) rejectedCandidates.push({ partnerId: candidate.partnerId, reasonCodes: [...new Set(reasons)] });
    return reasons.length === 0;
  });

  const selected = eligible[0];
  return {
    eligible: Boolean(selected),
    selectedPartnerId: selected?.partnerId,
    decisionReasons: selected ? ["All required geography, capacity, compliance, certification, conflict and capability gates are current."] : ["No candidate satisfies every governed dispatch gate."],
    rejectedCandidates,
    decisionAt: request.decisionAt ?? new Date().toISOString(),
    decisionBy: request.decisionBy,
    evidenceSnapshot: {
      matterId: request.matterId,
      jurisdiction: request.jurisdiction,
      executionMethod: request.executionMethod,
      requiredCapabilities: request.requiredCapabilities,
      candidateCount: request.candidates.length,
    },
  };
}

export type AssignmentState = "ASSIGNED" | "ACCEPTED" | "DECLINED" | "UNAVAILABLE" | "NO_RESPONSE" | "COMPLIANCE_BLOCKED" | "PROOF_FAILED" | "REASSIGNMENT_REQUIRED" | "REASSIGNED" | "ESCALATED" | "COMPLETED";

export interface AllianceAssignmentState {
  matterId: string;
  partnerId: string;
  state: AssignmentState;
  failureReason?: string;
  failureAt?: string;
  operatorOwner: string;
  responseDeadline?: string;
  evidence: string[];
  priorPartner?: string;
  newPartner?: string;
  reassignmentRationale?: string[];
  escalationStatus?: string;
}

const TRANSITIONS: Record<AssignmentState, readonly AssignmentState[]> = {
  ASSIGNED: ["ACCEPTED", "DECLINED", "UNAVAILABLE", "NO_RESPONSE", "COMPLIANCE_BLOCKED", "ESCALATED"],
  ACCEPTED: ["PROOF_FAILED", "COMPLETED", "COMPLIANCE_BLOCKED", "ESCALATED"],
  DECLINED: ["REASSIGNMENT_REQUIRED", "ESCALATED"],
  UNAVAILABLE: ["REASSIGNMENT_REQUIRED", "ESCALATED"],
  NO_RESPONSE: ["REASSIGNMENT_REQUIRED", "ESCALATED"],
  COMPLIANCE_BLOCKED: ["REASSIGNMENT_REQUIRED", "ESCALATED"],
  PROOF_FAILED: ["REASSIGNMENT_REQUIRED", "ESCALATED"],
  REASSIGNMENT_REQUIRED: ["REASSIGNED", "ESCALATED"],
  REASSIGNED: ["ACCEPTED", "DECLINED", "UNAVAILABLE", "NO_RESPONSE", "COMPLIANCE_BLOCKED", "ESCALATED"],
  ESCALATED: ["REASSIGNMENT_REQUIRED", "COMPLETED"],
  COMPLETED: [],
};

export function transitionAssignment(current: AllianceAssignmentState, next: AssignmentState, patch: Partial<AllianceAssignmentState> = {}): AllianceAssignmentState {
  if (!TRANSITIONS[current.state].includes(next)) throw new Error(`Invalid Alliance assignment transition ${current.state} -> ${next}`);
  if (next === "REASSIGNED" && (!patch.newPartner || !patch.reassignmentRationale?.length)) throw new Error("Reassignment requires newPartner and governed reassignment rationale.");
  if (["DECLINED", "UNAVAILABLE", "NO_RESPONSE", "COMPLIANCE_BLOCKED", "PROOF_FAILED"].includes(next) && !patch.failureReason) throw new Error(`${next} requires failureReason.`);
  return { ...current, ...patch, state: next, failureAt: patch.failureAt ?? current.failureAt ?? (next === "COMPLETED" ? undefined : new Date().toISOString()) };
}
