import { NextRequest, NextResponse } from 'next/server';
import { requireDashboardAccess } from '@/lib/dashboardAuth';
import { searchConsoleConfigured } from '@/lib/seo/search-console/client';
import { syncSearchConsole } from '@/lib/seo/search-console/sync';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireDashboardAccess();
    if (!searchConsoleConfigured()) {
      return NextResponse.json({ error: 'SEARCH_CONSOLE_UNCONFIGURED', status: 'UNCONFIGURED', persisted: 0 }, { status: 503 });
    }

    const body = await request.json().catch(() => ({})) as { startDate?: string; endDate?: string };
    const endDate = body.endDate ?? new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);
    const startDate = body.startDate ?? new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const result = await syncSearchConsole(startDate, endDate, { triggerType: 'MANUAL', actorUserId: userId });
    return NextResponse.json({ status: 'SYNCED', startDate, endDate, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'SEARCH_CONSOLE_SYNC_FAILED';
    const unauthorized = message.includes('access_denied') || message.includes('login');
    return NextResponse.json({ error: unauthorized ? 'Unauthorized' : message }, { status: unauthorized ? 401 : 500 });
  }
}
