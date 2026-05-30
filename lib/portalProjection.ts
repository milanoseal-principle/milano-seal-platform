// Portal-safe projection — defines what operator data can safely surface in the client portal.
// Operators see full deal records. Portal actors see only this subset.

export interface PortalSafeMatter {
  id: string;
  status: string;
  payment_status: string | null;
  service_type: string | null;
  destination_country: string | null;
  total_price: number | null;
  courier_tracking_id: string | null;
  is_paid_and_released: boolean;
  // Deliberately absent: internal notes, Wise refs, operator ledger, admin actions, revenue metrics
}

export function projectMatterForPortal(deal: {
  id: string;
  status?: string | null;
  payment_status?: string | null;
  service_type?: string | null;
  destination_country?: string | null;
  total_price?: number | null;
  courier_tracking_id?: string | null;
}): PortalSafeMatter {
  return {
    id: deal.id,
    status: deal.status ?? "new",
    payment_status: deal.payment_status ?? null,
    service_type: deal.service_type ?? null,
    destination_country: deal.destination_country ?? null,
    total_price: deal.total_price ?? null,
    courier_tracking_id: deal.courier_tracking_id ?? null,
    is_paid_and_released:
      deal.payment_status === "paid" && deal.status === "completed",
  };
}

// These fields must NEVER appear in portal-facing API responses:
export const PORTAL_BLOCKED_FIELDS = [
  // Payment internals
  "wise_reference",
  "wise_transfer_id",
  "wise_account_id",
  "stripe_payment_intent_id",
  "stripe_customer_id",
  // Internal notes
  "internal_notes",
  "operator_notes",
  "admin_notes",
  "compliance_notes",
  "risk_notes",
  // Revenue / margin
  "total_revenue",
  "base_cost",
  "shipping_cost",
  "net_margin",
  "margin",
  "operator_fee",
  "runner_fee",
  "markup",
  // Assignment / routing internals
  "assignee",
  "assignee_user_id",
  "runner_id",
  "operator_id",
  "dispatch_id",
  // Risk / compliance internals
  "risk_score",
  "compliance_flag",
  "compliance_override",
  "review_reason",
  // Storage paths (signed URLs only)
  "storage_path",
  "file_path",
  "evidence_path",
  "label_url",
  "evidence_url",
  // Audit / admin structures
  "audit_logs",
  "admin_actions",
  "admin_overrides",
  "event_log",
  // Raw contact / personal data beyond client's own
  "email",
  "phone",
  "ship_to",
] as const;
