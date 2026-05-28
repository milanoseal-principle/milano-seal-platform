export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { AdminDispatchQueue, type AdminAssignment } from "@/components/alliance/AdminDispatchQueue";

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

async function getAllAssignments(): Promise<AdminAssignment[]> {
  const admin = createAdminClient();

  const { data: assignments, error } = await admin
    .from("operator_assignments")
    .select(
      `id, assignment_status, dispatch_confirmed, created_at,
       deals!inner (
         deal_id, document_type, destination_country, origin_state,
         deal_status, scheduled_at
       )`,
    )
    .not("assignment_status", "in", '("declined","reassigned","cancelled")')
    .order("created_at", { ascending: false })
    .limit(40);

  if (error || !assignments) return [];

  // Fetch operator names separately to avoid FK ambiguity
  const operatorIds = [...new Set(assignments.map((a) => (a as { operator_id?: string }).operator_id).filter(Boolean))] as string[];
  const { data: operators } = await admin
    .from("operator_profiles")
    .select("id, full_name, firm_name")
    .in("id", operatorIds.length > 0 ? operatorIds : ["_none"]);

  const operatorMap = Object.fromEntries(
    (operators ?? []).map((o) => [o.id, o.firm_name ?? o.full_name ?? null]),
  );

  type DealJoin = {
    deal_id: string | null;
    document_type: string | null;
    destination_country: string | null;
    origin_state: string | null;
    deal_status: string | null;
    scheduled_at: string | null;
  };

  return assignments.map((a) => {
    const dealRaw = Array.isArray(a.deals) ? a.deals[0] : a.deals;
    const deal = (dealRaw as DealJoin) ?? null;
    const raw = a as typeof a & { operator_id?: string };
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
      operator_name: raw.operator_id ? (operatorMap[raw.operator_id] ?? null) : null,
      created_at: a.created_at,
    };
  });
}

export default async function AllianceDispatchPage() {
  await requireDashboardAccess();
  const assignments = await getAllAssignments();

  const offered = assignments.filter((a) => a.assignment_status === "offered").length;
  const active = assignments.filter((a) =>
    ["accepted", "in_progress"].includes(a.assignment_status),
  ).length;
  const completed = assignments.filter((a) => a.assignment_status === "completed").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[11px] uppercase tracking-[0.25em] text-gold font-medium mb-1">
          Alliance Intelligence
        </p>
        <h1 className="font-serif text-3xl text-foreground">
          Alliance Dispatch Queue
        </h1>
        <p className="text-muted-foreground mt-1 max-w-xl text-sm">
          Automated distribution matrix for all dispatched operator assignments.
          Matter-scoped visibility. No client pricing or margin data.
        </p>
      </div>

      {/* Status strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Offered", value: offered, color: "#d4af37" },
          { label: "In Progress", value: active, color: "#60a5fa" },
          { label: "Complete", value: completed, color: "#34d399" },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-sm px-4 py-3"
            style={{
              background: "rgba(8,5,1,0.96)",
              border: "1px solid rgba(212,175,55,0.1)",
            }}
          >
            <div
              className="text-2xl font-light"
              style={{
                fontFamily: "var(--font-playfair),Georgia,serif",
                color: m.color,
              }}
            >
              {m.value}
            </div>
            <div
              className="text-[9px] font-mono uppercase tracking-[0.18em] mt-0.5"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              {m.label}
            </div>
          </div>
        ))}
      </div>

      {/* Queue */}
      <AdminDispatchQueue assignments={assignments} />
    </div>
  );
}
