import Link from "next/link";
import { PublicShell } from "@/components/layout/PublicShell";
import type { LocalizedSeoRecord } from "@/lib/seo/localization/types";

function sectionLabel(key: string) {
  return key.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function LocalizedAcquisitionPage({ record }: { record: LocalizedSeoRecord }) {
  return (
    <PublicShell>
      <main className="min-h-screen bg-[#0A0A0A] text-white">
        <section className="border-b border-white/10 px-6 pb-16 pt-32 md:pb-20 md:pt-40">
          <div className="mx-auto max-w-5xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--ms-gold)]">
              The Milano Seal™ · {record.locale}
            </p>
            <h1 className="mt-5 max-w-4xl font-serif text-4xl font-normal leading-tight md:text-6xl">
              {record.h1}
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-white/65 md:text-lg">
              {record.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/intake?source=localized-seo&language=${encodeURIComponent(record.locale)}&landing_page=${encodeURIComponent(record.path)}`}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--ms-gold)] px-6 text-sm font-semibold text-black transition-opacity hover:opacity-90"
              >
                {record.ctaLabel}
              </Link>
              <Link
                href={record.englishEquivalent}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-6 text-sm text-white/80 transition-colors hover:border-white/30 hover:text-white"
              >
                {record.englishVersionLabel}
              </Link>
            </div>
          </div>
        </section>

        <section className="px-6 py-14 md:py-20">
          <div className="mx-auto grid max-w-5xl gap-10">
            {Object.entries(record.bodySections).map(([key, value]) => (
              <section key={key} className="border-b border-white/8 pb-10 last:border-b-0">
                <h2 className="font-serif text-2xl font-normal md:text-3xl">{sectionLabel(key)}</h2>
                <p className="mt-4 max-w-4xl whitespace-pre-line text-[15px] leading-8 text-white/62 md:text-base">
                  {value}
                </p>
              </section>
            ))}
          </div>
        </section>

        <section className="border-t border-white/10 px-6 py-12">
          <div className="mx-auto max-w-5xl">
            <p className="max-w-4xl text-sm leading-7 text-white/45">{record.legalBoundary}</p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-white/28">
              Human reviewed · {record.reviewedAt}
            </p>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
