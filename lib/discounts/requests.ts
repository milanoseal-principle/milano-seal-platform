// Discount request service — partner/alliance intake + operator approval.
//
// This is the additive layer the existing engine lacked. It writes ONLY to the
// new discount_requests table plus the audit ledger. It does NOT touch
// discount_codes, matters, payment status, or the release gate.
//
// Applying an approved discount to a matter (and any payment-clear) continues to
// go through the existing, audited src/features/discounts/discountService.ts.

import { createAdminClient } from "@/lib/supabase/admin";
import { recordDiscountAuditEvent } from "./audit";
import type {
  CreateDiscountRequestInput,
  DiscountRequest,
} from "./types";

export async function createDiscountRequest(
  input: CreateDiscountRequestInput,
): Promise<DiscountRequest> {
  const supabase = createAdminClient();
  const value = Math.max(0, Number(input.discountValue) || 0);
  // A comp request is a full waiver; normalize its stored value to 100.
  const normalizedValue = input.discountType === "comp" ? 100 : value;

  const { data, error } = await supabase
    .from("discount_requests")
    .insert({
      requested_by: input.requestedBy ?? null,
      requested_by_role: input.requestedByRole ?? null,
      partner_id: input.partnerId ?? null,
      matter_id: input.matterId ?? null,
      client_email: input.clientEmail ?? null,
      requested_code: input.requestedCode ?? null,
      discount_type: input.discountType,
      discount_value: normalizedValue,
      reason: input.reason ?? null,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) throw error;

  await recordDiscountAuditEvent({
    eventType: "DISCOUNT_REQUEST_CREATED",
    matterId: input.matterId ?? null,
    actorEmail: input.requestedBy ?? null,
    metadata: {
      discount_type: input.discountType,
      discount_value: normalizedValue,
      partner_id: input.partnerId ?? null,
    },
  });

  return data as DiscountRequest;
}

export async function listDiscountRequests(matterId?: string): Promise<DiscountRequest[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("discount_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (matterId) query = query.eq("matter_id", matterId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as DiscountRequest[];
}

// Approve or deny a request. `compApproved` is set true ONLY by the caller after
// it has verified canApproveComp for a comp request — this function does not
// itself re-check permissions (the route does) but records the decision + audit.
export async function reviewDiscountRequest(input: {
  id: string;
  decision: "approved" | "denied";
  reviewedBy: string | null;
  reviewNote?: string | null;
  compApproved?: boolean;
}): Promise<DiscountRequest> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("discount_requests")
    .update({
      status: input.decision,
      reviewed_by: input.reviewedBy,
      reviewed_at: new Date().toISOString(),
      review_note: input.reviewNote ?? null,
      comp_approved: input.decision === "approved" ? Boolean(input.compApproved) : false,
    })
    .eq("id", input.id)
    .select("*")
    .single();

  if (error) throw error;
  const req = data as DiscountRequest;

  await recordDiscountAuditEvent({
    eventType:
      input.decision === "approved" ? "DISCOUNT_REQUEST_APPROVED" : "DISCOUNT_REQUEST_DENIED",
    matterId: req.matter_id,
    actorEmail: input.reviewedBy,
    metadata: {
      request_id: req.id,
      discount_type: req.discount_type,
      discount_value: req.discount_value,
      comp_approved: req.comp_approved,
    },
  });

  return req;
}
