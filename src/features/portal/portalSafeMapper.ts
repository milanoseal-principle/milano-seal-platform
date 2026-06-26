import type { MilanoMatterLike } from "@/src/features/milano/types";

export function toPortalSafeMatter(matter: MilanoMatterLike & Record<string, unknown>) {
  return {
    matter_reference: matter.matter_reference,
    portal_token: matter.portal_token,
    status: matter.status,
    payment_status: matter.payment_status,
    release_status: matter.release_status,
    lane: matter.lane,
    document_type: matter.document_type,
    destination_country: matter.destination_country,
    origin_state: matter.origin_state,
    original_total: matter.original_total,
    discount_code: matter.discount_code,
    discount_amount: matter.discount_amount,
    final_total: matter.final_total,
    deposit_required: matter.deposit_required,
    deposit_amount: matter.deposit_amount,
    deposit_paid_amount: matter.deposit_paid_amount,
    balance_due: matter.balance_due,
    payment_method: matter.payment_method,
    payment_reference: matter.payment_reference,
  };
}
