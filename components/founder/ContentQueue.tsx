"use client";

import type { ContentQueueItem } from "@/lib/founder-os/types";
import { countByStatus, upcomingContent } from "@/lib/founder-os/contentQueue";

export function ContentQueue({ items = [] }: { items?: ContentQueueItem[] }) {
  const counts = countByStatus(items);
  const upcoming = upcomingContent(items);

  return (
    <section className="rounded-2xl border border-amber-300/15 bg-black/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
          Content Queue
        </h2>
        <span className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
          Internal sample data — not actual
        </span>
      </div>

      <div className="mb-4 grid grid-cols-4 gap-2">
        {(["idea", "drafting", "scheduled", "published"] as const).map((s) => (
          <div key={s} className="rounded-lg border border-amber-300/10 bg-black/40 p-2 text-center">
            <p className="text-[9px] uppercase tracking-[0.1em] text-amber-200/50">{s}</p>
            <p className="mt-1 text-lg font-semibold text-amber-100">{counts[s]}</p>
          </div>
        ))}
      </div>

      {upcoming.length === 0 ? (
        <p className="rounded-xl border border-dashed border-amber-300/15 bg-black/30 p-4 text-sm text-stone-500">
          No scheduled content.
        </p>
      ) : (
        <div className="space-y-2">
          {upcoming.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-xl border border-amber-300/10 bg-black/40 p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-amber-100">{c.title}</p>
                <p className="text-[10px] uppercase tracking-[0.14em] text-amber-200/50">
                  {c.format} · {c.status} · {c.channel}
                </p>
              </div>
              <p className="text-[11px] text-stone-400">{c.scheduledFor ?? "unscheduled"}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
