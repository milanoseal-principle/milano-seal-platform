// Client Portal 2.0 — client-safe view models.
//
// GUARDRAIL: Every interface in this file describes data that is rendered to
// the CLIENT. It must NEVER carry internal notes, margins, raw Wise payloads,
// storage paths, operator-only data, or any other operator-facing field.
// See lib/portal2/portalSafety.ts for the runtime guard.

/**
 * Canonical status vocabulary for a matter's lifecycle.
 * This is the single source of truth for portal 2.0 status logic.
 */
export type MatterStatus =
  | "intake_received"
  | "under_review"
  | "quoted"
  | "awaiting_payment"
  | "scheduled"
  | "in_execution"
  | "apostille_processing"
  | "in_transit"
  | "delivered"
  | "completed";

export const MATTER_STATUS_ORDER: MatterStatus[] = [
  "intake_received",
  "under_review",
  "quoted",
  "awaiting_payment",
  "scheduled",
  "in_execution",
  "apostille_processing",
  "in_transit",
  "delivered",
  "completed",
];

/** Human-readable label for each canonical status. */
export const MATTER_STATUS_LABELS: Record<MatterStatus, string> = {
  intake_received: "Intake Received",
  under_review: "Under Review",
  quoted: "Proposal Issued",
  awaiting_payment: "Awaiting Payment",
  scheduled: "Scheduled",
  in_execution: "In Execution",
  apostille_processing: "Apostille Processing",
  in_transit: "In Transit",
  delivered: "Delivered",
  completed: "Completed",
};

/**
 * Client-safe projection of a matter. Only fields a client is allowed to see.
 * No margins, no internal notes, no raw Wise payloads, no storage paths.
 */
export interface PortalMatter {
  matterId: string;
  displayId: string;
  clientName: string | null;
  documentType: string | null;
  destinationCountry: string | null;
  status: MatterStatus;
  /** Read-only: whether payment has been confirmed by the platform (server-derived). */
  paymentConfirmed: boolean;
  createdAt: string | null;
  updatedAt: string | null;

  timeline: MatterTimelineEvent[];
  vault: DocumentVaultItem[];
  invoice: InvoiceSummary | null;
  executionChecklist: ExecutionChecklistItem[];
  courierMilestones: CourierMilestone[];
  apostilleMilestones: ApostilleMilestone[];
  ronMilestones: RONMilestone[];
  countryReadiness: CountryReadiness | null;
  finalRelease: FinalReleaseItem[];
  completionCertificate: CompletionCertificateData | null;
}

export interface MatterTimelineEvent {
  id: string;
  status: MatterStatus;
  label: string;
  description: string;
  /** ISO timestamp, or null if the step has not happened yet. */
  timestamp: string | null;
  state: "complete" | "current" | "upcoming";
}

export interface StatusRailState {
  current: MatterStatus;
  currentIndex: number;
  totalSteps: number;
  currentLabel: string;
  /** Client-safe copy describing what happens next. */
  nextStepLabel: string | null;
  nextStepDescription: string;
  /** True when scheduling is gated behind payment (read-only reflection). */
  awaitingPayment: boolean;
  paymentConfirmed: boolean;
  isComplete: boolean;
}

export interface DocumentVaultItem {
  id: string;
  /** Client-facing display name. */
  name: string;
  category: "client_upload" | "executed_document" | "apostille" | "release_packet" | "certificate";
  status: "available" | "processing" | "pending";
  /** ISO date the item became available, or null. */
  availableAt: string | null;
  /** Whether the client may download this item right now. */
  downloadable: boolean;
}

export interface InvoiceSummary {
  invoiceNumber: string | null;
  currency: string;
  amountDue: number;
  amountPaid: number;
  balance: number;
  status: "draft" | "issued" | "partially_paid" | "paid";
  issuedAt: string | null;
  paidAt: string | null;
}

export interface ExecutionChecklistItem {
  id: string;
  label: string;
  description: string;
  state: "complete" | "in_progress" | "pending";
  /** True for steps the client must action (e.g. bring ID). */
  clientAction: boolean;
}

export interface CourierMilestone {
  id: string;
  label: string;
  location: string | null;
  timestamp: string | null;
  state: "complete" | "current" | "upcoming";
}

export interface ApostilleMilestone {
  id: string;
  label: string;
  authority: string | null;
  timestamp: string | null;
  state: "complete" | "current" | "upcoming";
}

export interface RONMilestone {
  id: string;
  label: string;
  timestamp: string | null;
  state: "complete" | "current" | "upcoming";
}

export interface CountryReadiness {
  destinationCountry: string;
  hagueMember: boolean;
  /** Client-safe requirement summaries. */
  requirements: CountryRequirement[];
  /** Non-binding informational note. Never a guarantee of acceptance. */
  note: string;
}

export interface CountryRequirement {
  id: string;
  label: string;
  met: boolean;
}

export interface FinalReleaseItem {
  id: string;
  label: string;
  released: boolean;
  releasedAt: string | null;
  downloadable: boolean;
}

export interface CompletionCertificateData {
  certificateId: string | null;
  matterDisplayId: string;
  clientName: string | null;
  documentType: string | null;
  destinationCountry: string | null;
  completedAt: string | null;
  /** Public verification URL, if issued. */
  verificationUrl: string | null;
  available: boolean;
}
