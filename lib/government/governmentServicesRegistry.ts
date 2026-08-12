import type { GovernmentCapability } from "./types";

export interface GovernmentServiceEntry {
  capability: GovernmentCapability;
  publicSummary: string;
  operatorNotes: string;
  paymentGatedScheduling: true;
}

// Real capability descriptions. publicSummary is safe to surface; operatorNotes
// are internal. No guarantees of acceptance, approval, or award anywhere.
export const GOVERNMENT_SERVICES_REGISTRY: GovernmentServiceEntry[] = [
  {
    capability: "remote_online_notarization",
    publicSummary:
      "Eligible remote online notarization for public-sector signers where the document type and jurisdiction permit remote execution.",
    operatorNotes:
      "Confirm signer eligibility, document type, and receiving-authority acceptance of RON before scheduling.",
    paymentGatedScheduling: true,
  },
  {
    capability: "mobile_execution",
    publicSummary:
      "Mobile document execution coordination at agency offices, board rooms, or approved locations when in-person execution is required.",
    operatorNotes: "Coordinate location, access, and identity documents ahead of the visit.",
    paymentGatedScheduling: true,
  },
  {
    capability: "document_authentication_coordination",
    publicSummary:
      "Coordination of document authentication steps required before a document is accepted by a receiving authority.",
    operatorNotes: "Authentication path varies by destination and document type; verify each matter.",
    paymentGatedScheduling: true,
  },
  {
    capability: "apostille_coordination",
    publicSummary:
      "Apostille coordination through the appropriate Secretary of State channel when a document is destined for a Hague-convention country.",
    operatorNotes: "Apostille eligibility depends on document type and destination; never guarantee acceptance.",
    paymentGatedScheduling: true,
  },
  {
    capability: "identity_verification",
    publicSummary:
      "Structured identity coordination for signers as part of the execution workflow.",
    operatorNotes: "Follow standard KBA / credential analysis or in-person ID review per method.",
    paymentGatedScheduling: true,
  },
  {
    capability: "witness_coordination",
    publicSummary:
      "Witness coordination where the document or jurisdiction requires one or more witnesses.",
    operatorNotes: "Confirm witness requirements per document and jurisdiction before execution.",
    paymentGatedScheduling: true,
  },
  {
    capability: "records_execution",
    publicSummary:
      "Execution and handling of public records documents within the scope of a notary and document-execution engagement.",
    operatorNotes: "Stay within notarial and coordination scope; no legal advice.",
    paymentGatedScheduling: true,
  },
  {
    capability: "contract_execution",
    publicSummary:
      "Signature and execution coordination for agency contracts and agreements requiring notarization or witnessing.",
    operatorNotes: "Execution support only; drafting and legal review remain with the agency.",
    paymentGatedScheduling: true,
  },
  {
    capability: "emergency_response_documents",
    publicSummary:
      "Priority coordination for time-sensitive public-sector document execution during emergency operations.",
    operatorNotes: "Escalate scheduling; still payment-gated unless a standing agreement is in place.",
    paymentGatedScheduling: true,
  },
  {
    capability: "vendor_support",
    publicSummary:
      "Notarization and execution support for agency vendors completing procurement or contract paperwork.",
    operatorNotes: "Common entry point via existing awarded vendors.",
    paymentGatedScheduling: true,
  },
  {
    capability: "public_meeting_documents",
    publicSummary:
      "Execution support for documents tied to public meetings and official proceedings.",
    operatorNotes: "Coordinate timing around meeting schedules.",
    paymentGatedScheduling: true,
  },
  {
    capability: "board_documents",
    publicSummary:
      "Execution and witnessing support for board resolutions, minutes, and official board documents.",
    operatorNotes: "Confirm signatory authority with the agency, not asserted by us.",
    paymentGatedScheduling: true,
  },
];

export function getGovernmentServices(): GovernmentServiceEntry[] {
  return GOVERNMENT_SERVICES_REGISTRY;
}

export function getGovernmentService(
  capability: GovernmentCapability,
): GovernmentServiceEntry | undefined {
  return GOVERNMENT_SERVICES_REGISTRY.find((s) => s.capability === capability);
}
