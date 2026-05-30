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
  "wise_reference",
  "wise_transfer_id",
  "internal_notes",
  "operator_notes",
  "assignee",
  "total_revenue",
  "margin",
  "audit_logs",
  "admin_actions",
] as const;
