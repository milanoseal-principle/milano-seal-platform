import { NextRequest, NextResponse } from "next/server";
import { persistEligibilityCheck } from "@/lib/alliance/operatorEligibilityGate";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

// POST /api/admin/operators/[id]/eligibility — force re-evaluate routing eligibility
export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  try {
    const result = await persistEligibilityCheck(id);
    return NextResponse.json({ operator_id: id, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Evaluation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
