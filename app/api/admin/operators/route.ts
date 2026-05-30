import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// GET /api/admin/operators — list all operator profiles
export async function GET(req: NextRequest) {
  const admin = createAdminClient();
  const status = req.nextUrl.searchParams.get("status");

  let query = admin
    .from("operator_profiles")
    .select(
      `id, full_name, email, phone, firm_name, region, state, city,
       onboarding_status, background_verified, identity_verified,
       ron_capable, mobile_capable, apostille_runner_capable, courier_capable,
       admin_approved, approved_by, approved_at, created_at, updated_at`,
    )
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("onboarding_status", status) as typeof query;
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ operators: data });
}

// POST /api/admin/operators — create a new operator profile
export async function POST(req: NextRequest) {
  const admin = createAdminClient();

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const required = ["full_name", "email"];
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `${field} is required` }, { status: 422 });
    }
  }

  const { data: profile, error: insertError } = await admin
    .from("operator_profiles")
    .insert({
      full_name: body.full_name,
      email: body.email,
      phone: body.phone ?? null,
      firm_name: body.firm_name ?? null,
      region: body.region ?? null,
      state: body.state ?? null,
      city: body.city ?? null,
      coverage_radius_miles: body.coverage_radius_miles ?? 50,
      onboarding_status: "invited",
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Provision default Tool Belt items
  await admin.rpc("provision_operator_toolbelt", { p_operator_id: profile.id });

  // Create empty compliance status record
  await admin.from("operator_compliance_status").insert({ operator_id: profile.id });

  // Set initial availability to OFFLINE
  await admin.from("operator_availability_log").insert({
    operator_id: profile.id,
    availability: "OFFLINE",
    set_by: "system",
    reason: "Initial profile creation",
  });

  return NextResponse.json({ operator: profile }, { status: 201 });
}
