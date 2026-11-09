import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isVARole } from "@/lib/vaAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = ((user.app_metadata?.role ?? user.app_metadata?.role) as string) ?? "";
  if (!isVARole(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();

  // Return pending-review client-portal versions — no storage_path, no signed URLs
  const { data, error } = await admin
    .from("document_versions")
    .select("id,matter_id,file_name,actor,created_at,metadata")
    .eq("approval_status", "pending_review")
    .eq("stage", "intake_upload")
    .eq("metadata->>source", "client_portal")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }

  return NextResponse.json({ documents: (data ?? []).map(row => ({id:row.metadata?.document_id ?? row.id,matter_id:row.matter_id,document_label:row.file_name,source:"client_portal",uploaded_by:row.actor,uploaded_at:row.created_at,verification_status:"pending"})) });
}
