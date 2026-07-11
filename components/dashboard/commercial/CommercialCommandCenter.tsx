"use client";

/**
 * CommercialCommandCenter — unified commercial operator surface across the 15
 * verticals. Config + honest empty states; no fabricated organizations,
 * relationships, revenue, or forecasts. Responsive.
 */

import { useState } from "react";
import { VERTICAL_REGISTRY } from "@/lib/vertical-intelligence/verticalRegistry";
import { listRealCommercialAccounts, totalRealAccountRevenue } from "@/lib/commercial-accounts/accountRegistry";
import { FORECAST_LABEL } from "@/lib/vertical-intelligence/verticalIntelligenceSafety";

const SECTIONS = ["Today", "Verticals", "Accounts", "Relationships", "Forecast"] as const;
type Section = (typeof SECTIONS)[number];

function Empty({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] px-4 py-6 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/40">{label}</p>
    </div>
  );
}

export function CommercialCommandCenter() {
  const [active, setActive] = useState<Section>("Today");
  const realAccounts = listRealCommercialAccounts();
  const realRevenue = totalRealAccountRevenue();

  return (
    <section className="rounded-2xl border border-[var(--ms-gold)]/20 bg-[#08080A]/90 p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[8px] uppercase tracking-[0.28em] text-[var(--ms-gold)]/70">Commercial Command Center</p>
          <h3 className="font-serif text-lg text-white">What commercial action is next?</h3>
        </div>
        <div className="rounded-full border border-emerald-500/25 bg-emerald-500/[0.06] px-3 py-1">
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-emerald-300/80">
            Verified account revenue: ${realRevenue.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <select
          value={active}
          onChange={(e) => setActive(e.target.value as Section)}
          className="w-full rounded-lg border border-white/[0.1] bg-[#050507] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-white/70 sm:hidden"
          aria-label="Commercial section"
        >
          {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="hidden flex-wrap gap-1.5 sm:flex">
          {SECTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setActive(s)}
              className={`min-h-9 rounded-lg border px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors ${
                active === s
                  ? "border-[var(--ms-gold)]/55 bg-[var(--ms-gold)]/[0.08] text-[var(--ms-gold)]"
                  : "border-white/[0.06] text-white/45 hover:border-[var(--ms-gold)]/25 hover:text-white/70"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[180px]">
        {active === "Today" && <Empty label="No commercial actions recorded" />}
        {active === "Accounts" && (realAccounts.length === 0 ? <Empty label="No active commercial accounts (no paid evidence yet)" /> : null)}
        {active === "Relationships" && <Empty label="No documented interactions recorded" />}
        {active === "Forecast" && (
          <div>
            <Empty label="No weighted pipeline yet" />
            <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.14em] text-white/25">{FORECAST_LABEL}</p>
          </div>
        )}
        {active === "Verticals" && (
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {VERTICAL_REGISTRY.map((v) => (
              <div key={v.id} className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.055] bg-white/[0.015] px-3 py-2">
                <span className="text-[12px] text-white/70">{v.name}</span>
                {v.reuses && <span className="flex-shrink-0 font-mono text-[7px] uppercase tracking-[0.12em] text-[var(--ms-gold)]/60">reuses</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
