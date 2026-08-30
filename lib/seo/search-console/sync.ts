import { createAdminClient } from "@/lib/supabase/admin";
import { querySearchConsole } from "./client";

export type SearchConsoleSyncTrigger = "MANUAL" | "CRON";

export async function syncSearchConsole(input: { startDate: string; endDate: string; triggerType: SearchConsoleSyncTrigger; actorUserId?: string | null }) {
  const admin = createAdminClient();
  const { data: run, error: runError } = await admin.from("seo_search_console_sync_runs").insert({ start_date: input.startDate, end_date: input.endDate, status: "RUNNING", trigger_type: input.triggerType, actor_user_id: input.actorUserId ?? null }).select("id").single();
  if (runError || !run) throw new Error("SEARCH_CONSOLE_RUN_LEDGER_UNAVAILABLE");
  try {
    const result = await querySearchConsole(input.startDate, input.endDate);
    const observations = result.rows.map((row) => ({
      start_date: input.startDate,
      end_date: input.endDate,
      query: row.keys?.[0] ?? "",
      page: row.keys?.[1] ?? "",
      country: row.keys?.[2] ?? null,
      device: row.keys?.[3] ?? null,
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
      ctr: row.ctr ?? 0,
      position: row.position ?? 0,
      source: "google-search-console",
      site_url: result.siteUrl,
      synced_at: new Date().toISOString(),
    })).filter((row) => row.query && row.page);
    let persisted = 0;
    if (observations.length) {
      const { data, error } = await admin.from("seo_search_console_observations").upsert(observations, { onConflict: "start_date,end_date,query,page,country,device" }).select("id");
      if (error) throw new Error("SEARCH_CONSOLE_PERSIST_FAILED");
      persisted = data?.length ?? observations.length;
    }
    await admin.from("seo_search_console_sync_runs").update({ status: "SUCCEEDED", completed_at: new Date().toISOString(), fetched: result.rows.length, persisted }).eq("id", run.id);
    return { runId: run.id as string, fetched: result.rows.length, persisted, startDate: input.startDate, endDate: input.endDate };
  } catch (error) {
    const code = error instanceof Error ? error.message.slice(0, 120) : "SEARCH_CONSOLE_SYNC_FAILED";
    await admin.from("seo_search_console_sync_runs").update({ status: "FAILED", completed_at: new Date().toISOString(), error_code: code, error_message: "Search Console sync failed. Review server logs and configuration." }).eq("id", run.id);
    throw error;
  }
}

export function finalizedSearchConsoleWindow(now = new Date()) {
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 3));
  const start = new Date(end); start.setUTCDate(start.getUTCDate() - 27);
  return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
}
