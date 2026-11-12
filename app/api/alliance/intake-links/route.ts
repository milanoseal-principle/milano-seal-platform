import { resolveAlliancePartner } from "@/lib/alliance/partnerContext";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET — list current partner's intake links
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const partner = await resolveAlliancePartner(user.id);

  if (!partner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: links, error } = await supabase
    .from("partner_intake_links")
    .select("id, partner_code, campaign_label, destination_country, document_type, click_count, active, created_at")
    .eq("partner_id", partner.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // A failed read is reported, never shown as "no links".
  if (error) return NextResponse.json({ error: "Intake links are unavailable right now." }, { status: 503 });
  return NextResponse.json({ links: links ?? [] });
}

// POST — create a new intake link for the current partner
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const partner = await resolveAlliancePartner(user.id);

  if (!partner) {
    return NextResponse.json({ error: "Partner record not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const { campaign_label, destination_country, document_type } = body;

  const { data: link, error } = await supabase
    .from("partner_intake_links")
    .insert({
      partner_id: partner.id,
      partner_code: partner.partner_code,
      campaign_label: campaign_label ?? null,
      destination_country: destination_country ?? null,
      document_type: document_type ?? null,
      click_count: 0,
      active: true,
    })
    .select("id, partner_code, campaign_label, destination_country, document_type, click_count, active, created_at")
    .single();

  if (error || !link) {
    return NextResponse.json({ error: "Failed to create intake link" }, { status: 500 });
  }

  return NextResponse.json({ link });
}
