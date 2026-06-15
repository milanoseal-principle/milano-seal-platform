import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function requireDashboardRole() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const role = ((user.app_metadata?.role ?? user.user_metadata?.role) as string) ?? "";
  const allowed = new Set(["founder", "founder_admin", "admin", "admin_operator", "ops_manager"]);
  return allowed.has(role) ? { user, role } : null;
}

export async function GET() {
  if (!await requireDashboardRole()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("notary_applications")
    .select("id,full_name,email,phone,state_commissioned,commission_number,commission_expiration,ron_authorized,eo_provider,status,created_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(request: Request) {
  if (!await requireDashboardRole()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const body = await request.json() as { id?: string; status?: string };
  if (!body.id || !body.status) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 });
  }
  const admin = createAdminClient();
  const { error } = await admin.from("notary_applications").update({ status: body.status }).eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
