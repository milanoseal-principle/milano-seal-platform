import { NextRequest, NextResponse } from 'next/server';
import { requireDashboardAccess } from '@/lib/dashboardAuth';
import { searchConsoleConfigured } from '@/lib/seo/search-console/client';
import { syncSearchConsole } from '@/lib/seo/search-console/sync';

export async function POST(request: NextRequest) {
  try {
    await requireDashboardAccess();
    if (!searchConsoleConfigured()) return NextResponse.json({ status: 'UNCONFIGURED', persisted: 0 }, { status: 503 });
    const body = await request.json().catch(() => ({})) as { startDate?: string; endDate?: string };
    const endDate = body.endDate ?? new Date(Date.now() - 86400000).toISOString().slice(0,10);
    const startDate = body.startDate ?? new Date(Date.now() - 29 * 86400000).toISOString().slice(0,10);
    const result = await syncSearchConsole(startDate, endDate);
    return NextResponse.json({ status: 'SYNCED', startDate, endDate, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'SEARCH_CONSOLE_SYNC_FAILED';
    return NextResponse.json({ error: message }, { status: message.includes('access_denied') ? 401 : 500 });
  }
}
