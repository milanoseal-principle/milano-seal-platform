import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
const ADMIN_ROLES = new Set(["admin", "operator", "superadmin", "founder_admin", "admin_operator", "ops_manager"]);

export async function POST(_req: Request, { params }: { params: Promise<{ matterId: string }> }) {
  const { matterId } = await params;
  const serverClient = await createClient();
  const { data: { user }, error } = await serverClient.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await serverClient.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !ADMIN_ROLES.has(profile.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createAdminClient();
  const { error: updateError } = await supabase
    .from("execution_qa_reviews")
    .update({ execution_qa_status: "PASSED", passed_by: user.id, passed_at: new Date().toISOString() })
    .eq("deal_id", matterId);

  if (updateError) return NextResponse.json({ error: "Update failed" }, { status: 500 });
  return NextResponse.json({ ok: true, status: "PASSED" });
}
