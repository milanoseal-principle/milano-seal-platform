import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveServerRole } from "@/lib/auth/server-role";
import { QA_SELECT } from "@/lib/execution-qa/projection";

export const runtime = "nodejs";
const ADMIN_ROLES = new Set(["founder_admin", "admin_operator"]);
const CreateReview = z.object({
  deal_id: z.string().uuid(),
  checklist_type: z.enum([
    "GENERAL_NOTARY_QA", "RON_QA", "APOSTILLE_PACKET_QA",
    "COURIER_PACKET_QA", "INTERNATIONAL_PRIVATE_CLIENT_QA",
  ]).default("GENERAL_NOTARY_QA"),
}).strict();

async function authorizedOperator() {
  const serverClient = await createClient();
  const { data: { user }, error } = await serverClient.auth.getUser();
  if (error || !user) return { ok: false as const, status: 401, code: "UNAUTHORIZED" };
  const role = await resolveServerRole(user);
  if (!ADMIN_ROLES.has(role)) return { ok: false as const, status: 403, code: "FORBIDDEN" };
  return { ok: true as const, userId: user.id };
}

export async function GET() {
  const auth = await authorizedOperator();
  if (!auth.ok) return NextResponse.json({ ok: false, code: auth.code }, { status: auth.status });

  const { data: reviews, error } = await createAdminClient()
    .from("execution_qa_reviews").select(QA_SELECT)
    .order("created_at", { ascending: false }).limit(50);
  if (error) return NextResponse.json({ ok: false, code: "QA_QUEUE_UNAVAILABLE" }, { status: 503 });
  return NextResponse.json({ reviews: reviews ?? [], no_data: (reviews ?? []).length === 0 },
    { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const auth = await authorizedOperator();
  if (!auth.ok) return NextResponse.json({ ok: false, code: auth.code }, { status: auth.status });

  const input = CreateReview.safeParse(await req.json().catch(() => null));
  if (!input.success) return NextResponse.json({ ok: false, code: "INVALID_QA_REQUEST" }, { status: 422 });

  const supabase = createAdminClient();
  const { data: matter, error: matterError } = await supabase.from("deals")
    .select("id").eq("id", input.data.deal_id).maybeSingle();
  if (matterError) return NextResponse.json({ ok: false, code: "MATTER_UNAVAILABLE" }, { status: 503 });
  if (!matter) return NextResponse.json({ ok: false, code: "MATTER_NOT_FOUND" }, { status: 404 });

  const { data, error } = await supabase.from("execution_qa_reviews")
    .insert({ deal_id: input.data.deal_id, checklist_type: input.data.checklist_type,
      execution_qa_status: "IN_REVIEW" })
    .select(QA_SELECT).single();
  if (error || !data) return NextResponse.json({ ok: false, code: "QA_CREATION_FAILED" }, { status: 503 });
  return NextResponse.json(data, { status: 201, headers: { "Cache-Control": "no-store" } });
}
