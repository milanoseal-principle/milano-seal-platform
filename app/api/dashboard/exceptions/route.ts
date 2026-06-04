import { NextResponse } from "next/server";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireDashboardAccess();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

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

  // Payment mismatch: deals where amount_paid doesn't match amount_due
  try {
    const { data } = await supabase
      .from("deals")
      .select("id, display_id, amount_due, amount_paid, deal_status")
      .not("deal_status", "in", '("cancelled","completed","paid_and_released")')
      .not("amount_due", "is", null)
      .not("amount_paid", "is", null);
    payment_mismatch = (data ?? []).filter(
      (r: { amount_due?: number; amount_paid?: number }) =>
        r.amount_due != null &&
        r.amount_paid != null &&
        r.amount_paid > 0 &&
        Math.abs((r.amount_due ?? 0) - (r.amount_paid ?? 0)) > 0.5
    );
  } catch {}

  // Partial payments: amount_paid > 0 but < amount_due
  try {
    const { data } = await supabase
      .from("deals")
      .select("id, display_id, amount_due, amount_paid")
      .not("amount_due", "is", null)
      .gt("amount_paid", 0);
    partial_payments = (data ?? []).filter(
      (r: { amount_due?: number; amount_paid?: number }) =>
        r.amount_paid != null &&
        r.amount_due != null &&
        (r.amount_paid ?? 0) < (r.amount_due ?? 0)
    );
  } catch {}

  // Missing documents
  try {
    const { data } = await supabase
      .from("deal_documents")
      .select("id, display_id, document_type, destination_country")
      .eq("status", "missing")
      .limit(50);
    missing_documents = data ?? [];
  } catch {}

  // Address review: va_tasks where task_type='courier_review' and status='BLOCKED'
  try {
    const { data } = await supabase
      .from("va_tasks")
      .select("id, display_id, matter_id")
      .eq("task_type", "courier_review")
      .eq("status", "BLOCKED")
      .limit(50);
    address_review = data ?? [];
  } catch {}

  // RON failures
  try {
    const { data } = await supabase
      .from("ron_sessions")
      .select("id, matter_id, failure_type, created_at")
      .in("status", ["kba_failed", "id_failed"])
      .order("created_at", { ascending: false })
      .limit(50);
    ron_failures = data ?? [];
  } catch {}

  // Courier exceptions
  try {
    const { data } = await supabase
      .from("shippo_tracking_events")
      .select("id, matter_id, tracking_status")
      .in("status", ["failure", "exception"])
      .limit(50);
    courier_exceptions = data ?? [];
  } catch {}

  // Delivered but not released
  try {
    const { data } = await supabase
      .from("deals")
      .select("id, display_id, deal_status")
      .eq("deal_status", "delivered")
      .neq("release_status", "released")
      .limit(50);
    delivered_not_released = data ?? [];
  } catch {}

  // Overdue tasks
  try {
    const { data } = await supabase
      .from("va_tasks")
      .select("id, matter_id, task_type, due_at")
      .lt("due_at", new Date().toISOString())
      .not("status", "in", '("complete","cancelled")')
      .limit(50);
    overdue_tasks = data ?? [];
  } catch {}

  // Escalated tasks
  try {
    const { data } = await supabase
      .from("va_tasks")
      .select("id, matter_id, title, escalation_reason")
      .eq("status", "escalated")
      .limit(50);
    escalated_tasks = data ?? [];
  } catch {}

  // Translation required
  try {
    const { data } = await supabase
      .from("deals")
      .select("id, display_id, destination_country")
      .eq("needs_translation", true)
      .neq("translation_status", "complete")
      .limit(50);
    translation_required = data ?? [];
  } catch {}

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

  return NextResponse.json({
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
  });
}
