import { moveDeal } from "@/lib/pipelineEngine";
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
  return NextResponse.json({ ok: true, deal_id, stage });
}
