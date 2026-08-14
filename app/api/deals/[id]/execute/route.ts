import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveServerRole } from "@/lib/auth/server-role";
import { assertPaymentConfirmed, PaymentGateError } from "@/lib/payments/paymentGate";
import { logActivity } from "@/lib/activity";

const EXECUTION_ROLES = new Set([
  "founder",
  "founder_admin",
  "admin",
  "admin_operator",
  "ops_manager",
  "execution_coordinator",
  "apostille_coordinator",
  "virtual_assistant",
]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const ssr = await createClient();
    const {
      data: { user },
    } = await ssr.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    }

    const role = await resolveServerRole(user);
    if (!EXECUTION_ROLES.has(role)) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const supabase = createAdminClient();
    const { data: deal } = await supabase
      .from("deals")
      .select("*")
      .eq("id", id)
      .single();

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    try {
      assertPaymentConfirmed(deal, "execute");
    } catch (err) {
      const code = err instanceof PaymentGateError ? err.code : "PAYMENT_REQUIRED";
      return NextResponse.json(
        {
          error: code,
          message: "Payment must be confirmed before execution can begin.",
        },
        { status: 402 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const { data: updated, error: updateError } = await supabase
      .from("deals")
      .update({
        status: "in_execution",
        deal_status: "in_execution",
        ...(body.execution_date
          ? { execution_date: body.execution_date }
          : {}),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        {
          error: "EXECUTION_TRANSITION_FAILED",
          message:
            "The Matter could not be moved to execution. No execution state was fabricated.",
        },
        { status: 409 },
      );
    }

    void logActivity({
      deal_id: (updated?.deal_id as string) ?? id,
      actor: user.email ?? user.id,
      action: "executed",
      detail: "Execution started",
      meta: { canonical_status: "in_execution" },
    }).catch((error) =>
      console.error("[activity] execution log failed:", error),
    );

    return NextResponse.json({ success: true, deal: updated });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
