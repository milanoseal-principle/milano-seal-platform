/**
 * Pinellas County ITQ #25-0786-ITQ — REAL submission record.
 *
 * Source of truth: the submitted Milano Seal response package and SOW / Price
 * List (Attachment 8.3). This is REAL data (isSample: false). Status is and
 * remains "submitted / not awarded" — there is no award evidence. Do not change
 * to awarded without documented award evidence (see procurementSafety.canRecordAward).
 *
 * Unknown operational fields (portal confirmation number, exact submission
 * timestamp) are left null rather than guessed.
 */

import type {
  ProcurementRecordMeta,
  DataStatus,
  VerificationStatus,
} from "@/lib/procurement/procurementSafety";

export type PinellasSubmissionStatus = "submitted" | "not_awarded";

export interface RateLine {
  line: string;
  description: string;
  unit: string;
  rate: string;
  decision: "BID" | "NO_BID";
}

export interface GovernmentSubmissionRecord extends ProcurementRecordMeta {
  solicitationNumber: string;
  solicitationTitle: string;
  agencyName: string;
  agencyType: string;
  vendorLegalName: string;
  vendorDba: string;
  ein: string;
  notaryCommission: string;
  submitter: string;
  submissionStatus: PinellasSubmissionStatus;
  awardEvidenceRef: string | null;
  contractTermMonths: number;
  bidScope: string[];
  declinedScope: string[];
  rateSchedule: RateLine[];
  pricingBasis: string;
  positioning: string;
  attachments: string[];
  openItems: string[];
  lessonsLearned: string[];
  disclaimers: string[];
}

export const PINELLAS_ITQ_250786: GovernmentSubmissionRecord = {
  // ── Meta (real record) ──
  id: "gov-submission-pinellas-itq-25-0786",
  source: "Milano Seal submitted response package + SOW/Price List (Attachment 8.3)",
  sourceUrl: null,
  dataStatus: "submitted" as DataStatus,
  verificationStatus: "verified" as VerificationStatus,
  createdAt: null,
  updatedAt: null,
  owner: "Nicholas Milano",
  notes:
    "Real submission. Status remains submitted / not awarded — no award evidence recorded.",
  isSample: false,

  // ── Solicitation ──
  solicitationNumber: "25-0786-ITQ",
  solicitationTitle:
    "General Solicitation for Emergency/Disaster Response Goods & Services",
  agencyName: "Pinellas County",
  agencyType: "county",
  vendorLegalName: "Milano Seal International, LLC",
  vendorDba: "The Milano Seal",
  ein: "41-5272965",
  notaryCommission: "FL Notary Commission #668288",
  submitter: "Nicholas Milano, Founder & CEO",

  submissionStatus: "not_awarded",
  awardEvidenceRef: null,
  contractTermMonths: 60,

  bidScope: [
    "Emergency document execution (affidavits, powers of attorney, healthcare directives, administrative declarations) at shelters, PODs, staging areas, and the Pinellas County EOC",
    "Identity verification and witness coordination for County personnel and displaced residents",
    "Remote Online Notarization where legally authorized",
    "Apostille and authentication coordination for displaced international residents and agency partners",
    "Administrative and records support (vendor onboarding packets, procurement affidavits, public records acknowledgments, FEMA documentation coordination, mutual aid execution support)",
    "Support to other awarded contractors needing forms, affidavits, or certifications executed for their own FEMA reimbursement documentation",
  ],
  declinedScope: [
    "Debris removal",
    "Heavy equipment",
    "Transport",
    "Rental line items",
    "Driver / Operator / Transport / Rental categories (ITQ lines 4–18)",
    "Goods-only line items",
  ],

  rateSchedule: [
    {
      line: "1",
      description:
        "Labor (per hour) — Professional Document Execution Coordination, Identity Verification, Administrative Records Support & Witness Coordination Personnel",
      unit: "Hour",
      rate: "$150.00",
      decision: "BID",
    },
    { line: "2", description: "Labor Overtime (OT, per hour)", unit: "Hour", rate: "$225.00", decision: "BID" },
    { line: "3", description: "Standby Time (per hour)", unit: "Hour", rate: "$112.50", decision: "BID" },
    {
      line: "4–18",
      description: "Driver / Operator / Transport / Rental (all categories)",
      unit: "Var.",
      rate: "—",
      decision: "NO_BID",
    },
    { line: "21", description: "Indirect Costs (not to exceed 10%)", unit: "% Total", rate: "10%", decision: "BID" },
  ],
  pricingBasis:
    "Follows the County's own rate schedule (ITQ Section 7), not the private-client rate card, per FEMA C.F.R. guidance that cost-plus pricing is not reimbursable. Firm rate held for the 60-month contract term (ITQ 4.4). At-cost pass-through, no markup on materials.",

  positioning:
    "Digital-first document execution and administrative support vendor — not bidding debris, equipment, transport, or rental. Scope limited to document execution, RON, apostille/authentication coordination, and administrative/records support for emergency response and recovery.",

  attachments: ["Statement of Work & Price List / Quote (Attachment 8.3)", "Response Package (final)"],

  openItems: [
    "Portal submission confirmation number — pending verification",
    "Exact submission timestamp — pending verification",
    "Insurance evidence attachment status — pending verification",
    "Reference consent records — pending verification",
  ],
  lessonsLearned: [
    "County rate schedule governs pricing over private rate card for FEMA-reimbursable work",
    "Clear BID / NO-BID scoping keeps the response tightly aligned to document-execution capability",
  ],
  disclaimers: [
    "All services are coordination and administrative support only — no legal, medical, or immigration advice.",
    "No outcome is guaranteed by Milano Seal or by any receiving authority, embassy, consulate, court, or agency.",
  ],
};
