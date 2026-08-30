import { NextRequest, NextResponse } from 'next/server';
import { searchConsoleConfigured } from '@/lib/seo/search-console/client';
import { syncSearchConsole } from '@/lib/seo/search-console/sync';

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!searchConsoleConfigured()) return NextResponse.json({ error: 'SEARCH_CONSOLE_UNCONFIGURED' }, { status: 503 });

  const now = Date.now();
  const endDate = new Date(now - 3 * 86400000).toISOString().slice(0, 10);
  const startDate = new Date(now - 30 * 86400000).toISOString().slice(0, 10);
  try {
    const result = await syncSearchConsole(startDate, endDate, { triggerType: 'CRON' });
    return NextResponse.json({ success: true, startDate, endDate, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'SEARCH_CONSOLE_SYNC_FAILED';
    return NextResponse.json({ success: false, error: message.slice(0, 500), startDate, endDate }, { status: 500 });
  }
}
