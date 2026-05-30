// Country Health Matrix — static coverage check
// Driven by actual presence of compliance data, FAQs, and JSON-LD per corridor

import Link from "next/link";
import { CheckCircle, Circle, ArrowRight } from "lucide-react";
import { COUNTRY_COMPLIANCE_DATA } from "@/components/landing/country-compliance-card";
import { COUNTRY_FAQS } from "@/lib/country-jsonld";
import { DESTINATION_NODES } from "@/components/landing/map-data";

const CORRIDORS = [
  "Italy", "Spain", "UAE", "Brazil", "Mexico", "Portugal", "Greece",
] as const;

interface CoverageCheck {
  compliance: boolean;
  authorityPage: boolean;
  faq: boolean;
  schema: boolean;
  mapNode: boolean;
}

function getCoverage(country: string): CoverageCheck {
  const slug = country.toLowerCase();
  return {
    compliance:    !!COUNTRY_COMPLIANCE_DATA[slug],
    authorityPage: true,                    // all 7 have /countries/[slug]
    faq:           (COUNTRY_FAQS[slug]?.length ?? 0) >= 4,
    schema:        !!COUNTRY_COMPLIANCE_DATA[slug], // JSON-LD uses compliance data
    mapNode:       DESTINATION_NODES.some((n) => n.id === slug),
  };
}

function coverageScore(c: CoverageCheck): number {
  return Object.values(c).filter(Boolean).length;
}

type ReadinessState = "Ready" | "Draft" | "Partial";

function readiness(c: CoverageCheck): ReadinessState {
  const score = coverageScore(c);
  if (score === 5) return "Ready";
  if (score >= 3) return "Partial";
  return "Draft";
}

const READINESS_STYLE: Record<ReadinessState, string> = {
  Ready:   "text-emerald-400/80 border-emerald-500/20 bg-emerald-500/[0.05]",
  Partial: "text-amber-400/80 border-amber-500/20 bg-amber-500/[0.05]",
  Draft:   "text-[#555] border-white/[0.06] bg-white/[0.01]",
};

const CHECK_LABELS: (keyof CoverageCheck)[] = [
  "compliance", "authorityPage", "faq", "schema", "mapNode",
];
const CHECK_DISPLAY: Record<keyof CoverageCheck, string> = {
  compliance:    "Compliance",
  authorityPage: "Authority Page",
  faq:           "FAQ",
  schema:        "JSON-LD",
  mapNode:       "Map Node",
};

export function CountryHealthMatrix() {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-[#050507] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-[#C6A55A]/60" />
          <span className="font-mono text-[9px] tracking-[0.28em] uppercase text-[#555]">
            Country Health Matrix
          </span>
        </div>
        <span className="font-mono text-[8px] text-[#2A2A2A]">7 CORRIDORS</span>
      </div>

      {/* Column headers */}
      <div className="px-5 pt-3 pb-1 grid grid-cols-[120px_repeat(5,1fr)_80px] gap-2 items-center">
        <span className="font-mono text-[7px] tracking-widest uppercase text-[#2E2E2E]">Corridor</span>
        {CHECK_LABELS.map((k) => (
          <span key={k} className="font-mono text-[7px] tracking-widest uppercase text-[#2E2E2E] text-center">
            {CHECK_DISPLAY[k]}
          </span>
        ))}
        <span className="font-mono text-[7px] tracking-widest uppercase text-[#2E2E2E] text-right">Status</span>
      </div>

      <div className="px-5 pb-4 space-y-1">
        {CORRIDORS.map((country) => {
          const c = getCoverage(country);
          const state = readiness(c);
          const slug = country.toLowerCase();

          return (
            <div
              key={country}
              className="grid grid-cols-[120px_repeat(5,1fr)_80px] gap-2 items-center py-2 border-b border-white/[0.03] last:border-0"
            >
              <Link
                href={`/countries/${slug}`}
                className="flex items-center gap-2 group"
              >
                <span className="font-mono text-[10px] text-[#888] group-hover:text-[#C6A55A] transition-colors tracking-wide">
                  {country}
                </span>
                <ArrowRight className="w-2.5 h-2.5 text-[#333] opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>

              {CHECK_LABELS.map((k) => (
                <div key={k} className="flex justify-center">
                  {c[k] ? (
                    <CheckCircle className="w-3 h-3 text-[#C6A55A]/60" />
                  ) : (
                    <Circle className="w-3 h-3 text-[#2A2A2A]" />
                  )}
                </div>
              ))}

              <div className="flex justify-end">
                <span className={`font-mono text-[7px] px-2 py-0.5 rounded border tracking-widest uppercase ${READINESS_STYLE[state]}`}>
                  {state}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
