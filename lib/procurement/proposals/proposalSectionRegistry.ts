/**
 * proposalSectionRegistry — reusable, canonical proposal modules. Agency-specific
 * language stays tied to its opportunity; only reusable company language lives
 * here. No unsupported claims, no assumed reference consent or insurance binding,
 * no award assumptions.
 */

export type ProposalSectionKey =
  | "cover_page"
  | "transmittal_letter"
  | "executive_summary"
  | "business_profile"
  | "understanding_of_need"
  | "scope_response"
  | "operational_workflow"
  | "service_catalog"
  | "delivery_model"
  | "implementation_plan"
  | "staffing"
  | "quality_assurance"
  | "risk_controls"
  | "compliance_matrix"
  | "capability_matrix"
  | "pricing_narrative"
  | "rate_sheet"
  | "references"
  | "insurance"
  | "certifications"
  | "past_performance"
  | "fema_clauses"
  | "exceptions"
  | "signature"
  | "attachments"
  | "commitment_to_performance"
  | "point_of_contact";

export interface ProposalSection {
  key: ProposalSectionKey;
  title: string;
  /** true when the body must be authored per-opportunity (agency-specific). */
  agencySpecific: boolean;
  /** reusable canonical body, when available; null when per-opportunity. */
  reusableBody: string | null;
}

export const PROPOSAL_SECTION_REGISTRY: ProposalSection[] = [
  { key: "cover_page", title: "Cover Page", agencySpecific: true, reusableBody: null },
  { key: "transmittal_letter", title: "Transmittal Letter", agencySpecific: true, reusableBody: null },
  { key: "executive_summary", title: "Executive Summary", agencySpecific: true, reusableBody: null },
  {
    key: "business_profile",
    title: "Business Profile",
    agencySpecific: false,
    reusableBody:
      "Milano Seal International, LLC d/b/a The Milano Seal is a digital-first document execution and administrative coordination company supporting individuals, professionals, businesses, and institutions with secure U.S. document execution for domestic and international use.",
  },
  { key: "understanding_of_need", title: "Understanding of Need", agencySpecific: true, reusableBody: null },
  { key: "scope_response", title: "Scope Response", agencySpecific: true, reusableBody: null },
  {
    key: "operational_workflow",
    title: "Operational Workflow",
    agencySpecific: false,
    reusableBody:
      "Intake → qualification → execution-pathway review → quote → payment confirmation → execution → QA → apostille/authentication → translation → courier → controlled handoff → release.",
  },
  { key: "service_catalog", title: "Service Catalog", agencySpecific: false, reusableBody: null },
  { key: "delivery_model", title: "Delivery Model", agencySpecific: false, reusableBody: null },
  { key: "implementation_plan", title: "Implementation Plan", agencySpecific: true, reusableBody: null },
  { key: "staffing", title: "Staffing", agencySpecific: false, reusableBody: null },
  {
    key: "quality_assurance",
    title: "Quality Assurance",
    agencySpecific: false,
    reusableBody:
      "No matter advances to scheduling until an administrative compliance review confirms document completeness, correct notarial certificate, witness and identity requirements, apostille eligibility, and delivery routing.",
  },
  { key: "risk_controls", title: "Risk Controls", agencySpecific: false, reusableBody: null },
  { key: "compliance_matrix", title: "Compliance Matrix", agencySpecific: true, reusableBody: null },
  { key: "capability_matrix", title: "Capability Matrix", agencySpecific: false, reusableBody: null },
  { key: "pricing_narrative", title: "Pricing Narrative", agencySpecific: true, reusableBody: null },
  { key: "rate_sheet", title: "Rate Sheet", agencySpecific: true, reusableBody: null },
  { key: "references", title: "References", agencySpecific: true, reusableBody: null },
  { key: "insurance", title: "Insurance", agencySpecific: true, reusableBody: null },
  { key: "certifications", title: "Certifications", agencySpecific: true, reusableBody: null },
  { key: "past_performance", title: "Past Performance", agencySpecific: true, reusableBody: null },
  { key: "fema_clauses", title: "FEMA Clauses", agencySpecific: true, reusableBody: null },
  { key: "exceptions", title: "Exceptions", agencySpecific: true, reusableBody: null },
  { key: "signature", title: "Signature", agencySpecific: true, reusableBody: null },
  { key: "attachments", title: "Attachments", agencySpecific: true, reusableBody: null },
  {
    key: "commitment_to_performance",
    title: "Commitment to Performance",
    agencySpecific: false,
    reusableBody:
      "All services are coordination and administrative support only — no legal, medical, or immigration advice. No outcome is guaranteed by Milano Seal or by any receiving authority.",
  },
  { key: "point_of_contact", title: "Point of Contact", agencySpecific: false, reusableBody: null },
];

export function getProposalSection(key: ProposalSectionKey): ProposalSection | null {
  return PROPOSAL_SECTION_REGISTRY.find((s) => s.key === key) ?? null;
}

/** Assemble a proposal outline from an ordered set of section keys. */
export function assembleProposalOutline(keys: ProposalSectionKey[]): ProposalSection[] {
  return keys.map(getProposalSection).filter((s): s is ProposalSection => s !== null);
}
