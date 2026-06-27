import Link from "next/link";
import { ArrowRight, CheckCircle2, Route } from "lucide-react";
import type { Destination } from "@/data/destinations";
import { getCountryExecutionIntelligence } from "@/data/country-execution-intelligence";
import { getPublicCountryCompliance } from "@/data/global-compliance-atlas";

export type DestinationCardVariant =
  | "globePreview"
  | "homepagePreview"
  | "atlas"
  | "countryDirectory";

export interface DestinationIntelligence {
  slug: string;
  name: string;
  flag?: string;
  eyebrow: string;
  routeLabel: string;
  statusLabel: string;
  summary: string;
  documents: string[];
  seoLine: string;
  translationReview: boolean;
  courierReview: boolean;
  pathPreview: string[];
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  publicRouteLabel?: string;
  receivingAuthorityBoundary?: string;
}

interface DestinationIntelligenceCardProps {
  destination?: Destination;
  intelligence?: DestinationIntelligence;
  variant: DestinationCardVariant;
  matter?: string | null;
  onPrimaryAction?: () => void;
  className?: string;
}

const SURFACE_CLASSES: Record<DestinationCardVariant, string> = {
  globePreview:
    "w-[min(310px,calc(100vw-2rem))] rounded-xl border border-[#C6A55A]/25 bg-[#050507]/95 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.78),inset_0_0_24px_rgba(198,165,90,0.035)]",
  homepagePreview:
    "h-full rounded-2xl border border-[#C6A55A]/20 bg-[#070709]/95 p-5 sm:p-7 shadow-[0_28px_80px_rgba(0,0,0,0.48),inset_0_0_28px_rgba(198,165,90,0.035)]",
  atlas:
    "rounded-xl border border-[#C6A55A]/16 bg-black/45 p-4 shadow-[inset_0_0_24px_rgba(198,165,90,0.025)]",
  countryDirectory:
    "h-full rounded-2xl border border-white/[0.08] bg-[#0B0B0D] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.28),inset_0_0_24px_rgba(198,165,90,0.025)]",
};

export function buildDestinationIntelligence(
  destination: Destination,
): DestinationIntelligence {
  const intelligence = getCountryExecutionIntelligence(
    destination.slug,
    destination.name,
  );
  const compliance = getPublicCountryCompliance(destination.slug);

  return {
    slug: destination.slug,
    name: intelligence.displayName,
    flag: intelligence.flag ?? destination.flag,
    eyebrow: intelligence.eyebrow,
    routeLabel: intelligence.routeLabel,
    statusLabel: intelligence.statusPill,
    summary: intelligence.authoritySummary,
    documents: intelligence.executionFlags,
    seoLine: intelligence.trustLine,
    translationReview: intelligence.executionFlags.some((flag) =>
      /translation/i.test(flag),
    ),
    courierReview: intelligence.executionFlags.some((flag) =>
      /courier|release|custody/i.test(flag),
    ),
    pathPreview: intelligence.executionPath,
    primaryCtaLabel: intelligence.primaryCtaLabel,
    secondaryCtaLabel: intelligence.secondaryCtaLabel,
    publicRouteLabel: compliance.publicRouteLabel,
    receivingAuthorityBoundary: compliance.receivingAuthorityBoundary,
  };
}

function statusClass(statusLabel: string) {
  if (statusLabel === "HAGUE MEMBER") {
    return "border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-300/80";
  }

  if (statusLabel === "CONSULAR REVIEW") {
    return "border-amber-500/25 bg-amber-500/[0.06] text-amber-300/80";
  }

  return "border-[#C6A55A]/25 bg-[#C6A55A]/[0.06] text-[#E1C36F]/85";
}

