import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const supabase = createAdminClient();
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const severity = searchParams.get("severity");
    const deal_id = searchParams.get("deal_id");

    let query = supabase
      .from("compliance_incidents")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (status) query = query.eq("status", status);
    if (severity) query = query.eq("severity", severity);
    if (deal_id) query = query.eq("deal_id", deal_id);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ incidents: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  try {
    const body = await req.json();
    const {
      deal_id, incident_type, severity, title, description,
      affected_identifiers, client_name, matter_reference,
      destination_country, discovered_by, assigned_to,
    } = body;

    if (!incident_type || !title) {
      return NextResponse.json({ error: "incident_type and title required" }, { status: 400 });
    }

    const { INCIDENT_TYPE_MAP } = await import("@/lib/incidentTypes");
    const meta = INCIDENT_TYPE_MAP[incident_type as keyof typeof INCIDENT_TYPE_MAP];
    const freeze_triggered = meta?.triggers_freeze ?? false;

    const { data: incident, error } = await supabase
      .from("compliance_incidents")
      .insert({
        deal_id,
        incident_type,
        severity: severity ?? meta?.severity ?? "medium",
        title,
        description,
        affected_identifiers,
        client_name,
        matter_reference,
        destination_country,
        discovered_by: discovered_by ?? "operator",
        assigned_to,
        freeze_triggered,
        freeze_triggered_at: freeze_triggered ? new Date().toISOString() : null,
        status: "OPEN",
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.from("incident_audit_log").insert({
      incident_id: incident.id,
      actor: discovered_by ?? "operator",
      action: "INCIDENT_OPENED",
      new_status: "OPEN",
      note: `Incident opened: ${title}`,
    });

    return NextResponse.json({ incident });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const supabase = createAdminClient();
  try {
    const body = await req.json();
    const { id, status, resolution_note, make_it_right_triggered,
            make_it_right_type, make_it_right_note, courtesy_adjustment_amount,
            courtesy_code_issued, client_notified, actor } = body;

    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (resolution_note) updates.resolution_note = resolution_note;
    if (make_it_right_triggered !== undefined) updates.make_it_right_triggered = make_it_right_triggered;
    if (make_it_right_type) updates.make_it_right_type = make_it_right_type;
    if (make_it_right_note) updates.make_it_right_note = make_it_right_note;
    if (courtesy_adjustment_amount !== undefined) updates.courtesy_adjustment_amount = courtesy_adjustment_amount;
    if (courtesy_code_issued) updates.courtesy_code_issued = courtesy_code_issued;
    if (client_notified !== undefined) {
      updates.client_notified = client_notified;
      if (client_notified) updates.client_notified_at = new Date().toISOString();
    }
    if (status === "RESOLVED" || status === "CLOSED") {
      updates.resolved_at = new Date().toISOString();
      updates.resolved_by = actor ?? "operator";
    }

    const { data: incident, error } = await supabase
      .from("compliance_incidents")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from("incident_audit_log").insert({
      incident_id: id,
      actor: actor ?? "operator",
      action: "INCIDENT_UPDATED",
      new_status: status,
      note: resolution_note ?? make_it_right_note,
      metadata: { make_it_right_type, courtesy_adjustment_amount },
    });

    return NextResponse.json({ incident });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
