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
  wise_reference: string | null;
  wise_payment_url: string | null;
  payment_confirmed: boolean;
  amount_due: number | null;
  currency: string | null;
  paid_at: string | null;
  invoice_status: string | null;
  is_platform_fee_only: boolean;
  original_total: number | null;
  discount_amount: number;
  discount_value: number | null;
  final_total: number | null;
  courtesy_applied: boolean;
  courtesy_label: string | null;
}

export function projectMatterForPortal(deal: {
  id: string;
  status?: string | null;
  payment_status?: string | null;
  service_type?: string | null;
  destination_country?: string | null;
  total_price?: number | null;
  courier_tracking_id?: string | null;
  wise_reference?: string | null;
  wise_payment_url?: string | null;
  payment_link?: string | null;
  payment_confirmed?: boolean | null;
  amount_due?: number | null;
  payment_amount_due?: number | null;
  currency?: string | null;
  paid_at?: string | null;
  invoice_status?: string | null;
  discount_type?: string | null;
  service_fee_waived?: boolean | null;
  original_total?: number | null;
  discount_code?: string | null;
  discount_value?: number | null;
  discount_amount?: number | null;
  final_total?: number | null;
}): PortalSafeMatter {
  const discountAmount = Number(deal.discount_amount ?? 0);
  const courtesyApplied =
    Boolean(deal.discount_code) && Number.isFinite(discountAmount) && discountAmount > 0;

  return {
    id: deal.id,
    status: deal.status ?? "new",
    payment_status: deal.payment_status ?? null,
    service_type: deal.service_type ?? null,
    destination_country: deal.destination_country ?? null,
    total_price: deal.total_price ?? deal.final_total ?? null,
    courier_tracking_id: deal.courier_tracking_id ?? null,
    is_paid_and_released:
      deal.payment_status === "paid" && deal.status === "completed",
    wise_reference: deal.wise_reference ?? null,
    wise_payment_url: deal.wise_payment_url ?? deal.payment_link ?? null,
    payment_confirmed:
      deal.payment_confirmed ?? deal.payment_status === "paid",
    amount_due:
      deal.amount_due ??
      deal.payment_amount_due ??
      deal.final_total ??
      deal.total_price ??
      null,
    currency: deal.currency ?? "USD",
    paid_at: deal.paid_at ?? null,
    invoice_status: deal.invoice_status ?? null,
    is_platform_fee_only:
      deal.discount_type === "platform_fee_only" ||
      deal.service_fee_waived === true,
    original_total: deal.original_total ?? null,
    discount_amount: Number.isFinite(discountAmount) ? discountAmount : 0,
    discount_value: deal.discount_value ?? null,
    final_total: deal.final_total ?? null,
    courtesy_applied: courtesyApplied,
    courtesy_label: courtesyApplied ? "Professional courtesy" : null,
  };
}

export const PORTAL_BLOCKED_FIELDS = [
  "wise_transfer_id",
  "wise_account_id",
  "wise_payload",
  "stripe_payment_intent_id",
  "stripe_customer_id",
  "internal_notes",
  "operator_notes",
  "admin_notes",
  "compliance_notes",
  "risk_notes",
  "total_revenue",
  "base_cost",
  "shipping_cost",
  "net_margin",
  "margin",
  "operator_fee",
  "runner_fee",
  "markup",
  "assignee",
  "assignee_user_id",
  "runner_id",
  "operator_id",
  "dispatch_id",
  "risk_score",
  "compliance_flag",
  "compliance_override",
  "review_reason",
  "storage_path",
  "file_path",
  "evidence_path",
  "label_url",
  "evidence_url",
  "full_signing_url",
  "bn_signing_url",
  "audit_logs",
  "admin_actions",
  "admin_overrides",
  "event_log",
  "email",
  "phone",
  "ship_to",
  // Courtesy code itself remains internal; portal receives only safe derived courtesy fields.
  "discount_code",
] as const;
