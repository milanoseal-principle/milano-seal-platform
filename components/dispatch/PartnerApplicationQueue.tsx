"use client";

import type { PartnerApplication } from "@/lib/dispatch/types";
import { isReadyForVerification } from "@/lib/dispatch/partnerApplication";

export function PartnerApplicationQueue({
  applications = [],
}: {
  applications?: PartnerApplication[];
}) {
  return (
    <section className="rounded-2xl border border-amber-300/15 bg-black/50 p-5">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
        Partner Application Queue
      </h2>
      <p className="mb-4 text-[11px] text-stone-500">
        Applications are requests to be considered as an independent partner —
        never a job offer or an implied assignment.
      </p>

      {applications.length === 0 ? (
        <p className="rounded-xl border border-amber-300/10 bg-black/40 px-3 py-6 text-center text-xs text-stone-500">
          No partner applications yet.
        </p>
      ) : (
        <div className="space-y-2">
          {applications.map((a) => (
            <div
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300/10 bg-black/40 px-3 py-2 text-xs"
            >
              <span className="font-mono text-amber-100">{a.displayName}</span>
              <span className="flex-1 text-stone-400">{a.region}</span>
              <span className="uppercase tracking-[0.14em] text-amber-200/60">{a.status}</span>
              {isReadyForVerification(a) && (
                <span className="rounded-full border border-emerald-400/25 bg-emerald-400/5 px-2 py-0.5 text-[10px] text-emerald-200">
                  ready to verify
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
