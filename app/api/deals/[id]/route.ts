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
    const body = await request.json();
    const supabase = createAdminClient();

    const validStatuses = [
      "new",
      "reviewing",
      "quoted",
      "awaiting_payment",
      "apostille",
      "shipped",
      "completed",
      "lost",
    ];
    if (body.status && !validStatuses.includes(body.status)) {
      const protectedTransition =
        body.status === "scheduled" || body.status === "in_execution";
      return NextResponse.json(
        {
          error: protectedTransition
            ? "PROTECTED_STATE_TRANSITION"
            : "Invalid status",
          message: protectedTransition
            ? "Scheduling and execution must use their governed server routes."
            : undefined,
        },
        { status: protectedTransition ? 409 : 400 },
      );
    }

    // Payment settlement is server-authoritative. The generic operator/client
    // PATCH route may never create a paid state or mutate settlement evidence.
    if (
      body.payment_status === "paid" ||
      body.payment_confirmed === true ||
      body.payment_amount_received !== undefined ||
      body.amount_paid !== undefined ||
      body.payment_reference !== undefined
    ) {
      return NextResponse.json(
        {
          error: "PAYMENT_CONFIRMATION_SERVER_ONLY",
          message:
            "Wise settlement must be confirmed by the canonical server reconciliation path.",
        },
        { status: 409 },
      );
    }

    const validPaymentStatuses = ["unpaid", "partial", "failed", "refunded"];
    if (
      body.payment_status &&
      !validPaymentStatuses.includes(body.payment_status)
    ) {
      return NextResponse.json(
        { error: "Invalid payment status" },
        { status: 400 },
      );
    }

    const validBalanceStatuses = ["pending", "failed"];
    if (
      body.balance_payment_status &&
      !validBalanceStatuses.includes(body.balance_payment_status)
    ) {
      return NextResponse.json(
        { error: "Invalid balance payment status" },
        { status: 400 },
      );
    }

    // Wise is the only canonical payment provider.
    if (body.payment_method && body.payment_method !== "wise") {
      return NextResponse.json(
        { error: "INVALID_PAYMENT_PROVIDER" },
        { status: 400 },
      );
    }

    const allowedFields = [
      "status",
      "payment_status",
      "payment_method",
      "payment_failure_reason",
      "payment_failed_at",
      "balance_payment_status",
      "balance_paid_at",
      "refund_amount",
      "refunded_at",
      "dispute_reason",
      "disputed_at",
      "invoice_status",
      "execution_date",
      "completed_at",
      "followup_24h",
      "followup_72h",
      "follow_up_active",
      "decline_risk",
      "assignee",
      "scheduled_at",
      "execution_at",
      "apostille_at",
      "delivery_at",
      "shipped_at",
      "tracking_number",
      "carrier",
      "notes",
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) updateData[field] = body[field];
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    const nowIso = new Date().toISOString();
    if (
      updateData.payment_status === "failed" &&
      !updateData.payment_failed_at
    ) {
      updateData.payment_failed_at = nowIso;
    }
    if (updateData.payment_status === "refunded" && !updateData.refunded_at) {
      updateData.refunded_at = nowIso;
    }
    if (updateData.dispute_reason && !updateData.disputed_at) {
      updateData.disputed_at = nowIso;
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

        if (updateData.payment_status === "refunded") {
          await logActivity({
            deal_id: dealRef,
            actor,
            action: "payment_updated",
            detail: `Payment refunded${
              updateData.refund_amount != null
                ? ` ($${updateData.refund_amount})`
                : ""
            }`,
            meta: {
              status: "refunded",
              amount: updateData.refund_amount ?? null,
            },
          });
        } else if (updateData.payment_status === "failed") {
          await logActivity({
            deal_id: dealRef,
            actor,
            action: "payment_updated",
            detail: `Payment failed${
              updateData.payment_failure_reason
                ? `: ${updateData.payment_failure_reason}`
                : ""
            }`,
            meta: {
              status: "failed",
              reason: updateData.payment_failure_reason ?? null,
            },
          });
        } else if (updateData.payment_status) {
          await logActivity({
            deal_id: dealRef,
            actor,
            action: "payment_updated",
            detail: `Payment status → ${updateData.payment_status}`,
            meta: { payment_status: updateData.payment_status },
          });
        }

        if (updateData.balance_payment_status === "failed") {
          await logActivity({
            deal_id: dealRef,
            actor,
            action: "payment_updated",
            detail: "Balance payment failed",
            meta: { status: "balance_failed" },
          });
        }

        if (
          updateData.tracking_number !== undefined ||
          updateData.carrier !== undefined
        ) {
          await logActivity({
            deal_id: dealRef,
            actor,
            action: "tracking_added",
            detail: `Tracking ${updateData.tracking_number ?? "—"} via ${
              updateData.carrier ?? "carrier"
            }`,
            meta: {
              tracking_number: updateData.tracking_number,
              carrier: updateData.carrier,
            },
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
