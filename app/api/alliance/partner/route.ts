import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET — fetch current partner's own record (auth required)
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: partner, error } = await supabase
    .from("alliance_partners")
    .select(
      "id, partner_code, firm_name, contact_name, email, partner_type, status, " +
      "toolbelt_completed, compliance_verified, security_attested, routing_eligible, " +
      "jurisdiction_codes, document_categories, created_at, updated_at"
    )
    .eq("user_id", user.id)
    .single();

  if (error || !partner) {
    return NextResponse.json({ partner: null });
  }

  // Never expose: user_id directly, internal notes, margin, base_cost, or other partners' data
  return NextResponse.json({ partner });
}

// POST — update partner profile fields (subset only)
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  // Only allow updating partner-safe profile fields
  const allowed = ["contact_name", "firm_name", "partner_type", "jurisdiction_codes", "document_categories"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const { data: partner, error } = await supabase
    .from("alliance_partners")
    .update(updates)
    .eq("user_id", user.id)
    .select("id, firm_name, contact_name, partner_type, status")
    .single();

  if (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true, partner });
}