export function DestinationIntelligenceCard({
  destination,
  intelligence,
  variant,
  matter,
  onPrimaryAction,
  className = "",
}: DestinationIntelligenceCardProps) {
  const data =
    intelligence ??
    (destination ? buildDestinationIntelligence(destination) : null);

  if (!data) return null;

  const compact = variant === "globePreview" || variant === "atlas";
  const directory = variant === "countryDirectory";
  const visiblePath = data.pathPreview.slice(0, compact ? 3 : 4);
  const intakeHref = `/intake?destination=${encodeURIComponent(data.slug)}&country=${encodeURIComponent(data.name)}${matter ? `&matter=${encodeURIComponent(matter)}` : ""}`;

  return (
    <article
      data-critical-card
      className={`group relative overflow-hidden transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-[#C6A55A]/38 hover:shadow-[0_24px_70px_rgba(0,0,0,0.5),inset_0_0_30px_rgba(198,165,90,0.05)] motion-reduce:transform-none motion-reduce:transition-none ${SURFACE_CLASSES[variant]} ${className}`}
      aria-label={`${data.name} execution intelligence preview`}
    >
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#E1C36F]/70 to-transparent opacity-70" />

      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {data.flag && (
            <span className={compact ? "text-xl" : "text-3xl"} aria-hidden="true">
              {data.flag}
            </span>
          )}
          <div className="min-w-0">
            <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-[#C6A55A]/65">
              {data.eyebrow}
            </p>
            <h3
              className={`${compact ? "text-lg" : "text-2xl"} mt-1 whitespace-normal break-words font-serif text-white`}
            >
              {data.name}
            </h3>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[7px] uppercase tracking-[0.12em] ${statusClass(data.statusLabel)}`}
        >
          {data.statusLabel}
        </span>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-[#C6A55A]/10 bg-[#C6A55A]/[0.025] px-3 py-2">
        <Route className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C6A55A]" />
        <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#C6A55A]/85">
          {data.publicRouteLabel ?? data.routeLabel}
        </p>
      </div>

      <p className={`${compact ? "text-[11px]" : "text-sm"} mt-3 leading-relaxed text-white/58`}>
        {data.summary}
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {data.documents.slice(0, compact ? 3 : 5).map((document) => (
          <span
            key={document}
            className="inline-flex items-center gap-1 rounded-full border border-[#C6A55A]/12 bg-white/[0.018] px-2.5 py-1 text-[9px] text-white/60"
          >
            <CheckCircle2 className="h-2.5 w-2.5 text-[#C6A55A]/70" />
            {document}
          </span>
        ))}
      </div>

      {!directory && (
        <div className={`mt-4 grid ${compact ? "gap-1.5" : "gap-2 sm:grid-cols-3"}`}>
          {visiblePath.map((step, index) => (
            <div
              key={step}
              className="flex items-start gap-2 rounded-lg border border-white/[0.055] bg-white/[0.015] px-2.5 py-2"
            >
              <span className="font-mono text-[8px] text-[#C6A55A]/70">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-[9px] leading-4 text-white/48">{step}</span>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 border-t border-white/[0.06] pt-3 text-[10px] leading-5 text-[#C6A55A]/55">
        {data.receivingAuthorityBoundary ?? data.seoLine}
      </p>

      <div className={`mt-4 flex ${compact ? "gap-2" : "flex-col gap-2 sm:flex-row"}`}>
        <Link
          href={intakeHref}
          onClick={onPrimaryAction}
          aria-label={`${data.primaryCtaLabel} for ${data.name}`}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[#C6A55A] px-3 py-2.5 font-mono text-[8px] font-bold uppercase tracking-[0.11em] text-[#050507] transition-colors hover:bg-[#D4B76A]"
        >
          {data.primaryCtaLabel}
          <ArrowRight className="h-3 w-3" />
        </Link>
        <Link
          href="/map"
          aria-label={`${data.secondaryCtaLabel} for ${data.name}`}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[#C6A55A]/22 px-3 py-2.5 font-mono text-[8px] uppercase tracking-[0.1em] text-[#C6A55A]/78 transition-colors hover:border-[#C6A55A]/50 hover:text-[#C6A55A]"
        >
          {data.secondaryCtaLabel}
        </Link>
      </div>
    </article>
  );
}
