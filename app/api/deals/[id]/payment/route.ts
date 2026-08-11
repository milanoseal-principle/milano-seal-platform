import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity";

const VALID_METHODS = ["wise"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      payment_method,
      payment_status,
      payment_reference,
      payment_amount_received,
    } = body;

    if (!VALID_METHODS.includes(payment_method))
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
    if (!["unpaid", "partial", "paid"].includes(payment_status))
      return NextResponse.json(
        { error: "Invalid payment status" },
        { status: 400 }
      );

    const supabase = await createClient();
    const { data: deal } = await supabase
      .from("deals")
      .select("*")
      .eq("id", id)
      .single();
    if (!deal)
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });

    const update: Record<string, unknown> = {
      payment_method,
      payment_status,
      payment_reference: payment_reference || null,
      payment_amount_received: payment_amount_received || 0,
    };
    if (payment_status === "paid") {
      update.invoice_status = "paid";
      update.status = "scheduled";
    }

    const { data: updated } = await supabase
      .from("deals")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const actor = user?.email ?? "admin";
      const dealRef = (updated?.deal_id as string) ?? id;
      await logActivity({
        deal_id: dealRef,
        actor,
        action:
          payment_status === "paid" ? "payment_confirmed" : "payment_updated",
        detail:
          payment_status === "paid"
            ? `Payment confirmed via ${payment_method}${
                payment_amount_received ? ` · $${payment_amount_received}` : ""
              }${payment_reference ? ` · ref ${payment_reference}` : ""}`
            : `Payment status → ${payment_status}`,
        meta: {
          method: payment_method,
          status: payment_status,
          amount: payment_amount_received ?? null,
          reference: payment_reference ?? null,
        },
      });
      if (payment_status === "paid") {
        await logActivity({
          deal_id: dealRef,
          actor,
          action: "stage_advanced",
          detail: "Auto-advanced to Scheduled (payment received)",
          meta: { stage: "scheduled" },
        });
      }
    })();

    return NextResponse.json({ success: true, deal: updated });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
