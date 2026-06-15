import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function requireDashboardRole() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const role = ((user.app_metadata?.role ?? user.user_metadata?.role) as string) ?? "";
  const allowed = new Set(["founder", "founder_admin", "admin", "admin_operator", "ops_manager",
    "finance", "execution_coordinator", "client_support"]);
  return allowed.has(role) ? { user, role } : null;
}

export async function GET() {
  if (!await requireDashboardRole()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("compliance_incidents")
    .select("id,incident_type,severity,status,matter_id,release_frozen,client_safe_message,internal_notes,created_at,updated_at,resolved_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const auth = await requireDashboardRole();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json() as {
    incident_type?: string; severity?: string; matter_id?: string;
    release_frozen?: boolean; client_safe_message?: string; internal_notes?: string;
  };
  if (!body.incident_type || !body.severity) {
    return NextResponse.json({ error: "incident_type and severity are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from("compliance_incidents").insert({
    incident_type: body.incident_type,
    severity: body.severity,
    status: "open",
    matter_id: body.matter_id ?? null,
    release_frozen: body.release_frozen ?? false,
    client_safe_message: body.client_safe_message ?? null,
    internal_notes: body.internal_notes ?? null,
    opened_by: auth.user.id,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireDashboardRole();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json() as {
    id?: string; status?: string; release_frozen?: boolean;
    client_safe_message?: string; internal_notes?: string;
  };
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdminClient();
  const update: Record<string, unknown> = {};
  if (body.status !== undefined) update.status = body.status;
  if (body.release_frozen !== undefined) update.release_frozen = body.release_frozen;
  if (body.client_safe_message !== undefined) update.client_safe_message = body.client_safe_message;
  if (body.internal_notes !== undefined) update.internal_notes = body.internal_notes;
  if (body.status === "resolved") update.resolved_at = new Date().toISOString();
  update.updated_at = new Date().toISOString();

  const { error } = await admin.from("compliance_incidents").update(update).eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
