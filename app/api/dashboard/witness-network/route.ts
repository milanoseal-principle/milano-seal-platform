import { NextResponse } from "next/server";
import { requireOperatorApiAccess } from "@/lib/auth/operatorApiAccess";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
const ADMIN_ROLES = new Set(["founder_admin", "admin_operator"]);

const SAFE_PARTNER_FIELDS = "id, name, partner_type, county, city, state, service_radius_miles, credential_status, availability_status, last_used_at, active, created_at";

export async function GET() {
  // Role comes from the authoritative server-side guard; there is no profiles table.
  const access = await requireOperatorApiAccess();
  if (!access.ok) return access.response;
  if (!ADMIN_ROLES.has(access.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createAdminClient();
  const { data, error: partnerError } = await supabase
    .from("execution_partners")
    .select(SAFE_PARTNER_FIELDS)
    .eq("active", true)
    .order("partner_type");

  // A failed read is unavailable data, not an empty network.
  if (partnerError) return NextResponse.json({ error: "WITNESS_NETWORK_UNAVAILABLE", partners: null }, { status: 503 });
  return NextResponse.json({ partners: data ?? [], no_data: false });
}

export async function POST(req: Request) {
  // Role comes from the authoritative server-side guard; there is no profiles table.
  const access = await requireOperatorApiAccess();
  if (!access.ok) return access.response;
  if (!ADMIN_ROLES.has(access.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, partner_type, county, city, state } = body;
  if (!name || !partner_type) return NextResponse.json({ error: "name and partner_type required" }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error: insertError } = await supabase
    .from("execution_partners")
    .insert({ name, partner_type, county, city, state: state ?? "FL", approved_by: access.userId, approved_at: new Date().toISOString() })
    .select(SAFE_PARTNER_FIELDS)
    .single();

  if (insertError) return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  return NextResponse.json(data);
}
