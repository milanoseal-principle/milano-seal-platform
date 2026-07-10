"use client";

import Link from "next/link";
import { useState } from "react";
import { resolveCta } from "@/lib/acquisition/dynamicCtaEngine";
import type { ClientVertical } from "@/lib/acquisition/types";

const VERTICALS: { value: ClientVertical; label: string }[] = [
  { value: "attorney", label: "Attorney" },
  { value: "university", label: "University" },
  { value: "healthcare", label: "Healthcare" },
  { value: "immigration_professional", label: "Immigration Pro" },
  { value: "airport_emergency", label: "Airport Emergency" },
  { value: "general", label: "General" },
];

export function DynamicCTA({ country }: { country?: string | null }) {
  const [vertical, setVertical] = useState<ClientVertical>("attorney");
  const cta = resolveCta({ vertical, country });

  return (
    <section className="rounded-2xl border border-amber-300/15 bg-black/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-100">
          Dynamic CTA
        </h2>
        <span className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
          Preview
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {VERTICALS.map((v) => (
          <button
            key={v.value}
            type="button"
            onClick={() => setVertical(v.value)}
            className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.14em] transition ${
              vertical === v.value
                ? "border-amber-300/60 text-amber-100"
                : "border-amber-300/10 text-stone-500 hover:text-stone-300"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-amber-300/10 bg-black/40 p-4">
        <p className="text-xs text-stone-400">{cta.note}</p>
        <Link
          href={cta.href}
          className="mt-3 inline-flex min-h-11 items-center rounded-full bg-amber-200 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-black"
        >
          {cta.label}
        </Link>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-stone-600">
          Routes to {cta.href}
        </p>
      </div>
    </section>
  );
}
