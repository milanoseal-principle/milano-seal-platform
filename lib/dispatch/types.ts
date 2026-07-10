// Task 5 — Alliance Dispatch Network
// Typed domain model for the independent-partner dispatch network.
//
// INDEPENDENCE NOTICE: Every partner in this network is an INDEPENDENT
// CONTRACTOR. There is no employment relationship, no guaranteed assignments,
// and no guaranteed income. An Assignment is always an OFFER a partner may
// accept or decline. Partner payments are a tracking queue only and always
// require explicit founder approval before any payout — this module never
// processes payments and never touches Wise.
export const PARTNER_INDEPENDENCE_NOTICE =
  "Partners are independent contractors. No guaranteed assignments, no guaranteed income, no employment relationship.";

export type PartnerStatus =
  | "applied"
  | "verifying"
  | "vetted"
  | "active"
  | "inactive"
  | "blocked";

export type PartnerCapability =
  | "remote_online_notarization"
  | "mobile_notary"
  | "witness_coordination"
  | "document_pickup"
  | "document_delivery"
  | "identity_verification"
  | "apostille_runner";

export interface PartnerApplication {
  id: string;
  displayName: string;
  region: string;
  capabilities: PartnerCapability[];
  submittedAt: string; // ISO date
  status: PartnerStatus;
  // Independent contractor — application never implies a job offer.
  acknowledgedIndependence: boolean;
  notesForOperator?: string; // internal, never shown to partner
}

export type VerificationCheck =
  | "identity"
  | "credential"
  | "background"
  | "insurance"
  | "sanctions";

export type VerificationResult = "pending" | "passed" | "failed" | "waived";

export interface PartnerVerification {
  partnerId: string;
  checks: { type: VerificationCheck; result: VerificationResult; checkedAt?: string }[];
  updatedAt: string;
}

export interface PartnerPassport {
  partnerId: string;
  displayName: string;
  status: PartnerStatus;
  capabilities: PartnerCapability[];
  regions: string[];
  verifiedChecks: VerificationCheck[];
  trustBand: string;
  completedAssignments: number;
  issuedAt: string | null;
}

export type TrustBand = "unrated" | "provisional" | "trusted" | "elite";

export interface TrustScore {
  partnerId: string;
  score: number; // 0-100
  band: TrustBand;
  reasons: string[];
}

export interface CoverageArea {
  id: string;
  partnerId: string;
  region: string;
  postalPrefixes: string[];
  radiusKm: number;
  capabilities: PartnerCapability[];
}

export type AvailabilityState = "open" | "tentative" | "booked" | "unavailable";

export interface AvailabilitySlot {
  id: string;
  partnerId: string;
  start: string; // ISO datetime
  end: string; // ISO datetime
  state: AvailabilityState;
}

export type DispatchJobStatus =
  | "queued"
  | "offered"
  | "assigned"
  | "in_progress"
  | "completed"
  | "cancelled";

export type DispatchPriority = "standard" | "priority" | "urgent";

export interface DispatchJob {
  id: string;
  reference: string; // opaque reference — never an internal matter path
  region: string;
  capability: PartnerCapability;
  requestedFor: string; // ISO datetime
  priority: DispatchPriority;
  status: DispatchJobStatus;
  createdAt: string;
}

export type AssignmentState =
  | "offered" // OFFER only — partner may accept or decline
  | "accepted"
  | "declined"
  | "expired"
  | "withdrawn"
  | "completed";

export interface Assignment {
  id: string;
  jobId: string;
  partnerId: string;
  // An assignment is always an OFFER first. Never a guaranteed job.
  state: AssignmentState;
  offeredAt: string;
  respondedAt?: string;
  expiresAt: string;
}

export type ReviewOutcome = "pending" | "approved" | "revisions_requested" | "rejected";

export interface CompletionReview {
  assignmentId: string;
  partnerId: string;
  submittedAt: string;
  checklist: { item: string; done: boolean }[];
  outcome: ReviewOutcome;
}

export interface QaReview {
  assignmentId: string;
  reviewer: string;
  score: number; // 0-100
  outcome: ReviewOutcome;
  reviewedAt: string;
  internalNotes?: string; // internal only, never shown to partner
}

export type PartnerPaymentStatus =
  | "owed"
  | "pending_founder_approval"
  | "approved"
  | "on_hold";

export interface PartnerPaymentItem {
  id: string;
  partnerId: string;
  assignmentId: string;
  amountCents: number;
  currency: string;
  status: PartnerPaymentStatus;
  accruedAt: string;
  // Payout only ever proceeds after explicit founder approval elsewhere.
  founderApproved: boolean;
}
