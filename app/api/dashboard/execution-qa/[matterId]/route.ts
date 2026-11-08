import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { QA_SELECT } from "@/lib/execution-qa/projection";
import { resolveServerRole } from "@/lib/auth/server-role";
import { z } from "zod";

export const runtime = "nodejs";
const ADMIN_ROLES = new Set(["founder_admin", "admin_operator"]);

export async function GET(_req: Request, { params }: { params: Promise<{ matterId: string }> }) {
  const { matterId } = await params;
  if (!z.string().uuid().safeParse(matterId).success) return NextResponse.json({ ok: false, code: "INVALID_MATTER_ID" }, { status: 400 });
  const serverClient = await createClient();
  const { data: { user }, error } = await serverClient.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = await resolveServerRole(user);
  if (!ADMIN_ROLES.has(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createAdminClient();
  const { data, error: readError } = await supabase.from("execution_qa_reviews").select(QA_SELECT).eq("deal_id", matterId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (readError) return NextResponse.json({ ok: false, code: "QA_REVIEW_UNAVAILABLE" }, { status: 503 });
  return NextResponse.json(data ?? null, { headers: { "Cache-Control": "no-store" } });
}
