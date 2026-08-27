export const EXPANSION_MODULES = [
  "execution_reconciliation",
  "truth_failure_alerts",
  "operator_knowledge_graph",
  "client_return_engine",
  "trust_engine_2",
  "alliance_intelligence",
] as const;

export type ExpansionModule = (typeof EXPANSION_MODULES)[number];
export type EvidenceStatus = "verified" | "observed" | "unknown" | "blocked";
export type Severity = "critical" | "high" | "normal";

export interface CanonicalMatterEvidence {
  matterId: string;
  clientId?: string | null;
  clientName?: string | null;
  destinationCountry?: string | null;
  documentType?: string | null;
  state?: string | null;
  paymentStatus?: string | null;
  wiseReference?: string | null;
  executionVerified?: boolean | null;
  authorityVerified?: boolean | null;
  apostilleStatus?: string | null;
  custodyVerified?: boolean | null;
  courierStatus?: string | null;
  deliveredAt?: string | null;
  releaseVerified?: boolean | null;
  completedAt?: string | null;
}

export interface ReconciliationStage {
  key: "quote" | "payment" | "execution" | "authority" | "apostille" | "custody" | "courier" | "delivery" | "release" | "close";
  label: string;
  status: EvidenceStatus;
  reason: string;
}

export interface ReconciliationResult {
  matterId: string;
  stages: ReconciliationStage[];
  discrepancies: string[];
  releaseBlocked: boolean;
}

function present(value: unknown): boolean {
  return value !== null && value !== undefined && value !== "";
}

export function reconcileMatter(evidence: CanonicalMatterEvidence): ReconciliationResult {
  const stages: ReconciliationStage[] = [
    { key: "quote", label: "Matter / Quote", status: present(evidence.matterId) ? "verified" : "blocked", reason: present(evidence.matterId) ? "Canonical Matter identifier present." : "Matter identifier missing." },
    { key: "payment", label: "Wise Payment", status: evidence.paymentStatus === "paid" && present(evidence.wiseReference) ? "verified" : evidence.paymentStatus === "pending" ? "observed" : "blocked", reason: evidence.paymentStatus === "paid" && present(evidence.wiseReference) ? "Paid state is backed by a Wise reference." : "Wise settlement evidence is incomplete." },
    { key: "execution", label: "Execution", status: evidence.executionVerified === true ? "verified" : evidence.executionVerified === false ? "blocked" : "unknown", reason: evidence.executionVerified === true ? "Execution truth verified." : "Execution truth requires verification." },
    { key: "authority", label: "Authority", status: evidence.authorityVerified === true ? "verified" : evidence.authorityVerified === false ? "blocked" : "unknown", reason: evidence.authorityVerified === true ? "Receiving-authority evidence verified." : "Authority provenance is not verified." },
    { key: "apostille", label: "Apostille / Authentication", status: evidence.apostilleStatus === "completed" ? "verified" : present(evidence.apostilleStatus) ? "observed" : "unknown", reason: evidence.apostilleStatus === "completed" ? "Apostille/authentication completion recorded." : "Apostille/authentication completion is not proven." },
    { key: "custody", label: "Custody", status: evidence.custodyVerified === true ? "verified" : evidence.custodyVerified === false ? "blocked" : "unknown", reason: evidence.custodyVerified === true ? "Custody chain verified." : "Custody evidence is incomplete." },
    { key: "courier", label: "Courier", status: ["in_transit", "out_for_delivery", "delivered"].includes(evidence.courierStatus ?? "") ? "observed" : ["exception", "failed", "returned"].includes(evidence.courierStatus ?? "") ? "blocked" : "unknown", reason: present(evidence.courierStatus) ? `Courier state: ${evidence.courierStatus}.` : "Courier evidence not available." },
    { key: "delivery", label: "Delivery", status: present(evidence.deliveredAt) ? "verified" : "unknown", reason: present(evidence.deliveredAt) ? "Delivery timestamp recorded." : "Delivery is not proven." },
    { key: "release", label: "Release", status: evidence.releaseVerified === true ? "verified" : evidence.releaseVerified === false ? "blocked" : "unknown", reason: evidence.releaseVerified === true ? "Governed release verified." : "Release evidence is incomplete." },
    { key: "close", label: "Close", status: present(evidence.completedAt) ? "verified" : "unknown", reason: present(evidence.completedAt) ? "Matter close timestamp recorded." : "Matter is not proven closed." },
  ];

  const discrepancies: string[] = [];
  if (evidence.releaseVerified === true && evidence.paymentStatus !== "paid") discrepancies.push("Release is marked verified without paid settlement truth.");
  if (present(evidence.completedAt) && !present(evidence.deliveredAt)) discrepancies.push("Matter is closed without delivery evidence.");
  if (evidence.courierStatus === "delivered" && !present(evidence.deliveredAt)) discrepancies.push("Carrier says delivered but no delivery timestamp is recorded.");
  if (evidence.paymentStatus === "paid" && !present(evidence.wiseReference)) discrepancies.push("Paid state lacks Wise transaction reference.");
  if (evidence.authorityVerified === false && evidence.releaseVerified === true) discrepancies.push("Release is verified while authority provenance is blocked.");

  const releaseBlocked = discrepancies.length > 0 || stages.some((stage) => ["payment", "execution", "authority", "custody"].includes(stage.key) && stage.status !== "verified");
  return { matterId: evidence.matterId, stages, discrepancies, releaseBlocked };
}

