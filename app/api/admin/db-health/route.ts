import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const actor = await requireDashboardAccess();
    if (actor.role !== 'founder_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const result = await createAdminClient({ timeoutMs: 10_000 }).from('deals').select('id', { count: 'exact', head: true });
    return NextResponse.json({
      status: result.error ? 'degraded' : 'ok',
      observation: 'canonical_deals_read_only',
      deals_read: { ok: !result.error, count: result.error ? null : result.count },
      write_probe: 'NOT_RUN_REQUIRES_SEPARATE_APPROVAL',
      observed_at: new Date().toISOString(),
    }, { status: result.error ? 503 : 200, headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ error: 'Observation unavailable' }, { status: 401, headers: { 'Cache-Control': 'private, no-store' } });
  }
}
