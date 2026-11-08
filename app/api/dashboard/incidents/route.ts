import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveServerRole } from "@/lib/auth/server-role";
import { RON_INCIDENT_ROLES } from "@/lib/bluenotary/securityIncidents";
import { NOTIFICATION_STATES, notificationCompletionError, RON_INCIDENT_CATEGORIES } from "@/lib/ron/governance";

const RON_TEXT_FIELDS = ["containment_action", "remediation", "credential_replacement_evidence_ref", "law_enforcement_evidence_ref", "state_notification_evidence_ref"] as const;

// RON security-incident fields. Notification can only be marked completed with timestamp + evidence.
function ronIncidentFields(body: Record<string, unknown>): { ok: true; values: Record<string, unknown> } | { ok: false; code: string } {
  const values: Record<string, unknown> = {};
  if (body.incident_category !== undefined) {
    if (body.incident_category !== null && !(RON_INCIDENT_CATEGORIES as readonly string[]).includes(String(body.incident_category))) return { ok: false, code: "INVALID_INCIDENT_CATEGORY" };
    values.incident_category = body.incident_category;
  }
  for (const field of ["ron_session_id", "responsible_operator"] as const) {
    if (typeof body[field] === "string") values[field] = body[field];
  }
  for (const field of ["detected_at", "reported_at"] as const) {
    if (body[field] !== undefined) {
      if (typeof body[field] !== "string" || Number.isNaN(Date.parse(String(body[field])))) return { ok: false, code: `INVALID_${field.toUpperCase()}` };
      values[field] = new Date(String(body[field])).toISOString();
    }
  }
  for (const field of RON_TEXT_FIELDS) {
    if (typeof body[field] === "string") values[field] = String(body[field]).trim().slice(0, 4000);
  }
  for (const [state, at, evidence] of [["law_enforcement_notification", "law_enforcement_notified_at", "law_enforcement_evidence_ref"], ["state_notification", "state_notified_at", "state_notification_evidence_ref"]] as const) {
    if (body[state] === undefined) continue;
    if (!(NOTIFICATION_STATES as readonly string[]).includes(String(body[state]))) return { ok: false, code: `INVALID_${state.toUpperCase()}` };
    values[state] = body[state];
    if (body[state] === "completed") {
      const failure = notificationCompletionError(body[at], body[evidence]);
      if (failure) return { ok: false, code: failure };
      values[at] = new Date(String(body[at])).toISOString();
      values[evidence] = String(body[evidence]).trim();
    }
  }
  return { ok: true, values };
}

export const runtime = "nodejs";

async function requireDashboardRole() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const role = await resolveServerRole(user);
  return RON_INCIDENT_ROLES.has(role) ? { user, role } : null;
}

export async function GET() {
  if (!await requireDashboardRole()) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("compliance_incidents")
    .select("id,matter_id,ron_session_id,incident_category,detected_at,reported_at,containment_action,responsible_operator,law_enforcement_notification,law_enforcement_notified_at,law_enforcement_evidence_ref,state_notification,state_notified_at,state_notification_evidence_ref,notification_deadline_at,remediation,credential_replacement_evidence_ref,incident_type,severity,status,release_frozen,document_already_released,apostille_already_submitted,client_impact_level,financial_exposure_estimate,summary,internal_notes,client_safe_message,correction_plan,founder_review_status,counsel_review_status,insurance_review_status,opened_by,assigned_to,closed_by,closed_at,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) return NextResponse.json({ error: "INCIDENTS_UNAVAILABLE" }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const auth = await requireDashboardRole();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json() as {
    incident_type?: string; severity?: string; summary?: string; matter_id?: string;
    release_frozen?: boolean; client_safe_message?: string; internal_notes?: string;
    correction_plan?: string; client_impact_level?: string;
  } & Record<string, unknown>;
  const ron = ronIncidentFields(body);
  if (!ron.ok) return NextResponse.json({ error: ron.code }, { status: 422 });
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
    ...ron.values,
    reported_at: ron.values.reported_at ?? new Date().toISOString(),
  }).select().single();
  if (error) return NextResponse.json({ error: "INCIDENT_CREATE_REJECTED", code: error.message }, { status: 409 });
  await admin.from("incident_audit_log").insert({
    incident_id: data.id, matter_id: data.matter_id, action: "INCIDENT_OPENED", to_status: data.status,
    actor_id: auth.user.id, metadata: { incident_category: data.incident_category ?? null },
  });
  return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireDashboardRole();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json() as {
    id?: string; status?: string; release_frozen?: boolean;
    client_safe_message?: string; internal_notes?: string; correction_plan?: string;
    founder_review_status?: string; counsel_review_status?: string; insurance_review_status?: string;
  } & Record<string, unknown>;
  const ron = ronIncidentFields(body);
  if (!ron.ok) return NextResponse.json({ error: ron.code }, { status: 422 });
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
  Object.assign(update, ron.values);
  if (body.status === "CLOSED" || body.status === "MATTER_RESTORED_OR_CLOSED") {
    update.closed_at = new Date().toISOString();
    update.closed_by = auth.user.id;
  }

  const { data: prior } = await admin.from("compliance_incidents").select("id, matter_id, status").eq("id", body.id).maybeSingle();
  if (!prior) return NextResponse.json({ error: "INCIDENT_NOT_FOUND" }, { status: 404 });
  // Database enforcement rejects closure without notification/containment/remediation evidence.
  const { error } = await admin.from("compliance_incidents").update(update).eq("id", body.id);
  if (error) return NextResponse.json({ error: "INCIDENT_UPDATE_REJECTED", code: error.message }, { status: 409 });
  await admin.from("incident_audit_log").insert({
    incident_id: body.id, matter_id: prior.matter_id, action: "INCIDENT_UPDATED",
    from_status: prior.status, to_status: (update.status as string | undefined) ?? prior.status,
    actor_id: auth.user.id, metadata: { fields: Object.keys(update) },
  });
  return NextResponse.json({ ok: true });
}
