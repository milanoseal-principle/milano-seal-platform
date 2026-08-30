import { createAdminClient } from '@/lib/supabase/admin';
import { querySearchConsole } from './client';

export async function syncSearchConsole(startDate: string, endDate: string) {
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

  if (!observations.length) return { fetched: rows.length, persisted: 0 };
  const admin = createAdminClient();
  const { error } = await admin.from('seo_search_console_observations').upsert(observations, {
    onConflict: 'observed_date,query,page,country_code',
  });
  if (error) throw new Error(`SEARCH_CONSOLE_PERSIST_${error.message}`);
  return { fetched: rows.length, persisted: observations.length };
}
