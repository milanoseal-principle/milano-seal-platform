export type MilanoLane = "signature" | "priority" | "executive" | "custom_review";
export type PaymentMode = "full_upfront" | "split_50_50";
export type PaymentType = "deposit" | "final_balance" | "full_payment";
export type PaymentStatus = "unpaid" | "pending" | "deposit_paid" | "paid" | "mismatch_review";
export type ReleaseStatus = "locked" | "ready_for_release" | "released";
export type MatterStatus =
  | "intake_received"
  | "under_review"
  | "quote_generated"
  | "awaiting_payment"
  | "payment_pending_review"
  | "deposit_paid"
  | "scheduling_unlocked"
  | "scheduled"
  | "in_execution"
  | "ron_completed"
  | "apostille_processing"
  | "apostille_received"
  | "final_payment_required"
  | "final_paid"
  | "ready_for_release"
  | "shipped"
  | "delivered"
  | "completed"
  | "lost"
  | "dormant";

export type EventType =
  | "INTAKE_CREATED"
  | "MATTER_CREATED"
  | "SMART_REQUEST_PARSED"
  | "COMPLIANCE_VERIFIED"
  | "PORTAL_LINK_CREATED"
  | "QUOTE_GENERATED"
  | "INVOICE_SENT"
  | "DISCOUNT_APPLIED"
  | "DISCOUNT_REJECTED"
  | "DISCOUNT_REMOVED"
  | "DISCOUNT_REQUEST_CREATED"
  | "DISCOUNT_REQUEST_APPROVED"
  | "DISCOUNT_REQUEST_DENIED"
  | "PAYMENT_INSTRUCTIONS_SENT"
  | "WISE_PAYMENT_PENDING"
  | "WISE_PAYMENT_CONFIRMED"
  | "MANUAL_PAYMENT_CONFIRMED"
  | "PAYMENT_MISMATCH_FLAGGED"
  | "DEPOSIT_CONFIRMED"
  | "FINAL_PAYMENT_CONFIRMED"
  | "SCHEDULING_UNLOCKED"
  | "RELEASE_UNLOCKED"
  | "EXECUTION_SCHEDULED"
  | "EXECUTION_STARTED"
  | "RON_COMPLETED"
  | "EXECUTION_COMPLETED"
  | "EXECUTION_FAILED"
  | "APOSTILLE_SUBMITTED"
  | "APOSTILLE_PROCESSING"
  | "APOSTILLE_RECEIVED"
  | "APOSTILLE_REJECTED"
  | "FINAL_PAYMENT_REQUESTED"
  | "READY_FOR_RELEASE"
  | "FINAL_PACKET_ASSEMBLED"
  | "TRACKING_ADDED"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "REVIEW_REQUESTED"
  | "LOST"
  | "DORMANT"
  | "FOLLOWUP_STOPPED";

export interface MilanoMatterLike {
  id?: string;
  matter_reference?: string;
  portal_token?: string;
  client_id?: string;
  status?: MatterStatus | string;
  payment_status?: PaymentStatus | string;
  release_status?: ReleaseStatus | string;
  lane?: MilanoLane | string;
  document_type?: string;
  destination_country?: string;
  origin_state?: string;
  original_total?: number;
  discount_code?: string | null;
  discount_type?: string | null;
  discount_value?: number | null;
  discount_amount?: number;
  final_total?: number;
  deposit_required?: boolean;
  deposit_amount?: number;
  deposit_paid_amount?: number;
  balance_due?: number;
  amount_received?: number;
  payment_reference?: string;
  payment_mismatch_flag?: boolean;
}

export interface IntakePayload {
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  firm_name?: string;
  client_type?: string;
  document_type?: string;
  document_description?: string;
  destination_country?: string;
  origin_state?: string;
  signer_location?: string;
  document_count?: number;
  signer_count?: number;
  notarized_signature_count?: number;
  execution_type?: string;
  apostille_required?: boolean | "yes" | "no" | "unsure";
  translation_required?: boolean | "yes" | "no" | "unsure";
  deadline_date?: string;
  urgency?: string;
  referral_source?: string;
  landing_page_source?: string;
  terms_version?: string;
}
