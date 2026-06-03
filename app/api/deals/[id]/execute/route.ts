import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assertPaymentConfirmed, PaymentGateError } from "@/lib/payments/paymentGate";
import { logActivity } from "@/lib/activity";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: deal } = await supabase
      .from("deals")
      .select("*")
      .eq("id", id)
      .single();
    if (!deal)
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });

    try {
      assertPaymentConfirmed(deal, "execute");
    } catch (err) {
      const code = err instanceof PaymentGateError ? err.code : "PAYMENT_REQUIRED";
      return NextResponse.json(
        { error: code, message: "Payment must be confirmed before execution can begin." },
        { status: 402 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { data: updated } = await supabase
      .from("deals")
      .update({
        status: "in_execution",
        ...(body.execution_date ? { execution_date: body.execution_date } : {}),
      })
      .eq("id", id)
      .select()
      .single();

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await logActivity({
        deal_id: (updated?.deal_id as string) ?? id,
        actor: user?.email ?? "admin",
        action: "executed",
        detail: "Execution started",
      });
    })();

    return NextResponse.json({ success: true, deal: updated });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
