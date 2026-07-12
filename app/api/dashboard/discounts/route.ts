import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function requireFounderOrAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const role = ((user.app_metadata?.role ?? user.app_metadata?.role) as string) ?? "";
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
    .select("id,code,discount_type,discount_value,applies_to,client_id,attorney_profile_id,matter_id,usage_limit,usage_count,expiration_date,internal_reason,client_label,status,created_at,updated_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const auth = await requireFounderOrAdmin();
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await request.json() as {
    code?: string; discount_type?: string; discount_value?: number;
    applies_to?: string; usage_limit?: number; expiration_date?: string;
    internal_reason?: string; client_label?: string;
  };

  if (!body.code || !body.discount_type || body.discount_value === undefined) {
    return NextResponse.json({ error: "code, discount_type, and discount_value are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from("discount_codes").insert({
    code: body.code.toUpperCase().trim(),
    discount_type: body.discount_type === "PERCENTAGE" || body.discount_type === "percent" ? "percentage"
      : body.discount_type === "FLAT_AMOUNT" || body.discount_type === "flat" || body.discount_type === "fixed" ? "fixed_amount"
      : body.discount_type,
    discount_value: body.discount_value,
    applies_to: body.applies_to ?? "service_fee",
    usage_limit: body.usage_limit ?? null,
    expiration_date: body.expiration_date ?? null,
    internal_reason: body.internal_reason ?? "",
    client_label: body.client_label ?? "Milano Seal courtesy adjustment",
    status: "ACTIVE",
    created_by: auth.user.id,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!await requireFounderOrAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const body = await request.json() as {
    id?: string; status?: string; expiration_date?: string;
    usage_limit?: number; client_label?: string; internal_reason?: string;
  };
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (body.status !== undefined) update.status = body.status;
  if (body.expiration_date !== undefined) update.expiration_date = body.expiration_date;
  if (body.usage_limit !== undefined) update.usage_limit = body.usage_limit;
  if (body.client_label !== undefined) update.client_label = body.client_label;
  if (body.internal_reason !== undefined) update.internal_reason = body.internal_reason;

  const admin = createAdminClient();
  const { error } = await admin.from("discount_codes").update(update).eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
