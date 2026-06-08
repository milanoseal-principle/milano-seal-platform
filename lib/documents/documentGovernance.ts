import { DocumentLifecycleStatus, getClientSafeDocumentStatus, requiresManualDocumentReview } from "./documentLifecycle";

export type ValidityStatus = "UNKNOWN" | "VALID" | "EXPIRING_SOON" | "EXPIRED" | "REVIEW_REQUIRED" | "AUTHORITY_DEPENDENT";

export interface DocumentGovernanceRecord {
  matterId: string;
  documentId?: string;
  documentType?: string;
  lifecycleStatus: DocumentLifecycleStatus;
  validityStatus: ValidityStatus;
  destinationCountry?: string;
  receivingAuthority?: string;
  apostilleRequired: boolean;
  authenticationRequired: boolean;
  translationRequired: boolean;
  manualReviewRequired: boolean;
  issueDate?: string;
  expirationDate?: string;
  clientSafeStatus: string;
  clientSafeSummary?: string;
}

export function buildGovernanceRecord(
  matterId: string,
  lifecycleStatus: DocumentLifecycleStatus,
  opts: Partial<DocumentGovernanceRecord> = {}
): DocumentGovernanceRecord {
  return {
    matterId,
    documentId: opts.documentId,
    documentType: opts.documentType,
    lifecycleStatus,
    validityStatus: opts.validityStatus ?? "UNKNOWN",
    destinationCountry: opts.destinationCountry,
    receivingAuthority: opts.receivingAuthority,
    apostilleRequired: opts.apostilleRequired ?? false,
    authenticationRequired: opts.authenticationRequired ?? false,
    translationRequired: opts.translationRequired ?? false,
    manualReviewRequired: requiresManualDocumentReview(lifecycleStatus),
    issueDate: opts.issueDate,
    expirationDate: opts.expirationDate,
    clientSafeStatus: getClientSafeDocumentStatus(lifecycleStatus),
    clientSafeSummary: opts.clientSafeSummary ??
      "Your document is being reviewed through The Milano Seal execution workflow before the next stage begins.",
  };
}

export const BLOCKED_GOVERNANCE_FIELDS = [
  "operator_notes","internal_notes","storage_path","file_path","file_url",
  "label_url","margin","base_cost","shipping_spread","raw_webhook","raw_event",
  "source_vault","full_signing_url","bn_signing_url","base64Doc",
] as const;
