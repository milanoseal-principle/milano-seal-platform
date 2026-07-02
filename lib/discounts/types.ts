// Discount request/approval types (partner/alliance intake workflow).
// These sit alongside the existing DiscountCode types in lib/discountCodes.ts;
// they do not replace them.

export type DiscountRequestType = "percent" | "fixed" | "comp";
export type DiscountRequestStatus = "pending" | "approved" | "denied" | "cancelled";

export interface DiscountRequest {
  id: string;
  requested_by: string | null;
  requested_by_role: string | null;
  partner_id: string | null;
  matter_id: string | null;
  client_email: string | null;
  requested_code: string | null;
  discount_type: DiscountRequestType;
  discount_value: number;
  reason: string | null;
  status: DiscountRequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  comp_approved: boolean;
  created_at: string;
}

export interface CreateDiscountRequestInput {
  requestedBy?: string | null;
  requestedByRole?: string | null;
  partnerId?: string | null;
  matterId?: string | null;
  clientEmail?: string | null;
  requestedCode?: string | null;
  discountType: DiscountRequestType;
  discountValue: number;
  reason?: string | null;
}
