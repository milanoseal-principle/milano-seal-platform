import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = new Set(["founder_admin", "admin_operator"]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role =
    ((user.app_metadata?.role ?? user.app_metadata?.role) as string) ?? "";

  if (!ALLOWED_ROLES.has(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const admin = createAdminClient();
    const { data: versions, error } = await admin
      .from("sop_versions")
      .select(
        "id, sop_id, version, body_markdown, checklist_json, changed_by, change_note, created_at"
      )
      .eq("sop_id", id)
      .order("version", { ascending: false });

    if (error) {
      if (error.message?.includes("does not exist") || error.code === "42P01") {
        return NextResponse.json({ versions: [], migration_needed: true });
      }
      throw error;
    }

    return NextResponse.json({ versions: versions ?? [] });
  } catch {
    return NextResponse.json({ versions: [], migration_needed: true });
  }
}
