"use client";

import type { MarketingTask } from "@/lib/founder-os/types";
import {
  openMarketingTasks,
  overdueMarketingTasks,
  marketingCompletionRate,
} from "@/lib/founder-os/contentQueue";

export function MarketingQueue({
  tasks = [],
  now,
}: {
  tasks?: MarketingTask[];
  now: string;
}) {
  const open = openMarketingTasks(tasks);
  const overdue = overdueMarketingTasks(tasks, now);
  const overdueIds = new Set(overdue.map((t) => t.id));
  const rate = marketingCompletionRate(tasks);

  return (
    <section className="rounded-2xl border border-amber-300/15 bg-black/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
          Marketing Queue
        </h2>
        <span className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
          Internal sample data — not actual
        </span>
      </div>

      <p className="mb-4 text-[11px] uppercase tracking-[0.14em] text-amber-200/60">
        {open.length} open · {overdue.length} overdue · {Math.round(rate * 100)}% complete
      </p>

      {open.length === 0 ? (
        <p className="rounded-xl border border-dashed border-amber-300/15 bg-black/30 p-4 text-sm text-stone-500">
          No open marketing tasks.
        </p>
      ) : (
        <div className="space-y-2">
          {open.map((t) => (
            <div
              key={t.id}
              className={`flex items-center justify-between rounded-xl border bg-black/40 p-3 ${overdueIds.has(t.id) ? "border-red-400/20" : "border-amber-300/10"}`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-amber-100">{t.label}</p>
                <p className="text-[10px] uppercase tracking-[0.14em] text-amber-200/50">
                  {t.channel}
                </p>
              </div>
              <p className={`text-[11px] ${overdueIds.has(t.id) ? "text-red-300" : "text-stone-400"}`}>
                {t.dueDate ?? "no deadline"}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
