export type ExecutionLane =
  | "signature"
  | "priority"
  | "executive"
  | "route_review_only"
  | "apostille_only"
  | "regulated_manual_review";

export type PricingVisibility =
  | "public_hidden"
  | "client_estimate_only"
  | "operator_internal"
  | "approved_invoice";

export type PricingConfidence = "low" | "medium" | "high" | "manual_review_required";

export type ComplexityFlag =
  | "single_document"
  | "multiple_documents"
  | "single_signer"
  | "multiple_signers"
  | "apostille_required"
  | "federal_document"
  | "state_document"
  | "mixed_state_federal"
  | "translation_sensitive"
  | "foreign_receiving_authority"
  | "urgent_deadline"
  | "professional_intermediary"
  | "regulated_professional"
  | "fingerprinting_route"
  | "loan_signing"
  | "civil_records_bundle"
  | "education_credentials"
  | "immigration_citizenship"
  | "business_corporate"
  | "high_value_transaction"
  | "manual_review";

export interface SmartPricingInput {
  documentType?: string;
  documentFamily?: string;
  destinationCountry?: string;
  originJurisdiction?: string;
  signerLocation?: string;
  signerCount?: number;
  documentCount?: number;
  apostilleRequired?: boolean;
  authenticationRequired?: boolean;
  translationNeeded?: boolean | "unknown";
  urgency?: "normal" | "urgent" | "same_day";
  receivingAuthorityType?: string;
  regulatedUseCase?: boolean;
  fingerprintUseCase?: string | null;
  loanSigningNeeded?: boolean;
  courierNeeded?: boolean;
  internationalShipping?: boolean;
  professionalIntermediary?: boolean;
  clientType?: string;
  uploadedAgencyInstructions?: boolean;
  oriProvided?: boolean;
  deadlineDate?: string | null;
}

export interface SmartPricingResult {
  suggestedLane: ExecutionLane;
  publicLabel: string;
  clientSafeSummary: string;
  operatorInternalRange: [number, number] | null;
  internalBase: number | null;
  addOns: Record<string, number | [number, number]>;
  complexityScore: number;
  complexityFlags: ComplexityFlag[];
  pricingConfidence: PricingConfidence;
  manualReviewRequired: boolean;
  manualReviewReasons: string[];
  paymentGateRequired: boolean;
  schedulingLockedUntilPayment: boolean;
  quoteCanBeAutoDrafted: boolean;
  quoteRequiresFounderReview: boolean;
  publicDisplay: string;
  operatorNotes?: string[];
}
