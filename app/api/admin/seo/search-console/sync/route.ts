import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeUserRole } from "@/lib/auth/roleRedirect";
import { resolveServerRole } from "@/lib/auth/server-role";
import { getSearchConsoleConfiguration } from "@/lib/seo/search-console/client";
import { finalizedSearchConsoleWindow, syncSearchConsole } from "@/lib/seo/search-console/sync";

async function authorizedUser() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return null;
  const role = normalizeUserRole(await resolveServerRole(user));
  return role && ["operator", "admin", "owner"].includes(role) ? user : null;
}

export async function GET() {
  const user = await authorizedUser();
  if (!user) return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  const config = getSearchConsoleConfiguration();
  const admin = createAdminClient();
  const { data } = await admin.from("seo_search_console_sync_runs").select("id,started_at,completed_at,start_date,end_date,status,fetched,persisted,error_code,error_message,trigger_type").order("started_at", { ascending: false }).limit(1).maybeSingle();
  return NextResponse.json({ ok: true, configured: config.configured, last_run: data ?? null });
}

export async function POST(request: NextRequest) {
  const user = await authorizedUser();
  if (!user) return NextResponse.json({ ok: false, code: "UNAUTHORIZED" }, { status: 401 });
  if (!getSearchConsoleConfiguration().configured) return NextResponse.json({ ok: false, code: "SEARCH_CONSOLE_UNCONFIGURED" }, { status: 503 });
  const body = await request.json().catch(() => ({})) as { start_date?: string; end_date?: string };
  const fallback = finalizedSearchConsoleWindow();
  const startDate = /^\d{4}-\d{2}-\d{2}$/.test(body.start_date ?? "") ? body.start_date! : fallback.startDate;
  const endDate = /^\d{4}-\d{2}-\d{2}$/.test(body.end_date ?? "") ? body.end_date! : fallback.endDate;
  try { return NextResponse.json({ ok: true, ...(await syncSearchConsole({ startDate, endDate, triggerType: "MANUAL", actorUserId: user.id })) }); }
  catch { return NextResponse.json({ ok: false, code: "SEARCH_CONSOLE_SYNC_FAILED" }, { status: 502 }); }
}
