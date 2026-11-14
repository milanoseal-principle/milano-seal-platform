import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireOperatorApiAccess } from "@/lib/auth/operatorApiAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GROUPS = [
  { id: "matter", label: "Matter", actions: ["Matter Registry", "Create Matter", "Review Active Matter", "Intake Review", "Matter Pipeline"] },
  { id: "financial", label: "Financial", actions: ["Payment Gate", "Invoice Studio", "Wise Reconciliation", "Open Balances", "Confirmed Payments"] },
  { id: "execution", label: "Execution", actions: ["Schedule Execution", "Execution Checklist", "Signing Room", "Apostille Queue", "Release Desk"] },
  { id: "courier", label: "Courier Custody", actions: ["Custody Rail", "Validate Address", "Preview Rates", "Purchase Label", "Delivered Not Released"] },
  { id: "documents", label: "Documents", actions: ["The Vault", "Upload Documents", "Review Documents", "Certificate Library", "Release Certificate"] },
  { id: "intelligence", label: "Intelligence", actions: ["Global Document Intelligence", "Atlas", "Compliance Matrix", "Authority Graph", "Receiving Authority Review", "Execution DNA", "Institutional Memory", "Truth Engine"] },
  { id: "alliance", label: "Alliance / Revenue", actions: ["Alliance Desk", "Referral Ledger", "Partner Registry", "Revenue Desk", "Relationship Graph"] },
  { id: "operations", label: "Operations", actions: ["Operations Desk", "VA Task Queue", "Operational Ledger", "Launch Control", "Control Room", "Admin Validator"] },
];

const unavailable = () => NextResponse.json({ error: "QUICK_ACTION_DATA_UNAVAILABLE", summary: null }, { status: 503 });

// GET — badge counts for the operator quick-action menu.
// Access comes from the authoritative operator guard (there is no profiles table). Every number
// is an exact database count; a failed count is reported as unavailable, never as zero.
export async function GET() {
  const access = await requireOperatorApiAccess();
  if (!access.ok) return access.response;

  try {
    const admin = createAdminClient();
    const matters = (statuses: string[]) => admin.from("deals").select("id", { count: "exact", head: true }).in("deal_status", statuses);

    const [actionRequired, blocked, reviewRequired, ready, deliveredNotReleased, vaOpen, vaOverdue] = await Promise.all([
      matters(["awaiting_payment", "payment_failed", "intake_review"]),
      matters(["on_hold", "blocked", "cancelled"]),
      matters(["reviewing", "compliance_review", "trust_review"]),
      matters(["open", "scheduled", "in_execution", "apostille", "shipped", "completed"]),
      admin.from("deals").select("id", { count: "exact", head: true }).eq("deal_status", "delivered").or("release_status.is.null,release_status.neq.released"),
      // VA task states and due_at as defined by the VA task ledger (20261112120000).
      admin.from("va_tasks").select("id", { count: "exact", head: true }).in("status", ["pending", "in_progress", "review", "escalated"]),
      admin.from("va_tasks").select("id", { count: "exact", head: true }).lt("due_at", new Date().toISOString()).not("status", "in", "(completed,cancelled)"),
    ]);

    const matterCounts = [actionRequired, blocked, reviewRequired, ready, deliveredNotReleased];
    if (matterCounts.some((result) => result.error || result.count === null)) return unavailable();

    // The VA task ledger may not be deployed yet. Matter counts are still reported; the VA
    // counts are null and flagged, so the menu shows no VA badge instead of a false zero.
    const vaTasksAvailable = !vaOpen.error && !vaOverdue.error && vaOpen.count !== null && vaOverdue.count !== null;

    return NextResponse.json({
      summary: {
        actionRequiredCount: actionRequired.count,
        blockedCount: blocked.count,
        reviewRequiredCount: reviewRequired.count,
        readyCount: ready.count,
        deliveredNotReleasedCount: deliveredNotReleased.count,
        vaTaskCount: vaTasksAvailable ? vaOpen.count : null,
        overdueVaTaskCount: vaTasksAvailable ? vaOverdue.count : null,
        vaTasksAvailable,
        no_data: false,
      },
      groups: GROUPS,
      role: access.role,
      matterContext: null,
    });
  } catch {
    return unavailable();
  }
}
