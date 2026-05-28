import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";
import { canTransition } from "@/lib/stateMachine";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const dealId = params.id;
  if (!dealId) {
    return NextResponse.json({ error: "deal_id required" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    loss_reason,
    lost_stage,
    lost_notes_internal,
    competitor_name,
  } = body as {
    loss_reason?: string;
    lost_stage?: string;
    lost_notes_internal?: string;
    competitor_name?: string;
  };

  if (!loss_reason) {
    return NextResponse.json({ error: "loss_reason required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: deal, error: fetchError } = await supabase
    .from("deals")
    .select("id, deal_id, deal_status, client_name")
    .eq("deal_id", dealId)
    .maybeSingle();

  if (fetchError || !deal) {
    return NextResponse.json({ error: "Matter not found" }, { status: 404 });
  }

  if (deal.deal_status === "lost") {
    return NextResponse.json(
      { error: "Matter is already marked lost" },
      { status: 409 },
    );
  }

  if (!canTransition(deal.deal_status, "lost")) {
    return NextResponse.json(
      { error: `Cannot mark lost from status: ${deal.deal_status}` },
      { status: 409 },
    );
  }

  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("deals")
    .update({
      deal_status: "lost",
      loss_reason: loss_reason ?? null,
      lost_stage: lost_stage ?? deal.deal_status,
      lost_notes_internal: lost_notes_internal ?? null,
      competitor_name: competitor_name ?? null,
      lost_at: now,
      updated_at: now,
    })
    .eq("deal_id", dealId);

  if (updateError) {
    console.error("[mark-lost] DB update error:", updateError);
    return NextResponse.json(
      { error: "Failed to update matter", detail: updateError.message },
      { status: 500 },
    );
  }

  void logActivity({
    deal_id: dealId,
    actor: "operator",
    action: "lost",
    detail: `Matter marked lost — ${loss_reason}${competitor_name ? ` (competitor: ${competitor_name})` : ""}`,
    meta: {
      loss_reason,
      lost_stage: lost_stage ?? deal.deal_status,
      competitor_name: competitor_name ?? null,
    },
  });

  revalidatePath("/dashboard/deals");
  revalidatePath(`/dashboard/deals/${dealId}`);
  revalidatePath("/dashboard/pipeline");

  return NextResponse.json({ ok: true, deal_id: dealId, status: "lost" });
}
