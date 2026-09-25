import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDashboardAccess } from "@/lib/dashboardAuth";

export const runtime = "nodejs";

const WRITE_ROLES = new Set(["founder_admin", "admin_operator"]);

// Operator decision on a detected official-source change. Records the
// decision only; canonical authority facts change solely through the
// governed provenance review (official source → VERIFIED).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId, role } = await requireDashboardAccess();
  if (!WRITE_ROLES.has(role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const decision = String(body.decision ?? "").toUpperCase();
  if (decision !== "APPROVED" && decision !== "REJECTED") return NextResponse.json({ error: "INVALID_REVIEW_DECISION" }, { status: 400 });
  const notes = String(body.review_notes ?? "").trim();
  if (notes.length < 10) return NextResponse.json({ error: "EVIDENCE_NOTE_REQUIRED" }, { status: 400 });

  const { data, error } = await createAdminClient().rpc("decide_authority_review", {
    p_review_id: id,
    p_decision: decision,
    p_actor_id: userId,
    p_notes: notes,
  });
  if (error?.message === "REVIEW_NOT_PENDING") return NextResponse.json({ error: "REVIEW_NOT_PENDING" }, { status: 409 });
  if (error) return NextResponse.json({ error: "REVIEW_DECISION_FAILED" }, { status: 500 });
  return NextResponse.json({ success: true, review: Array.isArray(data) ? data[0] : data });
}
