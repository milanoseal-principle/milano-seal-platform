"use client";

import { useState } from 'react';

type SyncState = 'UNCONFIGURED' | 'READY' | 'SYNCING' | 'SYNCED' | 'FAILED';

export function SearchConsoleSyncControl({ configured }: { configured: boolean }) {
  const [state, setState] = useState<SyncState>(configured ? 'READY' : 'UNCONFIGURED');
  const [detail, setDetail] = useState<{ fetched?: number; persisted?: number; startDate?: string; endDate?: string; error?: string }>({});

  async function sync() {
    if (!configured || state === 'SYNCING') return;
    setState('SYNCING');
    setDetail({});
    try {
      const response = await fetch('/api/admin/seo/search-console/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const body = await response.json() as Record<string, unknown>;
      if (!response.ok) {
        setState(response.status === 503 ? 'UNCONFIGURED' : 'FAILED');
        setDetail({ error: String(body.error ?? 'SEARCH_CONSOLE_SYNC_FAILED') });
        return;
      }
      setState('SYNCED');
      setDetail({
        fetched: Number(body.fetched ?? 0),
        persisted: Number(body.persisted ?? 0),
        startDate: String(body.startDate ?? ''),
        endDate: String(body.endDate ?? ''),
      });
    } catch {
      setState('FAILED');
      setDetail({ error: 'SEARCH_CONSOLE_SYNC_FAILED' });
    }
  }

  return (
    <section className="mb-6 rounded-xl border border-white/10 bg-zinc-950 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Search Console Sync</p>
          <p className="mt-1 text-sm text-zinc-300">{state}</p>
        </div>
        <button
          type="button"
          disabled={!configured || state === 'SYNCING'}
          onClick={sync}
          className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {state === 'SYNCING' ? 'SYNCING…' : 'SYNC SEARCH CONSOLE'}
        </button>
      </div>
      {(detail.startDate || detail.error) && (
        <div className="mt-3 grid gap-2 text-xs text-zinc-500 sm:grid-cols-4">
          {detail.startDate && <p>Window: {detail.startDate} → {detail.endDate}</p>}
          {typeof detail.fetched === 'number' && <p>Fetched: {detail.fetched}</p>}
          {typeof detail.persisted === 'number' && <p>Persisted: {detail.persisted}</p>}
          {detail.error && <p className="text-red-300">Failure: {detail.error}</p>}
        </div>
      )}
    </section>
  );
}
