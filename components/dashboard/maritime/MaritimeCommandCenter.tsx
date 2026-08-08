"use client";

/**
 * MaritimeCommandCenter — operator surface for the Maritime & Global Logistics
 * vertical. Reuses canonical engines (pricing gateway, trust-chain events,
 * operator actions). Honest empty states where no real data exists; real vs
 * sample data always labelled. Responsive: mobile select + wrapping tabs,
 * stacked cards.
 */

import { useState } from "react";
import { MARITIME_SERVICE_LANES, MARITIME_PUBLIC_PRICING_STATEMENT } from "@/lib/maritime/pricing/maritimePricingAdapter";
import { MARITIME_DOCUMENT_REGISTRY } from "@/lib/maritime/documents/maritimeDocumentRegistry";
import { listRealActiveAccounts } from "@/lib/maritime/accounts/commercialAccount";
import { MARITIME_SAFETY_NOTICE } from "@/lib/maritime/maritimeSafety";

const SECTIONS = [
  "Today", "Urgent Deadlines", "Shipment Matters", "Commercial Accounts",
  "Document Readiness", "Service Lanes", "Courier Cutoffs", "Partner Follow-Up",
] as const;
type Section = (typeof SECTIONS)[number];

function Empty({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] px-4 py-6 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/40">{label}</p>
    </div>
  );
}

export function MaritimeCommandCenter() {
  const [active, setActive] = useState<Section>("Today");
  const activeAccounts = listRealActiveAccounts();

  return (
    <section className="rounded-2xl border border-[var(--ms-gold)]/20 bg-[#08080A]/90 p-4 sm:p-5">
      <div className="mb-4">
        <p className="font-mono text-[8px] uppercase tracking-[0.28em] text-[var(--ms-gold)]/70">Maritime Command Center</p>
        <h3 className="font-serif text-lg text-white">Maritime &amp; Global Logistics Execution</h3>
      </div>

      <div className="mb-4">
        <select
          value={active}
          onChange={(e) => setActive(e.target.value as Section)}
          className="w-full rounded-lg border border-white/[0.1] bg-[#050507] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-white/70 sm:hidden"
          aria-label="Maritime section"
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
        {active === "Today" && <Empty label="No urgent maritime matters recorded" />}
        {active === "Urgent Deadlines" && <Empty label="No confirmed deadlines recorded" />}
        {active === "Shipment Matters" && <Empty label="No shipment matters recorded" />}
        {active === "Commercial Accounts" && (
          activeAccounts.length === 0
            ? <Empty label="No active commercial accounts (no paid evidence yet)" />
            : null
        )}
        {active === "Document Readiness" && (
          <div className="grid gap-1.5">
            <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">Maritime document families (review-dependent)</p>
            {MARITIME_DOCUMENT_REGISTRY.map((d) => (
              <div key={d.family} className="rounded-lg border border-white/[0.055] bg-white/[0.015] px-3 py-2">
                <div className="text-[12px] text-white/70">{d.label}</div>
                <div className="mt-0.5 text-[10px] text-white/40">{d.reviewNotes}</div>
              </div>
            ))}
          </div>
        )}
        {active === "Service Lanes" && (
          <div className="grid gap-1.5">
            {MARITIME_SERVICE_LANES.map((l) => (
              <div key={l.lane} className="rounded-lg border border-white/[0.055] bg-white/[0.015] px-3 py-2 text-[12px] text-white/70">{l.label}</div>
            ))}
            <p className="mt-2 font-mono text-[9px] leading-relaxed text-white/35">{MARITIME_PUBLIC_PRICING_STATEMENT}</p>
          </div>
        )}
        {active === "Courier Cutoffs" && <Empty label="No courier cutoffs recorded" />}
        {active === "Partner Follow-Up" && <Empty label="No partner follow-ups recorded" />}
      </div>

      <p className="mt-4 font-mono text-[8px] leading-relaxed text-white/25">{MARITIME_SAFETY_NOTICE}</p>
    </section>
  );
}
