import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requirePaid } from "@/lib/gate";
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
      requirePaid(deal);
    } catch {
      return NextResponse.json(
        {
          error: "PAYMENT_REQUIRED_BEFORE_EXECUTION",
          message: "Payment must be received before scheduling can begin.",
        },
        { status: 402 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { data: updated } = await supabase
      .from("deals")
      .update({
        status: "apostille",
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
        action: "apostille",
        detail: "Sent to apostille",
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
