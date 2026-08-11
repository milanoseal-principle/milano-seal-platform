/**
 * Unified Revenue Stack — types. One connected architecture across ten revenue
 * channels, all reusing canonical Matter/Organization/Contact/Pricing/Revenue.
 * Actual revenue requires a verified payment event; quoted value is not paid.
 */

export type RevenueChannel =
  | "consumer_international"
  | "legal_professional"
  | "corporate_international"
  | "government_procurement"
  | "maritime_logistics"
  | "university_education"
  | "healthcare_medical"
  | "enterprise_retainer"
  | "strategic_referral"
  | "executive_concierge";

export type RevenueModel =
  | "one_time_matter"
  | "project_fee"
  | "priority_fee"
  | "urgent_response"
  | "after_hours"
  | "monthly_retainer"
  | "annual_agreement"
  | "task_order"
  | "institutional_contract"
  | "referral_attribution"
  | "partner_execution"
  | "white_label_future"
  | "custom_scope";

export type CommercialAccountStatus =
  | "target"
  | "contacted"
  | "discovery"
  | "qualified"
  | "proposal_sent"
  | "pilot"
  | "onboarding"
  | "active"
  | "renewal_due"
  | "expanded"
  | "dormant"
  | "lost";
