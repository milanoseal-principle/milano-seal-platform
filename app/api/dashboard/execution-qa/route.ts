import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { QA_SELECT } from "@/lib/execution-qa/projection";

export const runtime = "nodejs";

const ADMIN_ROLES = new Set(["founder_admin", "admin_operator"]);

export async function GET() {
  const serverClient = await createClient();
  const { data: { user }, error } = await serverClient.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await serverClient.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !ADMIN_ROLES.has(profile.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createAdminClient();
  const { data: reviews, error: qaError } = await supabase
    .from("execution_qa_reviews")
    .select(QA_SELECT)
    .order("created_at", { ascending: false })
    .limit(50);

  if (qaError) return NextResponse.json({ reviews: [], no_data: true });
  return NextResponse.json({ reviews: reviews ?? [], no_data: false });
}

export async function POST(req: Request) {
  const serverClient = await createClient();
  const { data: { user }, error } = await serverClient.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await serverClient.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !ADMIN_ROLES.has(profile.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { deal_id, checklist_type } = body;
  if (!deal_id) return NextResponse.json({ error: "deal_id required" }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error: insertError } = await supabase
    .from("execution_qa_reviews")
    .insert({ deal_id, checklist_type: checklist_type ?? "GENERAL_NOTARY_QA", execution_qa_status: "IN_REVIEW" })
    .select(QA_SELECT)
    .single();

  if (insertError) return NextResponse.json({ error: "Failed to create QA review" }, { status: 500 });
  return NextResponse.json(data);
}
