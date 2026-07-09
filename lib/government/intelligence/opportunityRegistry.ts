import type { ProcurementLifecycleStage } from "./procurementLifecycle";

export type OpportunityStatus = "Research" | "Watch" | "Open" | "Drafting" | "Submitted" | "Evaluation" | "Awarded" | "Lost" | "Archived";

export interface GovernmentOpportunity {
  id: string;
  title: string;
  agencyId: string;
  agency: string;
  department?: string;
  solicitationNumber?: string;
  type: "RFI" | "RFQ" | "RFP" | "ITB" | "Vendor Registration" | "Renewal Watch" | "Relationship";
  status: OpportunityStatus;
  lifecycleStage: ProcurementLifecycleStage;
  issueDate?: string;
  dueDate?: string;
  awardDate?: string;
  renewalDate?: string;
  category: string;
  industry: string;
  estimatedValue?: number;
  currentVendor?: string;
  documents: string[];
  questions: string[];
  addenda: string[];
  preBidMeetings: string[];
  evaluationCriteria: string[];
  winProbability: number;
  bidRecommendation: "No bid" | "Watch" | "Register" | "Relationship first" | "Bid when verified";
  notes: string[];
}

export const OPPORTUNITY_REGISTRY: GovernmentOpportunity[] = [
  {
    id: "fl-county-vendor-registration-watch",
    title: "Florida county vendor registration and administrative support watch",
    agencyId: "pinellas-county",
    agency: "Pinellas County",
    type: "Vendor Registration",
    status: "Watch",
    lifecycleStage: "Vendor Registration",
    category: "Administrative Support Classification",
    industry: "Public sector records and document operations",
    documents: ["Capability statement", "insurance evidence", "entity records", "W-9 when requested"],
    questions: ["Which commodity codes are active for document preparation and administrative support?"],
    addenda: [],
    preBidMeetings: [],
    evaluationCriteria: ["registration completeness", "scope fit", "response readiness", "relationship history"],
    winProbability: 0,
    bidRecommendation: "Register",
    notes: ["Intelligence asset only. No open solicitation, award, or revenue is implied."],
  },
];

export function getOpenOpportunityValue(opportunities = OPPORTUNITY_REGISTRY): number {
  return opportunities.reduce((sum, opportunity) => sum + (opportunity.status === "Open" ? opportunity.estimatedValue ?? 0 : 0), 0);
}
