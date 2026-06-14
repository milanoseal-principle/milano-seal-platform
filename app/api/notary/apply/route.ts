import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  try {
    const body = await req.json();
    const {
      full_name, email, phone, state_of_commission, commission_number,
      commission_expiry, is_ron_certified, ron_platform, is_mobile_notary,
      service_counties, years_experience, specialties, has_eo_insurance,
      eo_carrier, eo_policy_number, eo_expiry, linkedin_url, notes,
    } = body;

    if (!full_name || !email || !state_of_commission) {
      return NextResponse.json(
        { error: "Full name, email, and state of commission are required." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    let partner_type = "NOTARY_PARTNER";
    if (is_ron_certified && is_mobile_notary) partner_type = "HYBRID";
    else if (is_ron_certified) partner_type = "RON_NOTARY";
    else if (is_mobile_notary) partner_type = "MOBILE_NOTARY";

    const { data, error } = await supabase
      .from("notary_applications")
      .insert({
        full_name, email, phone, state_of_commission, commission_number,
        commission_expiry: commission_expiry || null,
        is_ron_certified: is_ron_certified ?? false,
        ron_platform,
        is_mobile_notary: is_mobile_notary ?? false,
        service_counties,
        years_experience: years_experience ?? 0,
        specialties,
        has_eo_insurance: has_eo_insurance ?? false,
        eo_carrier, eo_policy_number,
        eo_expiry: eo_expiry || null,
        linkedin_url, notes, partner_type, status: "PENDING",
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "An application with this email already exists." },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ ok: true, application_id: data.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  const supabase = createAdminClient();
  try {
    const { data, error } = await supabase
      .from("notary_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ applications: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const supabase = createAdminClient();
  try {
    const { id, status, reviewed_by, rejection_reason } = await req.json();
    const { data, error } = await supabase
      .from("notary_applications")
      .update({ status, reviewed_by, rejection_reason, reviewed_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ application: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
