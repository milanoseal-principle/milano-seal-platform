import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { QA_SELECT } from "@/lib/execution-qa/projection";

export const runtime = "nodejs";
const ADMIN_ROLES = new Set(["founder_admin", "admin_operator"]);

export async function GET(_req: Request, { params }: { params: Promise<{ matterId: string }> }) {
  const { matterId } = await params;
  const serverClient = await createClient();
  const { data: { user }, error } = await serverClient.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await serverClient.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !ADMIN_ROLES.has(profile.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createAdminClient();
  const { data } = await supabase.from("execution_qa_reviews").select(QA_SELECT).eq("deal_id", matterId).order("created_at", { ascending: false }).limit(1).single();
  return NextResponse.json(data ?? null);
}
