export type ExecutionPath = "Digital First" | "Field Execution" | "Hybrid Execution" | "International Coordination";
export type ExecutionTier = "Signature" | "Priority" | "Executive" | "Hourly" | "Project-Based" | "Task Order" | "Custom Scope" | "Retainer" | "Foundation" | "Professional" | "Enterprise";

export interface CanonicalMatterObject {
  matterId: string;
  matterType: string;
  clientId?: string;
  organizationId?: string;
  country?: string;
  destinationCountry?: string;
  executionTier?: ExecutionTier;
  executionPath?: ExecutionPath;
  ron?: boolean;
  mobile?: boolean;
  hybrid?: boolean;
  priority?: string;
  timeline?: string;
  quoteId?: string;
  invoiceId?: string;
  paymentId?: string;
  portalId?: string;
  documentIds: string[];
  witnessIds: string[];
  translatorId?: string;
  courierId?: string;
  apostilleId?: string;
  status: string;
  qaStatus?: string;
  chainOfCustodyIds: string[];
  caseStudyId?: string;
  knowledgeGraphNodeIds: string[];
  alliancePartnerId?: string;
  governmentContractId?: string;
  revenueId?: string;
  kpiIds: string[];

  // ── Unification Phase 3 extensions (ALL OPTIONAL — additive, non-breaking) ──
  // IDENTITY
  reference?: string;
  state?: string; // canonical state — normalize via matterStateAdapters
  substate?: string;
  urgency?: string;
  createdAt?: string;
  updatedAt?: string;
  // CLIENT
  contactId?: string;
  clientType?: string;
  referralSourceId?: string;
  // JURISDICTION
  documentOriginJurisdictionId?: string;
  signerLocation?: string;
  destinationCountryId?: string;
  receivingAuthorityId?: string;
  hagueStatusReference?: string;
  manualReviewFlags?: string[];
  // EXECUTION
  ronEligibility?: boolean | "unknown";
  fieldAvailability?: boolean | "unknown";
  hybridEligibility?: boolean | "unknown";
  witnessRequirement?: boolean | "unknown";
  translatorRequirement?: boolean | "unknown";
  executionAppointment?: string | null;
  assignedOperatorId?: string;
  assignedPartnerId?: string;
  // COMMERCIAL
  quotedValue?: number | null;
  paidValue?: number | null;
  paymentStatus?: string;
  paymentReference?: string;
  schedulingUnlocked?: boolean;
  // DOCUMENTS
  documentFamily?: string;
  requiredSignatures?: number | null;
  notarialCertificateRequirements?: string[];
  // QA
  qaRecordIds?: string[];
  identifierVerificationStatus?: string;
  signerReadiness?: string;
  witnessReadiness?: string;
  apostillePacketReadiness?: string;
  courierReadiness?: string;
  blockerIds?: string[];
  qaComplete?: boolean;
  // FULFILLMENT
  ronSessionStatus?: string;
  apostilleStatus?: string;
  translationStatus?: string;
  custodyEventIds?: string[];
  deliveryStatus?: string;
  releaseEligible?: boolean | "unknown"; // read from approved release gate only
  releaseStatus?: string;
  // PORTAL
  portalAccessId?: string;
  clientActionRequired?: boolean;
  clientVisibleStatus?: string;
  clientVisibleTimeline?: string[];
  // OPERATIONS
  operatorActionIds?: string[];
  governmentOpportunityId?: string;
  governmentSubmissionId?: string;
  revenueEventIds?: string[];
  intelligenceNodeIds?: string[];
  sopUpdateIds?: string[];
  // METADATA (canonical common fields)
  source?: string;
  sourceRecordId?: string;
  environment?: string;
  isSample?: boolean;
  dataClassification?: string;
  createdBy?: string;
  updatedBy?: string;
}

export const CANONICAL_MATTER_FIELDS: (keyof CanonicalMatterObject)[] = [
  "matterId", "matterType", "clientId", "organizationId", "country", "destinationCountry", "executionTier", "executionPath", "ron", "mobile", "hybrid", "priority", "timeline", "quoteId", "invoiceId", "paymentId", "portalId", "documentIds", "witnessIds", "translatorId", "courierId", "apostilleId", "status", "qaStatus", "chainOfCustodyIds", "caseStudyId", "knowledgeGraphNodeIds", "alliancePartnerId", "governmentContractId", "revenueId", "kpiIds",
];
