import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = (user?.app_metadata?.role ?? user?.app_metadata?.role) as string ?? "";
  if (!user || !new Set(["founder", "founder_admin"]).has(role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return NextResponse.json({
    discount_type_enum: ["percentage", "fixed_amount"],
    discount_status_enum: ["ACTIVE", "INACTIVE", "EXPIRED", "REVOKED"],
    note: "Values confirmed from migration 035",
  });
}
