// Unified Matter execution intelligence: ONE internal projection composing the
// existing execution-brain evaluators (document preflight, execution truth,
// RON provider capability, destination/route intelligence, state authority
// provenance, receiving-authority posture, authority packet, processing
// advisory, authority logistics, active exceptions).
//
// Not another Matter, not a state machine, not a writer. Every section is
// derived from canonical facts; unknown facts stay unknown. The execution
// brief is deterministic text built from these facts only — it never invents
// requirements, fees, addresses, instruments or acceptance.

import type { QuoteRouteIntelligence } from "@/lib/pricing/destinationDocumentQuoteIntelligence";
import type { AuthorityPacketProjection } from "./authorityPacket";
import type { ShipmentLegRow } from "./authorityLogistics";
import type { ProcessingAdvisory } from "./processingAdvisory";
import type { RonAuthorityPosture } from "./ronProviderCapabilities";
import type { StateAuthorityEvaluation } from "./stateAuthorityProvenance";
import type { DocumentPreflightPosture, RonProviderCapabilityResult } from "./types";

export type ExecutionIntelligenceStatus = "READY" | "REVIEW_REQUIRED" | "BLOCKED";
export type SectionStatus = ExecutionIntelligenceStatus | "NOT_APPLICABLE";

export interface IntelligenceSection {
  status: SectionStatus;
  summary: string;
  reasons: string[];
}

export const CLIENT_ACCEPTANCE_NOTICE = "Final acceptance remains subject to the receiving authority." as const;

export interface MatterExecutionIntelligenceInput {
  matterId: string;
  documentType: string | null;
  destinationCountry: string | null;
  originState: string | null;
  executionTruth: Record<string, unknown>;
  documentPreflight: DocumentPreflightPosture;
  ronCapability: RonProviderCapabilityResult | null;
  ronPosture: RonAuthorityPosture;
  route: QuoteRouteIntelligence;
  authorityName: string | null;
  authorityEvaluation: StateAuthorityEvaluation | null;
  packet: AuthorityPacketProjection | null;
  advisory: ProcessingAdvisory | null;
  legs: readonly ShipmentLegRow[];
  activeExceptions: readonly string[];
  now?: Date;
}

export interface MatterExecutionIntelligence {
  matterId: string;
  documentPreflight: IntelligenceSection;
  executionTruth: IntelligenceSection;
  ronReadiness: IntelligenceSection;
  providerCapabilities: IntelligenceSection;
  destinationIntelligence: IntelligenceSection;
  documentClassification: IntelligenceSection;
  authorityRoute: IntelligenceSection;
  authorityEvidence: IntelligenceSection;
  receivingAuthority: IntelligenceSection;
  authorityPacket: IntelligenceSection;
  processingAdvisory: IntelligenceSection;
  authorityLogistics: IntelligenceSection;
  activeExceptions: IntelligenceSection;
  status: ExecutionIntelligenceStatus;
  blockers: string[];
  warnings: string[];
  recommendedOperatorActions: string[];
  clientSafeSummary: { headline: string; stages: Array<{ label: string; state: string }>; notice: typeof CLIENT_ACCEPTANCE_NOTICE };
  generatedAt: string;
}

const section = (status: SectionStatus, summary: string, reasons: string[] = []): IntelligenceSection => ({ status, summary, reasons });
const human = (value: string | null | undefined) => (value ? value.replaceAll("_", " ").toLowerCase() : "unknown");
const RESOLVED_ACTS = new Set(["acknowledgment", "jurat", "oath_affirmation", "signature_witnessing", "other"]);

type SectionKey = Exclude<keyof MatterExecutionIntelligence, "matterId" | "status" | "blockers" | "warnings" | "recommendedOperatorActions" | "clientSafeSummary" | "generatedAt">;

/** Deterministic next operator action per section (first unresolved wins in order). */
const ACTIONS: Record<SectionKey, string> = {
  activeExceptions: "Resolve the blocking Matter exception.",
  documentPreflight: "Resolve execution document structural preflight.",
  executionTruth: "Confirm execution method and notarial act.",
  receivingAuthority: "Confirm receiving-authority execution posture.",
  ronReadiness: "Resolve RON provider readiness items.",
  providerCapabilities: "Confirm a supported provider identity method.",
  destinationIntelligence: "Confirm the destination against the governed country registry.",
  documentClassification: "Confirm the document origin category.",
  authorityRoute: "Resolve the authentication route review items.",
  authorityEvidence: "Verify state authority provenance against the official source.",
  authorityPacket: "Evaluate and complete the authority packet.",
  processingAdvisory: "Record a current, source-backed processing observation.",
  authorityLogistics: "Resolve authority logistics (shipment legs / return label).",
};
const ORDER: SectionKey[] = [
  "activeExceptions",
  "documentPreflight",
  "executionTruth",
  "receivingAuthority",
  "ronReadiness",
  "providerCapabilities",
  "destinationIntelligence",
  "documentClassification",
  "authorityRoute",
  "authorityEvidence",
  "authorityPacket",
  "processingAdvisory",
  "authorityLogistics",
];

