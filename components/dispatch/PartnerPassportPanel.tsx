"use client";

import type { PartnerPassport } from "@/lib/dispatch/types";
import { isPassportIssued } from "@/lib/dispatch/partnerPassport";

export function PartnerPassportPanel({
  passports = [],
}: {
  passports?: PartnerPassport[];
}) {
  return (
    <section className="rounded-2xl border border-amber-300/15 bg-black/50 p-5">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
        Partner Passports
      </h2>
      <p className="mb-4 text-[11px] text-stone-500">
        A partner passport summarizes an independent partner&apos;s own standing.
        It never exposes internal notes, margins, or unrelated matters.
      </p>

      {passports.length === 0 ? (
        <p className="rounded-xl border border-amber-300/10 bg-black/40 px-3 py-6 text-center text-xs text-stone-500">
          No issued passports yet.
        </p>
      ) : (
        <div className="space-y-2">
          {passports.map((p) => (
            <div
              key={p.partnerId}
              className="rounded-xl border border-amber-300/10 bg-black/40 px-3 py-2 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-amber-100">{p.displayName}</span>
                <span className="uppercase tracking-[0.14em] text-amber-200/60">
                  {p.trustBand} · {p.status}
                </span>
              </div>
              <p className="mt-1 text-stone-400">
                Regions: {p.regions.join(", ") || "—"} · Completed:{" "}
                {p.completedAssignments} ·{" "}
                {isPassportIssued(p) ? "issued" : "not issued"}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
