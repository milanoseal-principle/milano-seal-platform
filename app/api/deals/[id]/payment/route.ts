import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_METHODS = [
  "stripe",
  "wise",
  "zelle",
  "venmo",
  "cash_app",
  "apple_cash",
];

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
    if (!["pending", "partial", "paid"].includes(payment_status))
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
    return NextResponse.json({ success: true, deal: updated });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
