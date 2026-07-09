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
}

export const CANONICAL_MATTER_FIELDS: (keyof CanonicalMatterObject)[] = [
  "matterId", "matterType", "clientId", "organizationId", "country", "destinationCountry", "executionTier", "executionPath", "ron", "mobile", "hybrid", "priority", "timeline", "quoteId", "invoiceId", "paymentId", "portalId", "documentIds", "witnessIds", "translatorId", "courierId", "apostilleId", "status", "qaStatus", "chainOfCustodyIds", "caseStudyId", "knowledgeGraphNodeIds", "alliancePartnerId", "governmentContractId", "revenueId", "kpiIds",
];
