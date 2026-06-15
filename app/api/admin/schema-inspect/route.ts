import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = (user?.app_metadata?.role ?? user?.user_metadata?.role) as string ?? "";
  if (!user || !new Set(["founder", "founder_admin"]).has(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const admin = createAdminClient();

  // Read enum values for discount_type from Postgres system catalog
  const query = `
    SELECT e.enumlabel AS value, t.typname AS type_name
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    ORDER BY t.typname, e.enumsortorder
  `;

  // Use service role to call a raw SQL query via the REST API
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Env not configured" }, { status: 500 });
  }

  // Try via admin client rpc if a helper exists, otherwise return columns we can inspect
  const { data: cols, error: colErr } = await admin
    .from("discount_codes")
    .select("discount_type")
    .limit(1);

  // Also try inserting a known-bad value to get the enum hint from Postgres
  const { error: insertErr } = await admin.from("discount_codes").insert({
    code: "__SCHEMA_PROBE__",
    discount_type: "__PROBE__",
    discount_value: 0,
    status: "ACTIVE",
    created_by: user.id,
  });

  return NextResponse.json({
    note: "Read the insert_error.message — it lists valid enum values",
    existing_rows_sample: cols ?? null,
    col_error: colErr?.message ?? null,
    insert_error: insertErr?.message ?? null,
    insert_hint: insertErr?.hint ?? null,
    insert_detail: insertErr?.details ?? null,
    sql: query,
  });
}
