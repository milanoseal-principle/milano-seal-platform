import { createAdminClient } from '@/lib/supabase/admin';
import { querySearchConsole } from './client';

export type SearchConsoleTrigger = 'MANUAL' | 'CRON';

function sanitizeError(error: unknown) {
  const raw = error instanceof Error ? error.message : 'SEARCH_CONSOLE_SYNC_FAILED';
  return raw.replace(/[\r\n\t]+/g, ' ').slice(0, 500);
}

export async function syncSearchConsole(
  startDate: string,
  endDate: string,
  options: { triggerType?: SearchConsoleTrigger; actorUserId?: string | null } = {},
) {
  const admin = createAdminClient();
  const triggerType = options.triggerType ?? 'MANUAL';
  const { data: run, error: runError } = await admin.from('seo_search_console_sync_runs').insert({
    start_date: startDate,
    end_date: endDate,
    status: 'STARTED',
    trigger_type: triggerType,
    actor_user_id: options.actorUserId ?? null,
  }).select('id').single();
  if (runError || !run) throw new Error('SEARCH_CONSOLE_SYNC_RUN_CREATE_FAILED');

  try {
    const rows = await querySearchConsole(startDate, endDate);
    const observations = rows.map((row) => {
      const [date, query, page, country] = row.keys ?? [];
      return {
        observed_date: date,
        query: query ?? '',
        page: page ?? '',
        country_code: country ?? null,
        clicks: Number(row.clicks ?? 0),
        impressions: Number(row.impressions ?? 0),
        ctr: Number(row.ctr ?? 0),
        position: Number(row.position ?? 0),
        source: 'google_search_console',
        synced_at: new Date().toISOString(),
      };
    }).filter((row) => row.observed_date && row.query && row.page);

    if (observations.length) {
      const { error } = await admin.from('seo_search_console_observations').upsert(observations, {
        onConflict: 'observed_date,query,page,country_code',
      });
      if (error) throw new Error(`SEARCH_CONSOLE_PERSIST_${error.message}`);
    }

    await admin.from('seo_search_console_sync_runs').update({
      completed_at: new Date().toISOString(),
      status: 'SUCCEEDED',
      fetched: rows.length,
      persisted: observations.length,
      error_code: null,
      error_message: null,
    }).eq('id', run.id);

    return { runId: run.id, fetched: rows.length, persisted: observations.length };
  } catch (error) {
    const message = sanitizeError(error);
    await admin.from('seo_search_console_sync_runs').update({
      completed_at: new Date().toISOString(),
      status: 'FAILED',
      error_code: message.split(':')[0]?.slice(0, 120) || 'SEARCH_CONSOLE_SYNC_FAILED',
      error_message: message,
    }).eq('id', run.id);
    throw error;
  }
}
