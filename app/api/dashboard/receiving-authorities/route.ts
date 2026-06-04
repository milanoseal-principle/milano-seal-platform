import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDashboardAccess } from "@/lib/dashboardAuth";

export const runtime = "nodejs";

const SAFE_FIELDS =
  "id,authority_name,authority_type,country,city,address,accepted_document_types,language_requirements,apostille_required,legalization_required,translation_required,document_age_limit_days,ron_accepted,rejection_triggers,source_url,source_type,confidence_level,last_verified_at,verified_by,stale_after_days,manual_review_required,routing_status,created_at,updated_at";

export async function GET(req: NextRequest) {
  await requireDashboardAccess();
  const supabase = createAdminClient();

  const { searchParams } = new URL(req.url);
  const country = searchParams.get("country");
  const authority_type = searchParams.get("authority_type");
  const routing_status = searchParams.get("routing_status");

  let query = supabase
    .from("receiving_authorities")
    .select(SAFE_FIELDS)
    .order("authority_name", { ascending: true });

  if (country) query = query.ilike("country", `%${country}%`);
  if (authority_type) query = query.eq("authority_type", authority_type);
  if (routing_status) query = query.eq("routing_status", routing_status);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ authorities: [], error: "Failed to load authorities" }, { status: 500 });
  }

  return NextResponse.json({ authorities: data ?? [] });
}

const WRITE_ROLES = new Set(["founder_admin", "admin", "admin_operator"]);

export async function POST(req: NextRequest) {
  const { role } = await requireDashboardAccess();
  if (!WRITE_ROLES.has(role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await req.json() as Record<string, unknown>;
  const { authority_name, authority_type, country } = body as {
    authority_name?: string;
    authority_type?: string;
    country?: string;
  };

  if (!authority_name || !authority_type || !country) {
    return NextResponse.json({ error: "authority_name, authority_type, and country are required" }, { status: 400 });
  }

  // Strip protected fields
  const { id: _id, created_at: _c, updated_at: _u, operator_notes: _on, ...safe } = body as Record<string, unknown>;
  void _id; void _c; void _u; void _on;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("receiving_authorities")
    .insert({ ...safe, updated_at: new Date().toISOString() })
    .select(SAFE_FIELDS)
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create authority" }, { status: 500 });
  }

  return NextResponse.json({ authority: data }, { status: 201 });
}
