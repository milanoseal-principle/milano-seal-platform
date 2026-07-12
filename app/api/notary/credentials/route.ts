import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function requireDashboardRole() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const role = ((user.app_metadata?.role ?? user.app_metadata?.role) as string) ?? "";
  const allowed = new Set(["founder", "founder_admin", "admin", "admin_operator", "ops_manager"]);
  return allowed.has(role) ? { user, role } : null;
}

const VALID_STATUSES = new Set([
  "APPLICATION_RECEIVED", "DOCUMENTS_PENDING", "CREDENTIAL_REVIEW",
  "INTERVIEW_REQUIRED", "APPROVED", "ACTIVE", "SUSPENDED",
  "REJECTED", "EXPIRED_CREDENTIALS",
]);

export async function GET() {
  if (!await requireDashboardRole()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("notary_applications")
    .select("id,full_name,email,phone,state_commissioned,commission_number,commission_expiration,ron_authorized,e_and_o_insurance_provider,e_and_o_policy_limit,status,created_at,updated_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(request: Request) {
  if (!await requireDashboardRole()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const body = await request.json() as { id?: string; status?: string; review_notes?: string };
  if (!body.id || !body.status) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 });
  }
  if (!VALID_STATUSES.has(body.status)) {
    return NextResponse.json({ error: `Invalid status: ${body.status}` }, { status: 400 });
  }
  const admin = createAdminClient();
  const update: Record<string, unknown> = { status: body.status };
  if (body.review_notes) update.review_notes = body.review_notes;
  const { error } = await admin.from("notary_applications").update(update).eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
