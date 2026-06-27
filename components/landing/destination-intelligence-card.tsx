/* ms-allow-critical-overflow-hidden: overflow-hidden here is decorative (rounded corners + top accent line); the card self-sizes and never clips its own content. */
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  Languages,
  PackageCheck,
  Route,
} from "lucide-react";
import type { Destination } from "@/data/destinations";
import { getCorridorIntel } from "@/data/corridor-intel";
import { getPublicCountryExecutionIntelligence } from "@/data/public-country-intelligence";
import ExecutionComplianceBoundary from "@/components/intelligence/ExecutionComplianceBoundary";

export type DestinationCardVariant =
  | "globePreview"
  | "homepagePreview"
  | "atlas"
  | "countryDirectory";

export interface DestinationIntelligence {
  slug: string;
  name: string;
  flag?: string;
  routeLabel: string;
  statusLabel: string;
  summary: string;
  documents: string[];
  seoLine: string;
  translationReview: boolean;
  courierReview: boolean;
  pathPreview: string[];
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
    "w-[min(310px,calc(100vw-2rem))] rounded-xl border border-[var(--ms-gold)]/25 bg-[#050507]/95 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.78),inset_0_0_24px_rgba(198,165,90,0.035)]",
  homepagePreview:
    "h-full rounded-2xl border border-[var(--ms-gold)]/20 bg-[#070709]/95 p-5 sm:p-7 shadow-[0_28px_80px_rgba(0,0,0,0.48),inset_0_0_28px_rgba(198,165,90,0.035)]",
  atlas:
    "rounded-xl border border-[var(--ms-gold)]/16 bg-black/45 p-4 shadow-[inset_0_0_24px_rgba(198,165,90,0.025)]",
  countryDirectory:
    "h-full rounded-2xl border border-white/[0.08] bg-[#0B0B0D] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.28),inset_0_0_24px_rgba(198,165,90,0.025)]",
};

const ROUTE_COPY: Record<string, string> = {
  italy: "Florida to Italy apostille support",
  spain: "U.S. documents for use in Spain",
  brazil: "International document execution for Brazil",
  uae: "Consular authentication review for UAE",
};

function documentChips(destination: Destination): string[] {
  const noteDocuments = destination.note
    .split("·")
    .map((item) => item.trim())
    .filter(Boolean);

  return Array.from(
    new Set([...destination.commonDocuments, ...noteDocuments]),
  ).slice(0, 5);
}

