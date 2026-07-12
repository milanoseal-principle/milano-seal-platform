"use client";

/**
 * UnifiedRevenueCommandCenter — the ten-channel revenue overview. Config + honest
 * empty states only; no data fetching here (the live pipeline stays in the page).
 * Real paid revenue is separated from planning scenarios, which are labelled.
 */

import { REVENUE_CHANNELS } from "@/lib/revenue-stack/channelRegistry";
import { realPaidRevenue } from "@/lib/revenue-stack/revenueOpportunity";
import { PLANNING_SCENARIO_LABEL } from "@/lib/revenue-stack/revenueSafety";

export function UnifiedRevenueCommandCenter() {
  const paid = realPaidRevenue();

  return (
    <section className="rounded-2xl border border-[var(--ms-gold)]/20 bg-[#08080A]/90 p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[8px] uppercase tracking-[0.28em] text-[var(--ms-gold)]/70">Unified Revenue Stack</p>
          <h3 className="font-serif text-lg text-white">Ten Revenue Channels</h3>
        </div>
        <div className="rounded-full border border-emerald-500/25 bg-emerald-500/[0.06] px-3 py-1">
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-emerald-300/80">
            Verified paid revenue: ${paid.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {REVENUE_CHANNELS.map((c) => (
          <div key={c.channel} className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-3">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[13px] text-white/75">{c.name}</span>
              {c.reusesVertical && (
                <span className="flex-shrink-0 rounded-full border border-[var(--ms-gold)]/25 px-2 py-0.5 font-mono text-[7px] uppercase tracking-[0.12em] text-[var(--ms-gold)]/70">
                  reuses vertical
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] leading-snug text-white/45">{c.audience}</p>
            <p className="mt-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-white/30">CTA · {c.primaryCta}</p>
          </div>
        ))}
      </div>

      <p className="mt-4 font-mono text-[8px] uppercase tracking-[0.16em] text-white/25">{PLANNING_SCENARIO_LABEL}</p>
    </section>
  );
}
