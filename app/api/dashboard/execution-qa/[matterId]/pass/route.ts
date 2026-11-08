import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveServerRole } from "@/lib/auth/server-role";

export const runtime = "nodejs";
const ADMIN_ROLES = new Set(["founder_admin", "admin_operator"]);

// QA approval is a consequential state change, never a bulk update by Matter ID.
// A RON review cannot pass while governed witness completion or checklist items
// remain outstanding; the separate witness writer verifies evidence atomically.
export async function POST(_req: Request, { params }: { params: Promise<{ matterId: string }> }) {
  const { matterId } = await params;
  if (!z.string().uuid().safeParse(matterId).success)
    return NextResponse.json({ ok: false, code: "INVALID_MATTER_ID" }, { status: 400 });

  const serverClient = await createClient();
  const { data: { user }, error } = await serverClient.auth.getUser();
  if (error || !user) return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  const role = await resolveServerRole(user);
  if (!ADMIN_ROLES.has(role))
    return NextResponse.json({ ok: false, code: "FORBIDDEN" }, { status: 403 });

  const supabase = createAdminClient();
  const { data: review, error: reviewError } = await supabase.from("execution_qa_reviews")
    .select("id, execution_qa_status, witness_status, checklist_type, missing_items, blocking_items")
    .eq("deal_id", matterId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (reviewError) return NextResponse.json({ ok: false, code: "QA_REVIEW_UNAVAILABLE" }, { status: 503 });
  if (!review) return NextResponse.json({ ok: false, code: "QA_REVIEW_NOT_FOUND" }, { status: 404 });

  if (review.execution_qa_status === "PASSED")
    return NextResponse.json({ ok: true, status: "PASSED", duplicate: true });
  if (review.execution_qa_status === "BLOCKED" ||
      (review.missing_items?.length ?? 0) > 0 ||
      (review.blocking_items?.length ?? 0) > 0)
    return NextResponse.json({ ok: false, code: "QA_BLOCKERS_UNRESOLVED" }, { status: 409 });

  if (review.checklist_type === "RON_QA") {
    const { data: matter, error: matterError } = await supabase.from("deals")
      .select("id, witnesses").eq("id", matterId).maybeSingle();
    if (matterError || !matter)
      return NextResponse.json({ ok: false, code: "MATTER_WITNESS_REVIEW_UNAVAILABLE" }, { status: 503 });
    if ((Number(matter.witnesses) || 0) > 0 && review.witness_status !== "COMPLETE")
      return NextResponse.json({ ok: false, code: "RON_WITNESS_QA_REQUIRED" }, { status: 409 });
    if ((Number(matter.witnesses) || 0) === 0 && review.witness_status !== "NOT_REQUIRED")
      return NextResponse.json({ ok: false, code: "RON_WITNESS_REQUIREMENT_REVIEW" }, { status: 409 });
  }

  const { data: updated, error: updateError } = await supabase.from("execution_qa_reviews")
    .update({ execution_qa_status: "PASSED", passed_by: user.id, passed_at: new Date().toISOString() })
    .eq("id", review.id).eq("execution_qa_status", review.execution_qa_status)
    .select("id").maybeSingle();
  if (updateError) return NextResponse.json({ ok: false, code: "QA_UPDATE_FAILED" }, { status: 503 });
  if (!updated) return NextResponse.json({ ok: false, code: "STALE_QA_REVIEW" }, { status: 409 });
  return NextResponse.json({ ok: true, status: "PASSED" });
}
