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

  // Step 1: get the UDT name for discount_type column
  const { data: colData, error: colErr } = await (admin as ReturnType<typeof createAdminClient>)
    .schema("information_schema")
    .from("columns")
    .select("udt_name, data_type, udt_schema")
    .eq("table_schema", "public")
    .eq("table_name", "discount_codes")
    .eq("column_name", "discount_type")
    .single();

  // Step 2: get enum values via pg_catalog schema
  const { data: enumData, error: enumErr } = await (admin as ReturnType<typeof createAdminClient>)
    .schema("pg_catalog" as never)
    .from("pg_enum")
    .select("enumlabel, enumsortorder")
    .limit(200);

  // Step 3: get type OIDs to cross-reference
  const { data: typeData, error: typeErr } = await (admin as ReturnType<typeof createAdminClient>)
    .schema("pg_catalog" as never)
    .from("pg_type")
    .select("oid, typname")
    .ilike("typname", "%discount%")
    .limit(20);

  return NextResponse.json({
    column_info: colData ?? null,
    column_error: colErr?.message ?? null,
    enum_values: enumData ?? null,
    enum_error: enumErr?.message ?? null,
    type_matches: typeData ?? null,
    type_error: typeErr?.message ?? null,
  });
}
