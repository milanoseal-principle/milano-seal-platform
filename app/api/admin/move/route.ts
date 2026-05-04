import { moveDeal } from "@/lib/pipelineEngine";
import { logActivity } from "@/lib/activity";
import { createClient } from "@/lib/supabase/server";
import { stageLabel } from "@/lib/format";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { deal_id, stage } = await req.json();
  if (!deal_id || !stage)
    return NextResponse.json(
      { error: "deal_id and stage required" },
      { status: 400 }
    );
  const result = await moveDeal(deal_id, stage);
  if (!result.ok)
    return NextResponse.json(
      { error: result.error },
      { status: result.error?.includes("Payment") ? 402 : 409 }
    );

  void (async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const actor = user?.email ?? "admin";
    const action =
      stage === "lost"
        ? "lost"
        : stage === "completed"
        ? "completed"
        : stage === "shipped"
        ? "shipped"
        : "stage_advanced";
    await logActivity({
      deal_id,
      actor,
      action,
      detail: `Stage moved to ${stageLabel(stage)}`,
      meta: { stage },
    });
  })();

  return NextResponse.json({ ok: true, deal_id, stage });
}
