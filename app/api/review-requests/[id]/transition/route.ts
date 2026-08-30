import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeUserRole } from "@/lib/auth/roleRedirect";
import { resolveServerRole } from "@/lib/auth/server-role";
import { queueClientReviewNotification } from "@/lib/review/reviewNotifications";

const TRANSITIONS: Record<string, string[]> = { REQUESTED: ["ACKNOWLEDGED"], ACKNOWLEDGED: ["IN_PROGRESS", "CLOSED"], IN_PROGRESS: ["RESOLVED", "CLOSED"], RESOLVED: ["CLOSED"], CLOSED: [] };

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  const role = normalizeUserRole(await resolveServerRole(user));
  if (!role || !["operator", "admin", "owner"].includes(role)) return NextResponse.json({ ok: false, code: "FORBIDDEN" }, { status: 403 });
  const body = await request.json().catch(() => ({})) as { from_status?: string; to_status?: string };
  const from = body.from_status?.toUpperCase() ?? "";
  const to = body.to_status?.toUpperCase() ?? "";
  if (!TRANSITIONS[from]?.includes(to)) return NextResponse.json({ ok: false, code: "INVALID_REVIEW_TRANSITION" }, { status: 409 });
  const { id } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin.from("review_requests").update({ status: to, operator_user_id: user.id, updated_at: new Date().toISOString() }).eq("id", id).eq("status", from).select("id,status,matter_id").maybeSingle();
  if (error) return NextResponse.json({ ok: false, code: "REVIEW_TRANSITION_FAILED" }, { status: 500 });
  if (!data) return NextResponse.json({ ok: false, code: "REVIEW_TRANSITION_CONFLICT" }, { status: 409 });
  if (to === "RESOLVED" && data.matter_id) {
    const { data: matter } = await admin.from("deals").select("email").eq("id", data.matter_id).maybeSingle();
    await queueClientReviewNotification({ status: "RESOLVED", reviewRequestId: data.id, matterId: data.matter_id, recipientEmail: (matter?.email as string | null) ?? null });
  }
  return NextResponse.json({ ok: true, review_request: data });
}
