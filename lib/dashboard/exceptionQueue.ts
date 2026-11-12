import type { SupabaseClient } from "@supabase/supabase-js";

// Operator Exception Center read model. Shared by the API route and the server page so the
// page never fetches its own API without the operator's session (which always failed and
// rendered zero exceptions). A panel whose query fails is reported in `unavailable`.
export async function loadExceptionQueue(supabase: SupabaseClient) {
  let payment_mismatch: object[] = [];
  let partial_payments: object[] = [];
  let missing_documents: object[] = [];
  let address_review: object[] = [];
  let ron_failures: object[] = [];
  let courier_exceptions: object[] = [];
  let delivered_not_released: object[] = [];
  let overdue_tasks: object[] = [];
  let escalated_tasks: object[] = [];
  let translation_required: object[] = [];
  // A panel whose query fails is reported as unavailable, never as zero exceptions.
  const unavailable: string[] = [];
  const rows = <T,>(panel: string, result: { data: T[] | null; error: unknown }): T[] => {
    if (result.error) unavailable.push(panel);
    return result.data ?? [];
  };

  // Payment mismatch: deals where amount_paid doesn't match amount_due
  try {
    const data = rows("payment_mismatch", await supabase
      .from("deals")
      .select("id, display_id:deal_id, amount_due, amount_paid, deal_status")
      .not("deal_status", "in", '("cancelled","completed","paid_and_released")')
      .not("amount_due", "is", null)
      .not("amount_paid", "is", null));
    payment_mismatch = data.filter(
      (r: { amount_due?: number; amount_paid?: number }) =>
        r.amount_due != null &&
        r.amount_paid != null &&
        r.amount_paid > 0 &&
        Math.abs((r.amount_due ?? 0) - (r.amount_paid ?? 0)) > 0.5
    );
  } catch { /* recorded via unavailable */ }

  // Partial payments: amount_paid > 0 but < amount_due
  try {
    const data = rows("partial_payments", await supabase
      .from("deals")
      .select("id, display_id:deal_id, amount_due, amount_paid")
      .not("amount_due", "is", null)
      .gt("amount_paid", 0));
    partial_payments = data.filter(
      (r: { amount_due?: number; amount_paid?: number }) =>
        r.amount_paid != null &&
        r.amount_due != null &&
        (r.amount_paid ?? 0) < (r.amount_due ?? 0)
    );
  } catch { /* recorded via unavailable */ }

  // Missing documents
  try {
    missing_documents = rows("missing_documents", await supabase
      .from("deal_documents")
      .select("id, display_id, document_type, destination_country")
      .eq("status", "missing")
      .limit(50));
  } catch { /* recorded via unavailable */ }

  // Address review: va_tasks where task_type='courier_review' and status='BLOCKED'
  try {
    address_review = rows("address_review", await supabase
      .from("va_tasks")
      .select("id, matter_id, next_action, due_at")
      // va_tasks allows task_type courier_confirmation and status review (003_va_tasks).
      .eq("task_type", "courier_confirmation")
      .eq("status", "review")
      .limit(50));
  } catch { /* recorded via unavailable */ }

  // RON failures
  try {
    // Provider identity outcomes are recorded per check; any FAILED check is a RON failure.
    ron_failures = rows("ron_failures", await supabase
      .from("ron_sessions")
      .select("id, matter_id, failure_type:exception_reason, identity_status, kba_status, biometric_status, created_at")
      .or("identity_status.eq.FAILED,kba_status.eq.FAILED,biometric_status.eq.FAILED")
      .order("created_at", { ascending: false })
      .limit(50));
  } catch { /* recorded via unavailable */ }

  // Courier exceptions
  try {
    courier_exceptions = rows("courier_exceptions", await supabase
      .from("shippo_tracking_events")
      .select("id, matter_id, status, status_details, status_date")
      // Written via mapShippoTrackingStatus: carrier failures are EXCEPTION, returns RETURNED.
      .in("status", ["EXCEPTION", "RETURNED"])
      .limit(50));
  } catch { /* recorded via unavailable */ }

  // Delivered but not released
  try {
    delivered_not_released = rows("delivered_not_released", await supabase
      .from("deals")
      .select("id, display_id:deal_id, deal_status")
      .eq("deal_status", "delivered")
      .or("is_paid_and_released.is.null,is_paid_and_released.eq.false")
      .limit(50));
  } catch { /* recorded via unavailable */ }

  // Overdue tasks
  try {
    overdue_tasks = rows("overdue_tasks", await supabase
      .from("va_tasks")
      .select("id, matter_id, task_type, due_at")
      .lt("due_at", new Date().toISOString())
      .not("status", "in", '("completed","cancelled")')
      .limit(50));
  } catch { /* recorded via unavailable */ }

  // Escalated tasks
  try {
    escalated_tasks = rows("escalated_tasks", await supabase
      .from("va_tasks")
      .select("id, matter_id, task_type, next_action, escalated_at")
      .eq("status", "escalated")
      .limit(50));
  } catch { /* recorded via unavailable */ }

  // Translation required
  try {
    // deals.translation flags a Matter that needs translation; open Matters only.
    translation_required = rows("translation_required", await supabase
      .from("deals")
      .select("id, display_id:deal_id, destination_country")
      .eq("translation", true)
      .not("deal_status", "in", '("cancelled","completed","paid_and_released")')
      .limit(50));
  } catch { /* recorded via unavailable */ }

  const critical =
    ron_failures.length +
    delivered_not_released.length +
    payment_mismatch.length;
  const review =
    address_review.length + overdue_tasks.length + escalated_tasks.length;
  const total =
    payment_mismatch.length +
    partial_payments.length +
    missing_documents.length +
    address_review.length +
    ron_failures.length +
    courier_exceptions.length +
    delivered_not_released.length +
    overdue_tasks.length +
    escalated_tasks.length +
    translation_required.length;

  return {
    exceptions: {
      payment_mismatch,
      partial_payments,
      missing_documents,
      address_review,
      ron_failures,
      courier_exceptions,
      delivered_not_released,
      overdue_tasks,
      escalated_tasks,
      translation_required,
    },
    summary: { total, critical, review },
    // Panels whose source could not be read; their empty lists are not evidence of no exceptions.
    unavailable,
  };
}
