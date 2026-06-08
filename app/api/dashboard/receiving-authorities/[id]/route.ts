import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDashboardAccess } from "@/lib/dashboardAuth";

export const runtime = "nodejs";

const SAFE_FIELDS =
  "id,authority_name,authority_type,country,city,address,accepted_document_types,language_requirements,apostille_required,legalization_required,translation_required,document_age_limit_days,ron_accepted,rejection_triggers,source_url,source_type,confidence_level,last_verified_at,verified_by,stale_after_days,manual_review_required,routing_status,created_at,updated_at";

const PATCHABLE_FIELDS = new Set([
  "accepted_document_types",
  "language_requirements",
  "apostille_required",
  "legalization_required",
  "translation_required",
  "ron_accepted",
  "rejection_triggers",
  "source_url",
  "source_type",
  "confidence_level",
  "routing_status",
  "manual_review_required",
  "stale_after_days",
]);

const WRITE_ROLES = new Set(["founder_admin", "admin_operator"]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireDashboardAccess();
  const { id } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("receiving_authorities")
    .select(SAFE_FIELDS)
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ authority: data });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { role } = await requireDashboardAccess();
  if (!WRITE_ROLES.has(role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }
  const { id } = await params;

  const body = await req.json() as Record<string, unknown>;

  // Only allow patchable fields
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const [key, val] of Object.entries(body)) {
    if (PATCHABLE_FIELDS.has(key)) patch[key] = val;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("receiving_authorities")
    .update(patch)
    .eq("id", id)
    .select(SAFE_FIELDS)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Failed to update authority" }, { status: 500 });
  }

  return NextResponse.json({ authority: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { role } = await requireDashboardAccess();
  if (role !== "founder_admin") {
    return NextResponse.json({ error: "Only founder_admin can suspend authorities" }, { status: 403 });
  }
  const { id } = await params;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("receiving_authorities")
    .update({ routing_status: "SUSPENDED", updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id,routing_status")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Failed to suspend authority" }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data.id, routing_status: data.routing_status });
}
