"use client";

import type { EmbassyRecord, ConsulateRecord } from "@/lib/jurisdictions/types";
import { VERIFY_BEFORE_EXECUTION_CAPTION } from "@/lib/jurisdictions/jurisdictionSafety";

export function EmbassyConsulatePanel({
  embassies,
  consulates,
}: {
  embassies: EmbassyRecord[];
  consulates: ConsulateRecord[];
}) {
  return (
    <section className="rounded-2xl border border-amber-300/25 bg-black/50 p-5">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
        Embassies & Consulates
      </h2>
      <p className="mb-4 text-[11px] text-stone-500">
        Illustrative directory placeholders. {VERIFY_BEFORE_EXECUTION_CAPTION}
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-amber-200/60">
            Embassies
          </p>
          <ul className="space-y-2 text-xs text-stone-300">
            {embassies.map((e) => (
              <li
                key={e.label}
                className="rounded-lg border border-amber-300/10 bg-black/30 px-3 py-2"
              >
                <div className="font-medium text-amber-100">{e.label}</div>
                <div className="mt-1 text-[11px] text-stone-400">
                  Represents {e.representsCountryIso} · in {e.city ?? e.hostCountryIso}
                </div>
                {e.contactNote && (
                  <div className="mt-1 text-[11px] text-stone-500">{e.contactNote}</div>
                )}
                <div className="mt-1 text-[10px] uppercase tracking-wide text-amber-200/60">
                  Verify before use
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-amber-200/60">
            Consulates
          </p>
          <ul className="space-y-2 text-xs text-stone-300">
            {consulates.map((c) => (
              <li
                key={c.label}
                className="rounded-lg border border-amber-300/10 bg-black/30 px-3 py-2"
              >
                <div className="font-medium text-amber-100">{c.label}</div>
                <div className="mt-1 text-[11px] text-stone-400">
                  Represents {c.representsCountryIso} · in {c.city ?? c.hostCountryIso}
                </div>
                {c.jurisdictionNote && (
                  <div className="mt-1 text-[11px] text-stone-500">{c.jurisdictionNote}</div>
                )}
                <div className="mt-1 text-[10px] uppercase tracking-wide text-amber-200/60">
                  Verify before use
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
