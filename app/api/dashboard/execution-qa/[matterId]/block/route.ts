import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveServerRole } from "@/lib/auth/server-role";

export const runtime = "nodejs";
const ADMIN_ROLES = new Set(["founder_admin", "admin_operator"]);

export async function POST(req: Request, { params }: { params: Promise<{ matterId: string }> }) {
  const { matterId } = await params;
  if (!z.string().uuid().safeParse(matterId).success)
    return NextResponse.json({ ok: false, code: "INVALID_MATTER_ID" }, { status: 400 });

  const serverClient = await createClient();
  const { data: { user }, error } = await serverClient.auth.getUser();
  if (error || !user) return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  const role = await resolveServerRole(user);
  if (!ADMIN_ROLES.has(role)) return NextResponse.json({ ok: false, code: "FORBIDDEN" }, { status: 403 });

  const payload = z.object({ reason: z.string().trim().min(3).max(1000) }).strict()
    .safeParse(await req.json().catch(() => null));
  if (!payload.success) return NextResponse.json({ ok: false, code: "REASON_REQUIRED" }, { status: 422 });

  const supabase = createAdminClient();
  const { data: review, error: readError } = await supabase.from("execution_qa_reviews")
    .select("id, execution_qa_status").eq("deal_id", matterId)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (readError) return NextResponse.json({ ok: false, code: "QA_REVIEW_UNAVAILABLE" }, { status: 503 });
  if (!review) return NextResponse.json({ ok: false, code: "QA_REVIEW_NOT_FOUND" }, { status: 404 });
  if (review.execution_qa_status === "BLOCKED") return NextResponse.json({ ok: true, status: "BLOCKED", duplicate: true });

  const { data: updated, error: updateError } = await supabase.from("execution_qa_reviews")
    .update({ execution_qa_status: "BLOCKED", blocked_by: user.id,
      blocked_at: new Date().toISOString(), block_reason: payload.data.reason })
    .eq("id", review.id).eq("execution_qa_status", review.execution_qa_status)
    .select("id").maybeSingle();
  if (updateError) return NextResponse.json({ ok: false, code: "QA_UPDATE_FAILED" }, { status: 503 });
  if (!updated) return NextResponse.json({ ok: false, code: "STALE_QA_REVIEW" }, { status: 409 });

  return NextResponse.json({ ok: true, status: "BLOCKED" });
}
