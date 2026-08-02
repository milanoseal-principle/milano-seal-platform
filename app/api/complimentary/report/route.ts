import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractActor } from "@/lib/payments/complimentary-server";
import { hasComplimentaryPermission } from "@/lib/payments/complimentary-policy";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const actor = extractActor(user);
  if (!hasComplimentaryPermission(actor, "matter.comp.audit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const admin = createAdminClient();
  const { data, error } = await admin.from("complimentary_authorizations").select("*").order("authorized_at", { ascending: false }).limit(250);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = data ?? [];
  const totalValueComped = rows.reduce((sum, row) => sum + Number(row.original_total ?? 0), 0);
  return NextResponse.json({ rows, summary: { activeComplimentaryMatters: rows.filter((r) => r.status === "active").length, totalValueComped, verifiedRevenue: 0 } });
}