export interface TruthAlert {
  id: string;
  matterId: string;
  severity: Severity;
  category: "payment" | "document" | "authority" | "scheduling" | "apostille" | "courier" | "release" | "follow_up" | "reconciliation";
  message: string;
}

export function buildTruthAlerts(result: ReconciliationResult): TruthAlert[] {
  return result.discrepancies.map((message, index) => ({
    id: `${result.matterId}:reconciliation:${index}`,
    matterId: result.matterId,
    severity: "critical",
    category: "reconciliation",
    message,
  }));
}

export interface RelationshipEdge {
  from: string;
  to: string;
  type: "client_matter" | "matter_country" | "matter_document" | "matter_alliance" | "repeat_client";
  evidence: "canonical" | "explicit";
}

export function buildMatterKnowledgeEdges(evidence: CanonicalMatterEvidence, allianceId?: string | null): RelationshipEdge[] {
  const edges: RelationshipEdge[] = [];
  if (evidence.clientId) edges.push({ from: evidence.clientId, to: evidence.matterId, type: "client_matter", evidence: "canonical" });
  if (evidence.destinationCountry) edges.push({ from: evidence.matterId, to: evidence.destinationCountry, type: "matter_country", evidence: "canonical" });
  if (evidence.documentType) edges.push({ from: evidence.matterId, to: evidence.documentType, type: "matter_document", evidence: "canonical" });
  if (allianceId) edges.push({ from: evidence.matterId, to: allianceId, type: "matter_alliance", evidence: "explicit" });
  return edges;
}

export interface ClientMatterHistory {
  matterId: string;
  destinationCountry?: string | null;
  documentType?: string | null;
  completedAt?: string | null;
}

export interface ClientReturnSignal {
  eligible: boolean;
  reason: string;
  priorMatterCount: number;
  lastCountry: string | null;
  lastDocumentType: string | null;
}

export function deriveClientReturnSignal(history: ClientMatterHistory[]): ClientReturnSignal {
  const completed = history.filter((item) => present(item.completedAt)).sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
  const latest = completed[0];
  return {
    eligible: completed.length > 0,
    reason: completed.length > 0 ? "Prior completed Matter exists; return workflow may be offered without changing pricing or execution truth." : "No completed Matter evidence; no return signal is asserted.",
    priorMatterCount: completed.length,
    lastCountry: latest?.destinationCountry ?? null,
    lastDocumentType: latest?.documentType ?? null,
  };
}

export interface TrustEvidence {
  authorityCurrent: boolean;
  identityVerified: boolean;
  executionCompleted: boolean;
  custodyVerified: boolean;
  deliveryVerified: boolean;
  exceptionsOpen: number;
}

export interface TrustSignal {
  status: "verified" | "review_required" | "insufficient_evidence";
  verifiedSignals: number;
  totalSignals: 5;
  openExceptions: number;
}

export function deriveTrustSignal(evidence: TrustEvidence): TrustSignal {
  const verifiedSignals = [evidence.authorityCurrent, evidence.identityVerified, evidence.executionCompleted, evidence.custodyVerified, evidence.deliveryVerified].filter(Boolean).length;
  if (evidence.exceptionsOpen > 0) return { status: "review_required", verifiedSignals, totalSignals: 5, openExceptions: evidence.exceptionsOpen };
  if (verifiedSignals === 5) return { status: "verified", verifiedSignals, totalSignals: 5, openExceptions: 0 };
  return { status: "insufficient_evidence", verifiedSignals, totalSignals: 5, openExceptions: 0 };
}

export interface AllianceEvidence {
  allianceId: string;
  active: boolean;
  complianceCurrent: boolean;
  capacityConfirmed: boolean;
  completedAssignments: number;
  exceptionCount: number;
}

export interface AllianceIntelligence {
  allianceId: string;
  dispatchEligible: boolean;
  status: "eligible" | "review_required" | "inactive";
  completedAssignments: number;
  exceptionCount: number;
  reason: string;
}

export function deriveAllianceIntelligence(evidence: AllianceEvidence): AllianceIntelligence {
  if (!evidence.active) return { allianceId: evidence.allianceId, dispatchEligible: false, status: "inactive", completedAssignments: evidence.completedAssignments, exceptionCount: evidence.exceptionCount, reason: "Alliance record is inactive." };
  const eligible = evidence.complianceCurrent && evidence.capacityConfirmed && evidence.exceptionCount === 0;
  return {
    allianceId: evidence.allianceId,
    dispatchEligible: eligible,
    status: eligible ? "eligible" : "review_required",
    completedAssignments: evidence.completedAssignments,
    exceptionCount: evidence.exceptionCount,
    reason: eligible ? "Explicit compliance and capacity evidence are current with no open exceptions." : "Dispatch requires current compliance, confirmed capacity, and zero open exceptions.",
  };
}

export const EXPANSION_GOVERNANCE = {
  readOnlyByDefault: true,
  noSecondMatterEngine: true,
  wiseRemainsPaymentAuthority: true,
  noSyntheticTrustScores: true,
  noUnverifiedPartnerRanking: true,
  noAutomaticRelease: true,
  humanCertificationUnaffected: true,
} as const;
