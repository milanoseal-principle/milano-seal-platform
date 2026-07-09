// Real, completed government submission record.
//
// Pinellas County ITQ #25-0786-ITQ — recorded as actual data, not a sample.
//
// SAFETY / TRUTH RULES (do not violate when editing):
// - Status is SUBMITTED only. No award has occurred. Never mark won/awarded.
// - No win probability, revenue projection, or award date is asserted.
// - Genuinely unknown fields are left empty ("") or null — never guessed.
// - This is a rate-based, on-call / emergency ITQ. There is NO fixed award
//   value; numeric "value" fields are 0 to mean "no fixed dollar amount",
//   NOT "$0 opportunity". The real bid is the hourly rate schedule below.

import type {
  ProcurementOpportunity,
  GovernmentCrmRecord,
} from "../types";

// Submission-specific facts that the generic ProcurementOpportunity /
// GovernmentCrmRecord types do not capture. Smallest record needed — no larger
// system scaffolded.
export interface GovernmentSubmissionRecord {
  solicitationNumber: string;
  solicitationTitle: string;
  issuingAgency: string;
  submissionStatus: "submitted"; // literal — never "awarded"/"won"
  submissionDate: string; // ISO 8601 with offset
  submissionPortalUrl: string;
  bidScope: string[];
  /** Explicitly declined as outside capability — honest no-bid. */
  noBidScope: string[];
  ratesBid: { label: string; rate: string }[];
  sbeStatus: boolean;
  /** Delivery after receipt of order, in days. */
  deliveryAroDays: number;
  deliveryNote: string | null;
  references: { name: string; kind: "private_commercial" }[];
  insurance: {
    line: string;
    status: string;
    carrier: string | null;
    policyNumber: string | null;
    limit: string | null;
  }[];
  openItemsPostSubmission: string[];
  positioningFramework: string;
  awardDate: string | null;
  notes: string | null;
}

export const PINELLAS_ITQ_250786: GovernmentSubmissionRecord = {
  solicitationNumber: "25-0786-ITQ",
  solicitationTitle:
    "General Solicitation for Emergency/Disaster Response Goods & Services",
  issuingAgency: "Pinellas County Purchasing & Risk Management Division",
  submissionStatus: "submitted",
  submissionDate: "2026-07-09T10:41:00-04:00",
  submissionPortalUrl:
    "https://procurement.opengov.com/vendors/531209/proposals/541502",
  bidScope: [
    "Administrative and Records Support",
    "Staffing Support",
    "Emergency document/affidavit execution",
    "Identity verification",
    "Witness coordination",
    "Remote online notarization (RON) coordination",
    "Apostille/authentication coordination",
  ],
  noBidScope: [
    "Debris removal",
    "Transport (FTL/LTL/TTHU)",
    "Heavy equipment",
    "Vehicle/equipment rental",
  ],
  ratesBid: [
    { label: "Labor", rate: "$150.00/hr" },
    { label: "Overtime", rate: "$225.00/hr" },
    { label: "Standby", rate: "$112.50/hr" },
    { label: "Indirect", rate: "10% (County maximum)" },
    { label: "Services", rate: "pass-through at cost" },
  ],
  sbeStatus: false,
  deliveryAroDays: 1,
  deliveryNote: "Same-day for Critical-priority requests.",
  references: [
    { name: "Ensure Products", kind: "private_commercial" },
    { name: "The Milano Group at RE/MAX Elevate", kind: "private_commercial" },
    { name: "Matt Loutzenhiser", kind: "private_commercial" },
    { name: "Ryan Hilberth", kind: "private_commercial" },
  ],
  insurance: [
    {
      line: "Notary E&O",
      status: "in place",
      carrier: "Travelers",
      policyNumber: "FL-2472245",
      limit: "$25,000",
    },
    {
      line: "Commercial General Liability (CGL)",
      status:
        "submitted via broker letter of intent per ITQ 5.2.A — not yet bound",
      carrier: null,
      policyNumber: null,
      limit: null,
    },
    {
      line: "Business Auto",
      status:
        "submitted via broker letter of intent per ITQ 5.2.A — not yet bound",
      carrier: null,
      policyNumber: null,
      limit: null,
    },
  ],
  openItemsPostSubmission: [
    "W-9",
    "OpenGov vendor registration confirmation",
    "CGL/Business Auto binding before the 10-day post-recommendation deadline (ITQ 3.13)",
  ],
  positioningFramework:
    "Digital-First Execution Coordination with Field Execution Capability (RON primary pathway; field execution based on availability, not guaranteed)",
  awardDate: null,
  notes:
    "References are private/commercial, not prior government contracts. Rate-based on-call/emergency ITQ — no fixed award value.",
};

// Same record projected into the existing engine-consumable shapes so it plugs
// into procurementOpportunityEngine / governmentCrmEngine without a parallel
// system. value/opportunity_value = 0 means "no fixed dollar amount" (see note).
export const PINELLAS_ITQ_250786_OPPORTUNITY: ProcurementOpportunity = {
  type: "quote", // ITQ = Invitation To Quote
  title: PINELLAS_ITQ_250786.solicitationTitle,
  agency: PINELLAS_ITQ_250786.issuingAgency,
  deadline: "2026-07-09", // submitted; general/continuous solicitation
  value: 0, // rate-based — no fixed award value
  stage: "bid_submitted",
};

export const PINELLAS_ITQ_250786_CRM: GovernmentCrmRecord = {
  agency: "Pinellas County",
  department: "Purchasing & Risk Management Division",
  buyer: "", // unknown — not guessed
  procurement_officer: "", // unknown — not guessed
  contract_manager: "", // unknown — not guessed
  solicitation_number: "25-0786-ITQ",
  opportunity_value: 0, // rate-based — no fixed value
  status: "bid_submitted",
  award_date: null,
  renewal_date: null,
  incumbent_vendor: null,
  competitors: [],
  relationship_score: 0, // no established relationship yet
  vendor_registration_status: "in_progress", // OpenGov confirmation still open
  capability_statement_sent: true,
  next_follow_up: null,
};

// Canonical list of recorded real submissions. Append future real submissions
// here — never fabricate entries.
export const GOVERNMENT_SUBMISSIONS: GovernmentSubmissionRecord[] = [
  PINELLAS_ITQ_250786,
];
