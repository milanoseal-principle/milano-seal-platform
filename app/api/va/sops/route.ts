import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { isVARole } from "@/lib/vaAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role =
    ((user.app_metadata?.role ?? user.app_metadata?.role) as string) ?? "";

  if (!isVARole(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const admin = createAdminClient();
    // Query published SOPs scoped to VA roles:
    // role_scope contains 'va' OR role_scope overlaps with the full VA role list
    const { data: sops, error } = await admin
      .from("sops")
      .select(
        "id, title, category, role_scope, status, version, body_markdown, checklist_json, published_at"
      )
      .eq("status", "published")
      .or(
        "role_scope.cs.{va},role_scope.ov.{virtual_assistant,intake_assistant,scheduling_assistant,document_coordinator,translation_coordinator,courier_assistant,followup_coordinator,alliance_support_assistant,escalation_assistant}"
      )
      .order("category", { ascending: true })
      .order("title", { ascending: true });

    if (error) {
      if (error.message?.includes("does not exist") || error.code === "42P01") {
        return NextResponse.json({ sops: [], migration_needed: true });
      }
      throw error;
    }

    return NextResponse.json({ sops: sops ?? [] });
  } catch {
    return NextResponse.json({ sops: [], migration_needed: true });
  }
}
