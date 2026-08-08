"use client";

/**
 * HighValueAssetCommandCenter — operator surface extending the Maritime vertical.
 * Honest empty states; responsive; no fake revenue/clients; no approval claims.
 */

import { useState } from "react";
import { ASSET_DOCUMENT_REGISTRY } from "@/lib/high-value-assets/documentRegistry";
import { HVA_REQUIRED_DISCLAIMER } from "@/lib/high-value-assets/safetyGuard";

const SECTIONS = [
  "Asset Matters", "Risk & Review Flags", "Document Families",
  "Maritime Bridge", "Pricing Context", "Operator Actions",
] as const;
type Section = (typeof SECTIONS)[number];

function Empty({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] px-4 py-6 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/40">{label}</p>
    </div>
  );
}

export function HighValueAssetCommandCenter() {
  const [active, setActive] = useState<Section>("Asset Matters");

  return (
    <section className="rounded-2xl border border-[var(--ms-gold)]/20 bg-[#08080A]/90 p-4 sm:p-5">
      <div className="mb-4">
        <p className="font-mono text-[8px] uppercase tracking-[0.28em] text-[var(--ms-gold)]/70">High-Value Asset Intelligence</p>
        <h3 className="font-serif text-lg text-white">High-Value Asset Document Execution</h3>
      </div>

      <div className="mb-4">
        <select
          value={active}
          onChange={(e) => setActive(e.target.value as Section)}
          className="w-full rounded-lg border border-white/[0.1] bg-[#050507] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-white/70 sm:hidden"
          aria-label="High-value asset section"
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

      <div className="min-h-[200px]">
        {active === "Asset Matters" && <Empty label="No high-value asset matters recorded" />}
        {active === "Risk & Review Flags" && <Empty label="No review flags — matters route to specialist review when created" />}
        {active === "Maritime Bridge" && <Empty label="Vessel/marine matters bridge into the Maritime vertical" />}
        {active === "Pricing Context" && <Empty label="Pricing is operator-prepared via the canonical gateway" />}
        {active === "Operator Actions" && <Empty label="No operator actions recorded" />}
        {active === "Document Families" && (
          <div className="grid gap-1.5">
            {ASSET_DOCUMENT_REGISTRY.map((d) => (
              <div key={d.family} className="rounded-lg border border-white/[0.055] bg-white/[0.015] px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] text-white/70">{d.label}</span>
                  {d.reviewRequired && <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-amber-300/70">Review required</span>}
                </div>
                <div className="mt-0.5 text-[10px] text-white/40">{d.clientSafeDescription}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-4 font-mono text-[8px] leading-relaxed text-white/25">{HVA_REQUIRED_DISCLAIMER}</p>
    </section>
  );
}
