import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const ALLOWED_ROLES = ["alliance_partner", "operator", "admin"];

// Partner-safe stage labels — internal status names never sent to operators
const STAGE_LABELS: Record<string, string> = {
  new: "Intake Received",
  intake_received: "Under Initial Review",
  under_review: "Under Review",
  compliance_review: "Compliance Review",
  quoted: "Proposal Issued",
  awaiting_payment: "Awaiting Payment Authorization",
  payment_confirmed: "Scheduling in Progress",
  scheduled: "Execution Scheduled",
  in_execution: "Execution Phase",
  apostille_processing: "Apostille Authentication",
  courier_ready: "Ready for Dispatch",
  shipped: "In Transit",
  delivered: "Delivered",
  completed: "Complete",
  closed: "Complete",
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role =
    ((user.user_metadata?.role ?? user.app_metadata?.role) as string) ?? "";
  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();

  // Matter-scoped: only assignments where operator_id = current authenticated user.
  // No cross-operator visibility, no client PII, no financial margins.
  const { data: assignments, error } = await admin
    .from("operator_assignments")
    .select(
      `id, deal_id, assignment_status, dispatch_confirmed, notes, created_at,
       deals!inner (
         deal_id, document_type, destination_country, origin_state,
         deal_status, scheduled_at
       )`,
    )
    .eq("operator_id", user.id)
    .not("assignment_status", "in", '("declined","reassigned","cancelled")')
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }

  type DealJoin = {
    deal_id: string | null;
    document_type: string | null;
    destination_country: string | null;
    origin_state: string | null;
    deal_status: string | null;
    scheduled_at: string | null;
  };

  const jobs = (assignments ?? []).map((a) => {
    const dealRaw = Array.isArray(a.deals) ? a.deals[0] : a.deals;
    const deal = (dealRaw as DealJoin) ?? null;
    return {
      assignment_id: a.id,
      deal_ref: deal?.deal_id ?? null,
      document_type: deal?.document_type ?? null,
      destination_country: deal?.destination_country ?? null,
      origin_state: deal?.origin_state ?? null,
      stage_label: STAGE_LABELS[deal?.deal_status ?? ""] ?? "In Progress",
      assignment_status: a.assignment_status,
      dispatch_confirmed: a.dispatch_confirmed,
      scheduled_at: deal?.scheduled_at ?? null,
      created_at: a.created_at,
    };
  });

  return NextResponse.json({ jobs });
}