export function composeMatterExecutionIntelligence(input: MatterExecutionIntelligenceInput): MatterExecutionIntelligence {
  const truth = input.executionTruth ?? {};
  const executionMethod = typeof truth.execution_method === "string" ? truth.execution_method : null;
  const notarialAct = typeof truth.notarial_act === "string" ? truth.notarial_act : null;
  const isRon = executionMethod === "ron";

  const documentPreflight =
    input.documentPreflight === "READY"
      ? section("READY", "Execution documents passed structural preflight.")
      : input.documentPreflight === "BLOCKED"
        ? section("BLOCKED", "An execution document failed structural preflight.", ["Document preflight blocked."])
        : section("REVIEW_REQUIRED", `Document preflight: ${human(input.documentPreflight)}.`, ["Document preflight has not passed."]);

  const executionReasons: string[] = [];
  if (!executionMethod || executionMethod === "review_required") executionReasons.push("Execution method is unresolved.");
  if (truth.notarization_requirement !== "not_required" && (!notarialAct || !RESOLVED_ACTS.has(notarialAct))) {
    executionReasons.push("Notarial act is unresolved; it is never inferred.");
  }
  const executionTruth = executionReasons.length
    ? section("REVIEW_REQUIRED", `Execution method: ${human(executionMethod)}; notarial act: ${human(notarialAct)}.`, executionReasons)
    : section("READY", `Execution method: ${human(executionMethod)}; notarial act: ${human(notarialAct ?? "not required")}.`);

  const capability = input.ronCapability;
  const ronReadiness = !isRon
    ? section("NOT_APPLICABLE", "Not a remote online execution.")
    : !capability
      ? section("REVIEW_REQUIRED", "RON readiness has not been evaluated.", ["RON readiness unavailable."])
      : section(
          capability.status === "RON_READY" ? "READY" : capability.status === "RON_BLOCKED" ? "BLOCKED" : "REVIEW_REQUIRED",
          `RON: ${human(capability.status.replace("RON_", ""))}.`,
          [...capability.blockers, ...capability.reviewReasons],
        );
  const providerCapabilities = !isRon || !capability
    ? section("NOT_APPLICABLE", "No provider capability evaluation required.")
    : section(
        capability.providerEligibilityStatus === "ELIGIBLE" ? "READY" : capability.providerEligibilityStatus === "INELIGIBLE" ? "BLOCKED" : "REVIEW_REQUIRED",
        `${capability.provider}: ${capability.availableIdentityMethods.map(human).join(", ") || "no configured methods"}; selected ${human(capability.selectedIdentityMethod)}.`,
        capability.providerEligibilityStatus === "ELIGIBLE" ? [] : [`Provider eligibility: ${human(capability.providerEligibilityStatus)}.`],
      );

  const route = input.route;
  const destinationCodes = route.reviewCodes.filter((code) => code.startsWith("ROUTE_DESTINATION"));
  const destinationIntelligence = destinationCodes.length
    ? section("REVIEW_REQUIRED", `Destination: ${route.destination || "unresolved"}.`, route.reviewReasons.filter((_, i) => route.reviewCodes[i]?.startsWith("ROUTE_DESTINATION")))
    : section("READY", `Destination: ${route.destination}.`);
  const documentClassification =
    route.documentCategorySource === "operator"
      ? section("READY", `Document origin: ${human(route.documentCategory)} (operator-confirmed).`)
      : section("REVIEW_REQUIRED", `Document origin: ${human(route.documentCategory)} (heuristic).`, ["Document origin category is not operator-confirmed."]);
  const routeReasons = route.reviewReasons.filter((_, i) => !route.reviewCodes[i]?.startsWith("ROUTE_DESTINATION"));
  const authorityRoute = route.reviewRequired && routeReasons.length
    ? section("REVIEW_REQUIRED", route.routeLabel, routeReasons)
    : section("READY", route.routeLabel);

  const evaluation = input.authorityEvaluation;
  const authorityEvidence = !evaluation
    ? section("REVIEW_REQUIRED", "No state authority is resolved for this Matter.", ["State authority unresolved."])
    : section(evaluation.status === "VERIFIED" ? "READY" : "REVIEW_REQUIRED", `${input.authorityName ?? "State authority"}: ${human(evaluation.status)}.`, evaluation.reasons);

  const posture = input.ronPosture;
  const receivingReasons: string[] = [];
  let receivingStatus: SectionStatus = "READY";
  if (!posture.receivingAuthority) receivingReasons.push("Receiving authority is not recorded.");
  if (posture.receivingAuthorityRonAcceptance === "unknown") receivingReasons.push("Receiving-authority acceptance has not been confirmed.");
  if (receivingReasons.length) receivingStatus = "REVIEW_REQUIRED";
  if (isRon && (posture.receivingAuthorityRonAcceptance === "not_accepted" || posture.wetInkRequirement === "required" || posture.originalRequirement === "required")) {
    receivingStatus = "BLOCKED";
    receivingReasons.push("The receiving-authority posture is incompatible with remote execution.");
  }
  const receivingAuthority = section(
    receivingStatus,
    `${posture.receivingAuthority ?? "Receiving authority unknown"}; RON acceptance ${human(posture.receivingAuthorityRonAcceptance)}; wet-ink ${human(posture.wetInkRequirement)}.`,
    receivingReasons,
  );

  const packet = input.packet;
  const packetStarted = Boolean(packet?.routeType || packet?.createdAt);
  const authorityPacket = !packet || !packetStarted
    ? section("NOT_APPLICABLE", "Authority packet has not been started.")
    : section(
        packet.packetStatus === "NOT_READY" ? "BLOCKED" : packet.packetStatus === "REVIEW_REQUIRED" ? "REVIEW_REQUIRED" : "READY",
        `Authority packet: ${human(packet.packetStatus)}.`,
        [...packet.blockers, ...packet.reviewReasons],
      );

  const advisory = input.advisory;
  const processingAdvisory = !packetStarted || !advisory
    ? section("NOT_APPLICABLE", "No authority processing advisory required yet.")
    : section(
        advisory.status === "CURRENT" && !advisory.reviewRequired ? "READY" : "REVIEW_REQUIRED",
        advisory.estimatedDays === null ? `Advisory: ${human(advisory.status)}.` : `Advisory: about ${advisory.estimatedDays} days (${human(advisory.status)}). ${advisory.notice}`,
        advisory.reasons,
      );

  const legs = input.legs;
  const logisticsReasons: string[] = [];
  let logisticsStatus: SectionStatus = legs.length ? "READY" : "NOT_APPLICABLE";
  if (legs.some((leg) => leg.custody_status === "exception")) {
    logisticsStatus = "REVIEW_REQUIRED";
    logisticsReasons.push("A shipment leg is in custody exception.");
  }
  const returnNeeded = packet?.returnShippingRequired === true && (packet.packetStatus === "READY_FOR_DISPATCH" || packet.packetStatus === "DISPATCHED");
  if (returnNeeded && !legs.some((leg) => leg.leg_type === "return_from_authority" && leg.custody_status !== "exception")) {
    logisticsStatus = "REVIEW_REQUIRED";
    logisticsReasons.push("Return label required: no return leg has been created.");
  }
  const anticipated = packet?.returnShippingRequired === true ? "Outbound and return legs anticipated." : packet?.outboundShippingRequired ? "Outbound leg anticipated." : null;
  const authorityLogistics = section(
    logisticsStatus === "NOT_APPLICABLE" && anticipated ? "NOT_APPLICABLE" : logisticsStatus,
    legs.length
      ? legs.map((leg) => `${leg.sequence}. ${human(leg.leg_type)} — ${human(leg.custody_status)}`).join("; ")
      : anticipated ?? "No shipment legs.",
    logisticsReasons,
  );

  const activeExceptions = input.activeExceptions.length
    ? section("BLOCKED", `${input.activeExceptions.length} active exception(s).`, [...input.activeExceptions])
    : section("READY", "No active exceptions.");

  const sections: Record<SectionKey, IntelligenceSection> = {
    documentPreflight,
    executionTruth,
    ronReadiness,
    providerCapabilities,
    destinationIntelligence,
    documentClassification,
    authorityRoute,
    authorityEvidence,
    receivingAuthority,
    authorityPacket,
    processingAdvisory,
    authorityLogistics,
    activeExceptions,
  };

  const blockers = ORDER.filter((key) => sections[key].status === "BLOCKED").flatMap((key) => sections[key].reasons.map((reason) => `${key}: ${reason}`));
  const warnings = ORDER.filter((key) => sections[key].status === "REVIEW_REQUIRED").flatMap((key) => sections[key].reasons.map((reason) => `${key}: ${reason}`));
  const status: ExecutionIntelligenceStatus = ORDER.some((key) => sections[key].status === "BLOCKED")
    ? "BLOCKED"
    : ORDER.some((key) => sections[key].status === "REVIEW_REQUIRED")
      ? "REVIEW_REQUIRED"
      : "READY";
  const recommendedOperatorActions = [
    ...ORDER.filter((key) => sections[key].status === "BLOCKED").map((key) => ACTIONS[key]),
    ...ORDER.filter((key) => sections[key].status === "REVIEW_REQUIRED").map((key) => ACTIONS[key]),
  ];

  return {
    matterId: input.matterId,
    ...sections,
    status,
    blockers,
    warnings,
    recommendedOperatorActions,
    clientSafeSummary: clientSafeSummary(status, sections),
    generatedAt: (input.now ?? new Date()).toISOString(),
  };
}

