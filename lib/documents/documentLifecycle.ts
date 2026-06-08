export type DocumentLifecycleStatus =
  | "UPLOADED" | "RECEIVED" | "NEEDS_REVIEW" | "VALIDATED"
  | "EXECUTION_READY" | "NOTARIZATION_PENDING" | "NOTARIZED"
  | "APOSTILLE_REQUIRED" | "APOSTILLE_SUBMITTED" | "APOSTILLE_COMPLETED"
  | "AUTHENTICATION_REQUIRED" | "CONSULAR_REVIEW_REQUIRED"
  | "TRANSLATION_REQUIRED" | "TRANSLATION_RECEIVED"
  | "READY_FOR_RELEASE" | "RELEASED" | "ARCHIVED"
  | "REJECTED" | "EXPIRED" | "SUPERSEDED";

export const CLIENT_SAFE_DOCUMENT_STATUS: Record<DocumentLifecycleStatus, string> = {
  UPLOADED: "Uploaded",
  RECEIVED: "Received",
  NEEDS_REVIEW: "Coordinator Review Required",
  VALIDATED: "Reviewed",
  EXECUTION_READY: "Execution Ready",
  NOTARIZATION_PENDING: "Execution Pending",
  NOTARIZED: "Executed",
  APOSTILLE_REQUIRED: "Apostille Review",
  APOSTILLE_SUBMITTED: "Apostille Processing",
  APOSTILLE_COMPLETED: "Apostille Completed",
  AUTHENTICATION_REQUIRED: "Authentication Review",
  CONSULAR_REVIEW_REQUIRED: "Consular Review",
  TRANSLATION_REQUIRED: "Translation Review",
  TRANSLATION_RECEIVED: "Translation Received",
  READY_FOR_RELEASE: "Ready for Release",
  RELEASED: "Released",
  ARCHIVED: "Archived",
  REJECTED: "Coordinator Review Required",
  EXPIRED: "Coordinator Review Required",
  SUPERSEDED: "Updated Document Received",
};

export function getClientSafeDocumentStatus(status: DocumentLifecycleStatus): string {
  return CLIENT_SAFE_DOCUMENT_STATUS[status] ?? "Coordinator Review Required";
}

export function requiresManualDocumentReview(status: DocumentLifecycleStatus): boolean {
  return (["NEEDS_REVIEW","AUTHENTICATION_REQUIRED","CONSULAR_REVIEW_REQUIRED",
    "TRANSLATION_REQUIRED","REJECTED","EXPIRED","SUPERSEDED"] as DocumentLifecycleStatus[]).includes(status);
}

export const DOCUMENT_LIFECYCLE_ORDER: DocumentLifecycleStatus[] = [
  "UPLOADED","RECEIVED","NEEDS_REVIEW","VALIDATED","EXECUTION_READY",
  "NOTARIZATION_PENDING","NOTARIZED","APOSTILLE_REQUIRED","APOSTILLE_SUBMITTED",
  "APOSTILLE_COMPLETED","READY_FOR_RELEASE","RELEASED","ARCHIVED",
];