export function buildDestinationIntelligence(
  destination: Destination,
): DestinationIntelligence {
  const corridor = getCorridorIntel(destination.slug, destination.hague);
  const verificationRequired = destination.slug === "uae";
  const hagueRoute = destination.hague || destination.slug === "mexico";
  const routeLabel = verificationRequired
    ? "Legalization Review Required"
    : hagueRoute
      ? "Hague Apostille Route"
      : "Consular Authentication Route";
  const statusLabel = verificationRequired
    ? "Verification Required"
    : hagueRoute
      ? "Hague Member"
      : "Non-Hague Route";
  const routeProcess = verificationRequired
    ? "receiving-authority and consular review"
    : hagueRoute
      ? "apostille coordination"
      : "authentication and consular review";

  return {
    slug: destination.slug,
    name: destination.name,
    flag: destination.flag,
    routeLabel,
    statusLabel,
    summary: `Florida-origin documents intended for ${destination.name} may require notarization review, ${routeProcess}, and secure release depending on the receiving authority.`,
    documents: documentChips(destination),
    seoLine:
      ROUTE_COPY[destination.slug] ??
      `International document execution for ${destination.name}`,
    translationReview:
      corridor.translationRequired ||
      destination.executionPath.some((step) => /translation/i.test(step)),
    courierReview: destination.executionPath.some((step) =>
      /courier|delivery|release/i.test(step),
    ),
    pathPreview: [
      "Verify document type",
      "Confirm destination requirements",
      "Prepare secure intake pathway",
    ],
  };
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
  const intakeHref = `/intake?destination=${encodeURIComponent(data.slug)}&country=${encodeURIComponent(data.name)}${matter ? `&matter=${encodeURIComponent(matter)}` : ""}`;
  const secondaryHref =
    variant === "countryDirectory"
      ? `/countries/${data.slug}`
      : variant === "globePreview"
        ? "/map"
        : `/countries/${data.slug}`;
  const secondaryLabel =
    variant === "globePreview"
      ? "Open Global Atlas"
      : variant === "homepagePreview"
        ? "View Country Requirements"
        : "View Requirements";

  return (
    <article
      data-critical-card=""
      className={`group relative overflow-hidden transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-[var(--ms-gold)]/38 hover:shadow-[0_24px_70px_rgba(0,0,0,0.5),inset_0_0_30px_rgba(198,165,90,0.05)] motion-reduce:transform-none motion-reduce:transition-none ${SURFACE_CLASSES[variant]} ${className}`}
      aria-label={`${data.name} document routing preview`}
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
            <p className="font-mono text-[8px] uppercase tracking-[0.22em] text-[var(--ms-gold)]/55">
              {directory ? "Priority Corridor" : "Execution Intelligence"}
            </p>
            <h3
              className={`${compact ? "text-lg" : "text-2xl"} mt-1 font-serif text-white`}
            >
              {data.name}
            </h3>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[7px] uppercase tracking-[0.12em] ${
            data.statusLabel === "Hague Member"
              ? "border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-300/80"
              : "border-amber-500/25 bg-amber-500/[0.06] text-amber-300/80"
          }`}
        >
          {data.statusLabel}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Route className="h-3.5 w-3.5 shrink-0 text-[var(--ms-gold)]" />
        <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--ms-gold)]/80">
          {data.routeLabel}
        </p>
      </div>

      <p className={`${compact ? "text-[11px]" : "text-sm"} mt-3 leading-relaxed text-white/52`}>
        {data.summary}
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {data.documents.slice(0, compact ? 3 : 5).map((document) => (
          <span
            key={document}
            className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.018] px-2.5 py-1 text-[9px] text-white/55"
          >
            <CheckCircle2 className="h-2.5 w-2.5 text-[var(--ms-gold)]/65" />
            {document}
          </span>
        ))}
      </div>

      {!directory && (
        <div className={`mt-4 grid ${compact ? "gap-1.5" : "gap-2 sm:grid-cols-3"}`}>
          {data.pathPreview.map((step, index) => (
            <div
              key={step}
              className="flex items-start gap-2 rounded-lg border border-white/[0.055] bg-white/[0.015] px-2.5 py-2"
            >
              <span className="font-mono text-[8px] text-[var(--ms-gold)]/65">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-[9px] leading-4 text-white/42">{step}</span>
            </div>
          ))}
        </div>
      )}

      {!compact && !directory && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            {
              Icon: FileCheck2,
              label: data.statusLabel === "Hague Member" ? "Apostille review" : "Authentication review",
              active: true,
            },
            { Icon: Languages, label: "Translation review", active: data.translationReview },
            { Icon: PackageCheck, label: "Courier / release", active: data.courierReview },
          ].map(({ Icon, label, active }) => (
            <div key={label} className="rounded-lg border border-white/[0.055] p-2.5">
              <Icon className={`h-3.5 w-3.5 ${active ? "text-[var(--ms-gold)]" : "text-white/20"}`} />
              <p className="mt-2 text-[9px] leading-4 text-white/42">{label}</p>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-[10px] leading-5 text-[var(--ms-gold)]/48">
        {data.seoLine}
      </p>

      <ExecutionComplianceBoundary
        text={getPublicCountryExecutionIntelligence(data.slug, data.name).complianceBoundary}
        className="mt-3"
      />

      <div className={`mt-4 flex ${compact ? "gap-2" : "flex-col gap-2 sm:flex-row"}`}>
        <Link
          href={intakeHref}
          onClick={onPrimaryAction}
          aria-label={`Start controlled intake for ${data.name}`}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--ms-gold)] px-3 py-2.5 font-mono text-[8px] font-bold uppercase tracking-[0.11em] text-[#050507] transition-colors hover:bg-[#D4B76A]"
        >
          Start Controlled Intake
          <ArrowRight className="h-3 w-3" />
        </Link>
        <Link
          href={secondaryHref}
          aria-label={`${secondaryLabel} for ${data.name}`}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--ms-gold)]/22 px-3 py-2.5 font-mono text-[8px] uppercase tracking-[0.1em] text-[var(--ms-gold)]/78 transition-colors hover:border-[var(--ms-gold)]/50 hover:text-[var(--ms-gold)]"
        >
          {secondaryLabel}
        </Link>
      </div>
    </article>
  );
}
