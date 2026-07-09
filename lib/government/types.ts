// Module 14 — Government & Public Sector Document Execution Vertical
// Typed domain model. INTERNAL data only — never rendered publicly as
// live/claimed facts. No fabricated clients, awards, or registrations.

export type GovernmentCustomerType =
  | "county_governments"
  | "city_governments"
  | "school_districts"
  | "public_universities"
  | "community_colleges"
  | "special_districts"
  | "housing_authorities"
  | "transit_authorities"
  | "economic_development_agencies"
  | "courts"
  | "public_defenders"
  | "state_agencies"
  | "public_hospitals"
  | "emergency_management"
  | "public_procurement_offices"
  | "airport_authorities";

export type GovernmentCapability =
  | "remote_online_notarization"
  | "mobile_execution"
  | "document_authentication_coordination"
  | "apostille_coordination"
  | "identity_verification"
  | "witness_coordination"
  | "records_execution"
  | "contract_execution"
  | "emergency_response_documents"
  | "vendor_support"
  | "public_meeting_documents"
  | "board_documents";

export type GovernmentPipelineStage =
  | "prospect"
  | "vendor_registered"
  | "capability_statement_sent"
  | "meeting_requested"
  | "opportunity_identified"
  | "bid_submitted"
  | "shortlisted"
  | "awarded"
  | "renewal"
  | "lost";

export type GovernmentRevenueStream =
  | "one_time_engagement"
  | "master_service_agreement"
  | "blanket_purchase_agreement"
  | "annual_contract"
  | "emergency_contract"
  | "on_call_services"
  | "task_orders"
  | "department_retainer";

export type VendorRegistrationStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "active"
  | "expired";

export interface GovernmentCrmRecord {
  agency: string;
  department: string;
  buyer: string;
  procurement_officer: string;
  contract_manager: string;
  solicitation_number: string;
  opportunity_value: number;
  status: GovernmentPipelineStage;
  award_date: string | null;
  renewal_date: string | null;
  incumbent_vendor: string | null;
  competitors: string[];
  relationship_score: number; // 0-100
  vendor_registration_status: VendorRegistrationStatus;
  capability_statement_sent: boolean;
  next_follow_up: string | null;
}

export type ProcurementOpportunityType =
  | "open_bid"
  | "quote"
  | "rfp"
  | "rfq"
  | "itb"
  | "renewal"
  | "pre_bid_meeting";

export interface ProcurementOpportunity {
  type: ProcurementOpportunityType;
  title: string;
  agency: string;
  deadline: string; // ISO date
  value: number;
  stage: GovernmentPipelineStage;
}

// Documents an operator should hold ready for government vendor registration
// and solicitation response. String identifiers only — no live claims.
export const GOVERNMENT_DOCUMENT_VAULT_ITEMS: string[] = [
  "capability_statement",
  "w9",
  "coi",
  "business_license",
  "eo_insurance",
  "florida_notary_commission",
  "ron_authorization",
  "vendor_forms",
  "references",
  "past_performance",
  "naics_codes",
  "commodity_codes",
];
