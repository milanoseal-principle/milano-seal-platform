import { NextRequest, NextResponse } from "next/server";
import { POST as executeMatter } from "@/app/api/deals/[id]/execute/route";
import { requireOperatorApiAccess } from "@/lib/auth/operatorApiAccess";
import { canPerformProtectedMatterTransition } from "@/lib/auth/protectedMatterTransitions";

export const runtime = "nodejs";

// Compatibility adapter: starting execution uses the canonical handler. Later
// stages require their evidence-backed workflows, never synthetic custody events.
export async function POST(req: NextRequest) {
  const access = await requireOperatorApiAccess();
  if (!access.ok) return access.response;
  if (!canPerformProtectedMatterTransition(access.role)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const body: unknown = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { deal_id, step } = body as Record<string, unknown>;
  if (typeof deal_id !== "string" || !deal_id.trim() || deal_id.length > 160 ||
      typeof step !== "string" || !["schedule", "execution", "apostille", "delivery"].includes(step)) {
    return NextResponse.json({ error: "Valid deal_id and step required" }, { status: 400 });
  }
  if (step !== "schedule") {
    return NextResponse.json({
      error: "EVIDENCE_WORKFLOW_REQUIRED",
      message: "Open the Matter execution workspace and complete the required evidence and review before advancing.",
      next: `/dashboard/matters/${encodeURIComponent(deal_id)}`,
    }, { status: 409 });
  }
  return executeMatter(req, { params: Promise.resolve({ id: deal_id }) });
}
