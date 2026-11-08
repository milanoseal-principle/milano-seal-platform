import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveServerRole } from "@/lib/auth/server-role";
import { RON_INCIDENT_ROLES } from "@/lib/bluenotary/securityIncidents";

export const runtime = "nodejs";

async function requireDashboardRole() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const role = await resolveServerRole(user);
  return RON_INCIDENT_ROLES.has(role) ? { user, role } : null;
}

export async function GET() {
  if (!await requireDashboardRole()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("compliance_incidents")
    .select("id,matter_id,incident_type,severity,status,release_frozen,document_already_released,apostille_already_submitted,client_impact_level,financial_exposure_estimate,summary,internal_notes,client_safe_message,correction_plan,founder_review_status,counsel_review_status,insurance_review_status,opened_by,assigned_to,closed_by,closed_at,created_at,updated_at")
    .order("created_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const auth = await requireDashboardRole();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json() as {
    incident_type?: string; severity?: string; summary?: string; matter_id?: string;
    release_frozen?: boolean; client_safe_message?: string; internal_notes?: string;
    correction_plan?: string; client_impact_level?: string;
  };
  if (!body.incident_type || !body.severity || !body.summary) {
    return NextResponse.json({ error: "incident_type, severity, and summary are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from("compliance_incidents").insert({
    incident_type: body.incident_type,
    severity: body.severity,
    summary: body.summary,
    status: "INCIDENT_OPENED",
    matter_id: body.matter_id ?? null,
    release_frozen: body.release_frozen ?? true,
    client_safe_message: body.client_safe_message ?? null,
    internal_notes: body.internal_notes ?? null,
    correction_plan: body.correction_plan ?? null,
    client_impact_level: body.client_impact_level ?? null,
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
    client_safe_message?: string; internal_notes?: string; correction_plan?: string;
    founder_review_status?: string; counsel_review_status?: string; insurance_review_status?: string;
  };
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: incident, error: incidentError } = await admin.from("compliance_incidents")
    .select("id,incident_type").eq("id",body.id).maybeSingle();
  if (incidentError) return NextResponse.json({error:"INCIDENT_READ_FAILED"},{status:503});
  if (!incident) return NextResponse.json({error:"INCIDENT_NOT_FOUND"},{status:404});
  if (incident.incident_type === "RON_SECURITY_COMPROMISE") return NextResponse.json({
    error:"USE_GOVERNED_RON_INCIDENT_WORKFLOW",
    next_action:"Use the Florida RON security compromise review on the incident dashboard.",
  },{status:409});

  const update: Record<string, unknown> = {};
  if (body.status !== undefined) update.status = body.status;
  if (body.release_frozen !== undefined) update.release_frozen = body.release_frozen;
  if (body.client_safe_message !== undefined) update.client_safe_message = body.client_safe_message;
  if (body.internal_notes !== undefined) update.internal_notes = body.internal_notes;
  if (body.correction_plan !== undefined) update.correction_plan = body.correction_plan;
  if (body.founder_review_status !== undefined) update.founder_review_status = body.founder_review_status;
  if (body.counsel_review_status !== undefined) update.counsel_review_status = body.counsel_review_status;
  if (body.insurance_review_status !== undefined) update.insurance_review_status = body.insurance_review_status;
  if (body.status === "CLOSED") {
    update.closed_at = new Date().toISOString();
    update.closed_by = auth.user.id;
  }

  const { error } = await admin.from("compliance_incidents").update(update).eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
