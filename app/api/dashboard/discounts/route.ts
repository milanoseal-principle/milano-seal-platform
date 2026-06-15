import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function requireFounderOrAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const role = ((user.app_metadata?.role ?? user.user_metadata?.role) as string) ?? "";
  const allowed = new Set(["founder", "founder_admin", "admin", "admin_operator", "ops_manager"]);
  return allowed.has(role) ? { user, role } : null;
}

export async function GET() {
  if (!await requireFounderOrAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("discount_codes")
    .select("id,code,discount_type,discount_value,client_label,internal_reason,active,created_at,expires_at,uses,max_uses")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const auth = await requireFounderOrAdmin();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json() as {
    code?: string; discount_type?: string; discount_value?: number;
    client_label?: string; internal_reason?: string; max_uses?: number; expires_at?: string;
  };

  if (!body.code || !body.discount_type || body.discount_value === undefined) {
    return NextResponse.json({ error: "code, discount_type, and discount_value are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from("discount_codes").insert({
    code: body.code.toUpperCase().trim(),
    discount_type: body.discount_type,
    discount_value: body.discount_value,
    client_label: body.client_label ?? null,
    internal_reason: body.internal_reason ?? null,
    max_uses: body.max_uses ?? null,
    expires_at: body.expires_at ?? null,
    active: true,
    created_by: auth.user.id,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!await requireFounderOrAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const body = await request.json() as { id?: string; active?: boolean };
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("discount_codes").update({ active: body.active }).eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
