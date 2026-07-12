import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractActor } from "@/lib/payments/complimentary-server";
import { canAuditComplimentaryMatter, hasComplimentaryPermission } from "@/lib/payments/complimentary-policy";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ matterId: string }> }) {
  const { matterId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const actor = extractActor(user);
  if (!hasComplimentaryPermission(actor, "matter.comp.view") && !canAuditComplimentaryMatter(actor)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("complimentary_authorizations")
    .select("*")
    .eq("matter_id", matterId)
    .order("authorized_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ matterId, authorizations: data ?? [] });
}
