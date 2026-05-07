import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [dealId, step] = id.split(":");
  if (!dealId || !["24h", "72h", "7d"].includes(step)) {
    return NextResponse.json({ error: "Bad follow-up id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  if (
    body.status !== "completed" &&
    body.status !== "cancelled" &&
    body.status !== "pending"
  ) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const flagKey =
    step === "24h"
      ? "followup_24h"
      : step === "72h"
      ? "followup_72h"
      : "followup_7d";

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("deals")
    .update({ [flagKey]: body.status !== "pending" })
    .eq("deal_id", dealId);

  if (error) {
    console.error("[follow-ups PATCH]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id, status: body.status });
}
