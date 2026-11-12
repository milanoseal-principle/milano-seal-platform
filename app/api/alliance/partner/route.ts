import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAlliancePartner } from "@/lib/alliance/partnerContext";

async function sessionUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// GET — the signed-in partner's own canonical operator identity (partner-safe projection).
export async function GET() {
  try {
    const partner = await resolveAlliancePartner(await sessionUserId());
    if (!partner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ partner });
  } catch {
    return NextResponse.json({ error: "Profile is unavailable right now." }, { status: 503 });
  }
}

// POST — a partner may edit only their contact name, and their firm name once an operator has
// bound their profile. Role (partner_type), jurisdictions and document categories are verified
// operator data and are never self-editable.
export async function POST(req: NextRequest) {
  const db = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let partner;
  try {
    partner = await resolveAlliancePartner(user.id, db);
  } catch {
    return NextResponse.json({ error: "Profile is unavailable right now." }, { status: 503 });
  }
  if (!partner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const contact = typeof body.contact_name === "string" ? body.contact_name.trim().slice(0, 160) : null;
  const firm = typeof body.firm_name === "string" ? body.firm_name.trim().slice(0, 200) : null;
  if (!contact && !firm) return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  if (firm && !partner.profile_id) {
    return NextResponse.json({ error: "Your firm profile is pending activation by the Milano Seal team." }, { status: 409 });
  }

  const now = new Date().toISOString();
  if (contact) {
    const { error } = await db.from("operators").update({ full_name: contact, updated_at: now }).eq("id", partner.id).eq("user_id", user.id);
    if (error) return NextResponse.json({ error: "Update failed" }, { status: 503 });
  }
  if (firm && partner.profile_id) {
    const { error } = await db.from("operator_profiles").update({ firm_name: firm, updated_at: now }).eq("id", partner.profile_id);
    if (error) return NextResponse.json({ error: "Update failed" }, { status: 503 });
  }
  return NextResponse.json({ success: true, partner: await resolveAlliancePartner(user.id, db) });
}
