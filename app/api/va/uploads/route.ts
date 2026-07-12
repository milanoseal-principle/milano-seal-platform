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

  // Return pending/processing client-portal uploads — no storage_path, no signed URLs
  const { data, error } = await admin
    .from("documents")
    .select("id, matter_id, document_label, source, uploaded_by, uploaded_at, verification_status")
    .in("verification_status", ["pending", "processing"])
    .eq("source", "client_portal")
    .order("uploaded_at", { ascending: false })
    .limit(100);

  if (error) {
    if (error.code === "42P01") return NextResponse.json({ documents: [] });
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }

  return NextResponse.json({ documents: data ?? [] });
}
