/**
 * sowBuilder — structured Statement of Work model. Preserves the canonical
 * coordination timelines and the mandatory third-party-timeline disclaimer.
 */

export const COORDINATION_TIMELINES = {
  signature: "24–72 Hours",
  priority: "Same Day–48 Hours",
  executive: "Immediate Project Coordination",
} as const;

export const COORDINATION_TIMELINE_DISCLAIMER =
  "Coordination timelines describe Milano Seal review, preparation, and execution activity. Government agencies, apostille authorities, embassies, consulates, couriers, receiving institutions, and other third parties control their own processing timelines.";

export interface StatementOfWork {
  objective: string;
  scope: string[];
  services: string[];
  exclusions: string[];
  deliverables: string[];
  workflow: string[];
  responsibilities: string[];
  responseTimes: string[];
  coordinationTimelines: typeof COORDINATION_TIMELINES;
  thirdPartyDependencies: string[];
  qaControls: string[];
  reporting: string[];
  security: string[];
  recordsHandling: string[];
  pricingBasis: string | null;
  acceptanceCriteria: string[];
  term: string | null;
  renewal: string | null;
  assumptions: string[];
  limitations: string[];
  disclaimer: string;
}

export interface SowInput {
  objective: string;
  scope?: string[];
  services?: string[];
  exclusions?: string[];
  deliverables?: string[];
  pricingBasis?: string | null;
  term?: string | null;
  renewal?: string | null;
  assumptions?: string[];
  limitations?: string[];
}

export function buildStatementOfWork(input: SowInput): StatementOfWork {
  return {
    objective: input.objective,
    scope: input.scope ?? [],
    services: input.services ?? [],
    exclusions: input.exclusions ?? [],
    deliverables: input.deliverables ?? [],
    workflow: [
      "Intake & qualification",
      "Administrative compliance review",
      "Execution-pathway determination",
      "Quote & payment confirmation",
      "Execution",
      "Quality assurance",
      "Authentication / apostille coordination where applicable",
      "Courier & controlled handoff",
      "Release & completion record",
    ],
    responsibilities: [
      "Milano Seal: coordination, administrative support, execution management, quality review",
      "Client / agency: authorized instructions, required documents, facility access where applicable",
    ],
    responseTimes: [
      `Signature Execution: ${COORDINATION_TIMELINES.signature}`,
      `Priority Execution: ${COORDINATION_TIMELINES.priority}`,
      `Executive Execution: ${COORDINATION_TIMELINES.executive}`,
    ],
    coordinationTimelines: COORDINATION_TIMELINES,
    thirdPartyDependencies: [
      "Apostille / authentication authorities",
      "Embassies / consulates",
      "Couriers",
      "Receiving institutions",
    ],
    qaControls: [
      "Document completeness and required signature fields",
      "Correct notarial certificate for execution method and receiving authority",
      "Witness and identity-verification requirements",
      "Apostille eligibility / non-Hague legalization pathway",
      "Courier readiness and delivery routing",
    ],
    reporting: ["Status updates through controlled matter workflow"],
    security: ["Controlled handling; access limited to authorized parties"],
    recordsHandling: ["Chain-of-custody visibility from intake through release"],
    pricingBasis: input.pricingBasis ?? null,
    acceptanceCriteria: ["Deliverables executed and released per scope and applicable requirements"],
    term: input.term ?? null,
    renewal: input.renewal ?? null,
    assumptions: input.assumptions ?? [],
    limitations: input.limitations ?? [
      "Coordination and administrative support only — no legal, medical, or immigration advice.",
      "No outcome guaranteed by Milano Seal or any receiving authority.",
    ],
    disclaimer: COORDINATION_TIMELINE_DISCLAIMER,
  };
}
