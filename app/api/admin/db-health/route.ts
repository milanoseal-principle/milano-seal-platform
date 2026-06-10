import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

// GET /api/admin/db-health
// founder_admin only — tests Supabase connection + deals table write
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "founder_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const admin = createAdminClient();
  const results: Record<string, unknown> = {
    supabase_url_set: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    service_role_key_set: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };

  // Test 1: read deals table
  const { error: readErr, count } = await admin
    .from("deals")
    .select("id", { count: "exact", head: true });

  results.deals_read = readErr
    ? { ok: false, code: readErr.code, message: readErr.message, hint: readErr.hint }
    : { ok: true, count };

  // Test 2: minimal insert + immediate delete
  const testId = `MS-HEALTH-${randomUUID().slice(0, 8).toUpperCase()}`;
  const testToken = randomUUID();
  const { data: ins, error: insErr } = await admin
    .from("deals")
    .insert([{
      deal_id: testId,
      access_token: testToken,
      client_name: "__db_health_check__",
      email: "",
      payment_status: "unpaid",
      deal_status: "awaiting_payment",
    }])
    .select("id")
    .single();

  if (insErr) {
    results.deals_write = {
      ok: false,
      code: insErr.code,
      message: insErr.message,
      hint: insErr.hint,
      details: insErr.details,
    };
  } else {
    results.deals_write = { ok: true, inserted_id: ins?.id };
    // clean up test row
    await admin.from("deals").delete().eq("deal_id", testId);
  }

  return NextResponse.json(results);
}
