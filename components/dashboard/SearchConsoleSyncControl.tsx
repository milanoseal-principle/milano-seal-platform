"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

type ControlState = "LOADING" | "UNCONFIGURED" | "READY" | "SYNCING" | "SYNCED" | "FAILED";
type SyncRun = { completed_at: string | null; start_date: string; end_date: string; status: string; fetched: number; persisted: number; error_message: string | null };
type Health = { configured: boolean; siteUrl: string | null; latestObservationDate: string | null; lastSuccessfulSyncAt: string | null };

export function SearchConsoleSyncControl() {
  const [state, setState] = useState<ControlState>("LOADING");
  const [run, setRun] = useState<SyncRun | null>(null);
  const [health, setHealth] = useState<Health | null>(null);

  const load = useCallback(async () => {
    const [response, healthResponse] = await Promise.all([fetch("/api/admin/seo/search-console/sync", { cache: "no-store" }), fetch("/api/admin/seo/search-console/health", { cache: "no-store" })]);
    if (!response.ok || !healthResponse.ok) { setState("FAILED"); return; }
    const data = await response.json() as { configured: boolean; last_run: SyncRun | null }; const healthData = await healthResponse.json() as Health;
    setRun(data.last_run);
    setHealth(healthData);
    setState(!data.configured ? "UNCONFIGURED" : data.last_run?.status === "FAILED" ? "FAILED" : data.last_run?.status === "SUCCEEDED" ? "SYNCED" : "READY");
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function sync() {
    setState("SYNCING");
    const response = await fetch("/api/admin/seo/search-console/sync", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    if (!response.ok) { setState("FAILED"); return; }
    await load();
  }

  const stateTone: Record<ControlState, string> = {
    LOADING: "text-white/45 border-white/10",
    UNCONFIGURED: "text-amber-300 border-amber-500/25",
    READY: "text-[#C6A55A] border-[#C6A55A]/25",
    SYNCING: "text-[#C6A55A] border-[#C6A55A]/25",
    SYNCED: "text-emerald-300 border-emerald-500/25",
    FAILED: "text-red-300 border-red-500/25",
  };

  return (
    <section className="mb-8 rounded-xl border border-[#C6A55A]/15 bg-[#080501] p-5" data-search-console-sync-control>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#C6A55A]/60">Verified acquisition data</p>
          <h2 className="mt-2 text-lg font-semibold text-white">Search Console synchronization</h2>
          <p className="mt-1 text-xs leading-5 text-white/40">{health?.configured ? "Imports finalized Google Search Console observations through the governed server integration." : "SEARCH CONSOLE NOT CONFIGURED. No metrics or opportunities are displayed until a verified sync succeeds."}</p>
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-3 sm:items-end">
          <span className={`rounded-full border px-3 py-1 font-mono text-[9px] tracking-[0.14em] ${stateTone[state]}`}>{state}</span>
          <button type="button" data-qa-action="search-console-sync" onClick={sync} disabled={state === "UNCONFIGURED" || state === "SYNCING" || state === "LOADING"} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#C6A55A] px-4 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-black disabled:cursor-not-allowed disabled:opacity-35">
            <RefreshCw className={`h-3.5 w-3.5 ${state === "SYNCING" ? "animate-spin" : ""}`} /> Sync Search Console
          </button>
        </div>
      </div>
      {run && <dl className="mt-5 grid gap-3 border-t border-white/[0.06] pt-4 text-xs sm:grid-cols-4"><div><dt className="text-white/30">Last completed</dt><dd className="mt-1 text-white/65">{run.completed_at ? new Date(run.completed_at).toLocaleString() : "Not completed"}</dd></div><div><dt className="text-white/30">Rows fetched</dt><dd className="mt-1 text-white/65">{run.fetched}</dd></div><div><dt className="text-white/30">Rows persisted</dt><dd className="mt-1 text-white/65">{run.persisted}</dd></div><div><dt className="text-white/30">Sync window</dt><dd className="mt-1 text-white/65">{run.start_date} to {run.end_date}</dd></div>{run.error_message && <div className="sm:col-span-4"><dt className="text-red-300/70">Failure</dt><dd className="mt-1 text-red-200/70">{run.error_message}</dd></div>}</dl>}
      {health?.configured && <dl className="mt-4 grid gap-3 border-t border-white/[0.06] pt-4 text-xs sm:grid-cols-3"><div><dt className="text-white/30">Site</dt><dd className="mt-1 text-white/65">{health.siteUrl}</dd></div><div><dt className="text-white/30">Latest final data</dt><dd className="mt-1 text-white/65">{health.latestObservationDate ?? "No verified data"}</dd></div><div><dt className="text-white/30">First verified sync</dt><dd className="mt-1 text-white/65">{health.lastSuccessfulSyncAt ? "YES" : "NO"}</dd></div></dl>}
    </section>
  );
}
