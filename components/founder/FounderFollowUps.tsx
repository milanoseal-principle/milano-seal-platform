"use client";

import type { FollowUpItem } from "@/lib/founder-os/types";
import { deriveFollowUps } from "@/lib/founder-os/followUpEngine";

const statusStyle: Record<string, string> = {
  overdue: "text-red-300 border-red-400/20",
  due: "text-amber-200 border-amber-300/25",
  upcoming: "text-stone-400 border-amber-300/10",
};

export function FounderFollowUps({
  items = [],
  now,
}: {
  items?: FollowUpItem[];
  now: string;
}) {
  const derived = deriveFollowUps(items, now);

  return (
    <section className="rounded-2xl border border-amber-300/15 bg-black/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
          Follow-ups
        </h2>
        <span className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
          Internal sample data — not actual
        </span>
      </div>

      {derived.length === 0 ? (
        <p className="rounded-xl border border-dashed border-amber-300/15 bg-black/30 p-4 text-sm text-stone-500">
          No follow-ups tracked.
        </p>
      ) : (
        <div className="space-y-2">
          {derived.map((f) => (
            <div
              key={f.id}
              className={`flex items-center justify-between rounded-xl border bg-black/40 p-3 ${statusStyle[f.status]}`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-amber-100">{f.label}</p>
                <p className="text-[10px] uppercase tracking-[0.14em] text-amber-200/50">
                  {f.channel} · last contact {f.lastContact ?? "never"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">
                  {f.status}
                </p>
                <p className="text-[10px] text-stone-500">
                  {f.daysUntilDue === null
                    ? "needs first touch"
                    : f.daysUntilDue < 0
                      ? `${Math.abs(f.daysUntilDue)}d overdue`
                      : f.daysUntilDue === 0
                        ? "due today"
                        : `in ${f.daysUntilDue}d`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
