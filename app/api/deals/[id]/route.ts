import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { resolveServerRole } from "@/lib/auth/server-role";
import { logActivity } from "@/lib/activity";
import { serializeDealMS } from "@/lib/milanoSerialize";
import { revalidatePath } from "next/cache";

const DEAL_API_ROLES = new Set([
  "founder",
  "founder_admin",
  "admin",
  "admin_operator",
  "ops_manager",
  "finance",
  "finance_operator",
  "execution_coordinator",
  "apostille_coordinator",
  "client_support",
  "virtual_assistant",
]);

// Canonical Wise settlement is owned by the governed payment/reconciliation path.
// The generic Matter detail endpoint must never create, downgrade, refund, dispute,
// or otherwise author payment truth.
const PAYMENT_FIELDS = new Set([
  "payment_status",
  "payment_method",
  "payment_confirmed",
  "payment_amount_received",
  "amount_paid",
  "payment_reference",
  "wise_reference",
  "payment_failure_reason",
  "payment_failed_at",
  "balance_payment_status",
  "balance_paid_at",
  "refund_amount",
  "refunded_at",
  "dispute_reason",
  "disputed_at",
  "invoice_status",
]);

// These fields are evidence-bearing lifecycle truth owned by the canonical state
// machine, scheduling/execution, apostille/authentication, custody/release and
// carrier/delivery paths. A generic PATCH may not synthesize them.
const PROTECTED_LIFECYCLE_FIELDS = new Set([
  "status",
  "execution_date",
  "scheduled_at",
  "schedule_at",
  "execution_at",
  "executed_at",
  "apostille_at",
  "apostille_status",
  "shipped_at",
  "tracking_number",
  "carrier",
  "delivery_status",
  "delivery_at",
  "delivered_at",
  "release_verified",
  "is_paid_and_released",
  "completed_at",
]);

const PROTECTED_LIFECYCLE_STATUSES = new Set([
  "intake_received",
  "under_review",
  "needs_client_info",
  "document_correction_required",
  "quoted",
  "awaiting_deposit",
  "deposit_pending_review",
  "deposit_confirmed",
  "scheduling_unlocked",
  "scheduled",
  "in_execution",
  "ron_completed",
  "execution_qa",
  "apostille_packet_ready",
  "apostille_submitted",
  "apostille_processing",
  "apostille_received",
  "apostille_rejected",
  "final_balance_due",
  "final_payment_pending_review",
  "final_payment_confirmed",
  "ready_for_release",
  "final_packet_assembled",
  "label_created",
  "in_transit",
  "customs_watch",
  "out_for_delivery",
  "delivered",
  "completed",
  "dormant",
  "lost",
  "cancelled",
]);

const GENERIC_METADATA_FIELDS = [
  "followup_24h",
  "followup_72h",
  "follow_up_active",
  "decline_risk",
  "assignee",
  "notes",
] as const;

function suppliedFields(body: Record<string, unknown>, fields: Set<string>) {
  return [...fields].filter((field) => Object.prototype.hasOwnProperty.call(body, field));
}

async function requireDealApiAccess() {
  const ssr = await createClient();
  const {
    data: { user },
  } = await ssr.auth.getUser();

  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 }),
    };
  }

  const role = await resolveServerRole(user);
  if (!DEAL_API_ROLES.has(role)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }),
    };
  }

  return {
    ok: true as const,
    actor: user.email ?? user.id,
    role,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const access = await requireDealApiAccess();
    if (!access.ok) return access.response;

    const { id } = await params;
    const supabase = createAdminClient();

    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      );

    const { data: deal, error } = await supabase
      .from("deals")
      .select("*")
      .eq(isUuid ? "id" : "deal_id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Deal not found" }, { status: 404 });
      }
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch deal" },
        { status: 500 },
      );
    }

    return NextResponse.json(serializeDealMS(deal));
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const access = await requireDealApiAccess();
    if (!access.ok) return access.response;

    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const supabase = createAdminClient();

    const paymentFields = suppliedFields(body, PAYMENT_FIELDS);
    if (paymentFields.length > 0) {
      return NextResponse.json(
        {
          error: "PAYMENT_MUTATION_GOVERNED_PATH_REQUIRED",
          message: "Wise settlement and payment lifecycle changes must use the canonical payment/reconciliation path.",
          protectedFields: paymentFields,
        },
        { status: 409 },
      );
    }

    const lifecycleFields = suppliedFields(body, PROTECTED_LIFECYCLE_FIELDS);
    if (lifecycleFields.length > 0) {
      const requestedStatus = typeof body.status === "string" ? body.status : null;
      return NextResponse.json(
        {
          error: "GOVERNED_LIFECYCLE_MUTATION_REQUIRED",
          message: "Matter state, scheduling, execution, apostille/authentication, shipment, delivery, release and completion truth must use their governed owning paths.",
          protectedFields: lifecycleFields,
          protectedStatus: requestedStatus && PROTECTED_LIFECYCLE_STATUSES.has(requestedStatus) ? requestedStatus : null,
        },
        { status: 409 },
      );
    }

    const updateData: Record<string, unknown> = {};
    for (const field of GENERIC_METADATA_FIELDS) {
      if (body[field] !== undefined) updateData[field] = body[field];
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    const { data: deal, error } = await supabase
      .from("deals")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Deal not found" }, { status: 404 });
      }
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to update deal" },
        { status: 500 },
      );
    }

    void (async () => {
      try {
        const actor = access.actor;
        const dealRef = (deal?.deal_id as string) ?? id;

        if (updateData.assignee !== undefined) {
          await logActivity({
            deal_id: dealRef,
            actor,
            action: "assignee_changed",
            detail: `Assigned to ${updateData.assignee || "unassigned"}`,
            meta: { assignee: updateData.assignee },
          });
        }

        if (updateData.notes !== undefined) {
          await logActivity({
            deal_id: dealRef,
            actor,
            action: "note_added",
            detail: "Notes updated",
          });
        }
      } catch (logErr) {
        console.error("[activity] PATCH log failed:", logErr);
      }
    })();

    const dealRef = (deal?.deal_id as string) ?? id;
    revalidatePath("/dashboard/deals");
    revalidatePath(`/dashboard/deals/${dealRef}`);

    return NextResponse.json({ deal });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
