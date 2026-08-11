"use client";

/**
 * TopicalAuthorityCommandCenter — pillar coverage over the topic graph. No fake
 * rankings / impressions / traffic / backlinks; Search Console data only when a
 * real integration exists (none here → honest empty states).
 */

import { useMemo, useState } from "react";
import { AUTHORITY_PILLARS } from "@/lib/topical-authority/topicRegistry";
import { allTopics } from "@/lib/topical-authority/contentRegistry";
import { detectOrphans } from "@/lib/topical-authority/internalLinkEngine";

const SECTIONS = ["Pillar Coverage", "Orphan Pages", "Search Console"] as const;
type Section = (typeof SECTIONS)[number];

export function TopicalAuthorityCommandCenter() {
  const [active, setActive] = useState<Section>("Pillar Coverage");
  const topics = useMemo(() => allTopics(), []);
  const orphans = useMemo(() => detectOrphans(topics), [topics]);

  return (
    <section className="rounded-2xl border border-[var(--ms-gold)]/20 bg-[#08080A]/90 p-4 sm:p-5">
      <div className="mb-4">
        <p className="font-mono text-[8px] uppercase tracking-[0.28em] text-[var(--ms-gold)]/70">Topical Authority</p>
        <h3 className="font-serif text-lg text-white">Sixteen Authority Pillars</h3>
      </div>

      <div className="mb-4">
        <select
          value={active}
          onChange={(e) => setActive(e.target.value as Section)}
          className="w-full rounded-lg border border-white/[0.1] bg-[#050507] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-white/70 sm:hidden"
          aria-label="Topical authority section"
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
        {active === "Pillar Coverage" && (
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {AUTHORITY_PILLARS.map((p) => {
              const count = topics.filter((t) => t.pillarId === p.id).length;
              return (
                <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.055] bg-white/[0.015] px-3 py-2">
                  <span className="text-[12px] text-white/70">{p.name}</span>
                  <span className="flex-shrink-0 font-mono text-[10px] text-[var(--ms-gold)]/70">{count} topic{count === 1 ? "" : "s"}</span>
                </div>
              );
            })}
          </div>
        )}
        {active === "Orphan Pages" && (
          orphans.orphans.length === 0
            ? <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] px-4 py-6 text-center"><p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/40">No orphan pages — every topic links to intake and its pillar</p></div>
            : (
              <div className="grid gap-1.5">
                {orphans.orphans.map((t) => (
                  <div key={t.id} className="rounded-lg border border-amber-500/20 bg-amber-500/[0.04] px-3 py-2 text-[12px] text-amber-200/70">{t.name} · {t.primaryRoute}</div>
                ))}
              </div>
            )
        )}
        {active === "Search Console" && (
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] px-4 py-6 text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/40">No Search Console integration connected</p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-white/25">Rankings / impressions shown only from a real integration</p>
          </div>
        )}
      </div>
    </section>
  );
}