/**
 * Client-safe summary: stage labels only. No internal notes, reasons,
 * authority evidence, hashes, fees, provider data, legal advice or guarantee.
 */
function clientSafeSummary(status: ExecutionIntelligenceStatus, sections: Record<SectionKey, IntelligenceSection>) {
  const stage = (s: SectionStatus) => (s === "READY" ? "Complete" : s === "NOT_APPLICABLE" ? "Not yet started" : "In review");
  return {
    headline:
      status === "READY"
        ? "Your matter's execution requirements are in order."
        : "Your matter is being prepared. Our team is reviewing the remaining steps.",
    stages: [
      { label: "Document review", state: stage(sections.documentPreflight.status) },
      { label: "Execution", state: stage(sections.executionTruth.status) },
      { label: "Authentication preparation", state: stage(sections.authorityPacket.status) },
      { label: "Shipping", state: stage(sections.authorityLogistics.status) },
    ],
    notice: CLIENT_ACCEPTANCE_NOTICE,
  };
}

/**
 * MATTER EXECUTION BRIEF — deterministic text generated only from the
 * projection. Unknown facts are printed as unknown; nothing is inferred.
 */
export function buildMatterExecutionBrief(
  intelligence: MatterExecutionIntelligence,
  facts: { documentType: string | null; originState: string | null; destinationCountry: string | null; documentOrigin: string | null },
): string {
  const statusLabel = (s: SectionStatus) =>
    s === "READY" ? "Ready" : s === "BLOCKED" ? "Blocked" : s === "NOT_APPLICABLE" ? "Not applicable" : "Operator review required";
  const firstReason = (s: IntelligenceSection) => s.reasons[0] ?? null;
  const lines = [
    "MATTER EXECUTION BRIEF",
    "",
    `Document: ${facts.documentType ?? "Unknown"}`,
    `Origin: ${[facts.originState, facts.documentOrigin ? human(facts.documentOrigin) : null].filter(Boolean).join(" ") || "Unknown"}`,
    `Destination: ${facts.destinationCountry ?? "Unknown"}`,
    `Document Preflight: ${statusLabel(intelligence.documentPreflight.status)}`,
    `RON: ${statusLabel(intelligence.ronReadiness.status)}`,
  ];
  const ronReason = firstReason(intelligence.ronReadiness) ?? firstReason(intelligence.receivingAuthority);
  if (intelligence.ronReadiness.status !== "READY" && intelligence.ronReadiness.status !== "NOT_APPLICABLE" && ronReason) lines.push(`Reason: ${ronReason}`);
  lines.push(
    `Authentication: ${intelligence.authorityRoute.summary}`,
    `Authority Packet: ${intelligence.authorityPacket.status === "NOT_APPLICABLE" ? "Not started" : intelligence.authorityPacket.summary.replace("Authority packet: ", "")}`,
    `Authority Logistics: ${intelligence.authorityLogistics.summary}`,
    `Overall: ${statusLabel(intelligence.status)}`,
    `Next Operator Action: ${intelligence.recommendedOperatorActions[0] ?? "None — all applicable requirements are satisfied."}`,
    "",
    "Generated from canonical Matter facts only. Unknown facts remain unknown.",
    CLIENT_ACCEPTANCE_NOTICE,
  );
  return lines.join("\n");
}
