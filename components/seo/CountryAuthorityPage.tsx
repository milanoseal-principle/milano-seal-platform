import Link from "next/link";
import type { CountryComplianceProfile } from "@/lib/compliance/countries";
import { CLIENT_COPY } from "@/lib/compliance/clientCopy";
import { DOCUMENT_TAXONOMY } from "@/lib/compliance/documents";
import { GlobalRouteGlobe } from "@/components/globe/GlobalRouteGlobe";
import { SeoCorridorMapPreview } from "@/components/map/SeoCorridorMapPreview";
import type { PremiumCorridorProfile } from "@/lib/seo-premium-corridors";

interface Props {
  country: CountryComplianceProfile;
  authMode?: "apostille" | "authentication";
  premiumCorridor?: PremiumCorridorProfile | null;
}

export function CountryAuthorityPage({
  country,
  authMode = "apostille",
  premiumCorridor,
}: Props) {
  const isHague = country.hagueMember === "member";
  const memberNote = isHague
    ? CLIENT_COPY.hagueMemberNote(country.name)
    : CLIENT_COPY.nonHagueMemberNote(country.name);
  const apostillableDocs = DOCUMENT_TAXONOMY.filter(
    (document) => document.commonlyApostilled,
  );
  const professionalIntakeHref = `/intake?lane=professional&destination=${country.slug}&country=${encodeURIComponent(country.name)}&source=premium-country-seo`;
  const standardIntakeHref = `/intake?destination=${country.slug}&country=${encodeURIComponent(country.name)}&source=country-seo`;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-[#C6A55A]">
        {country.region} · {isHague ? "Hague Convention Member" : "Non-Hague Member"}
      </p>
      <h1 className="mb-5 max-w-4xl font-serif text-3xl font-medium text-white md:text-5xl">
        {authMode === "apostille"
          ? premiumCorridor
            ? "U.S. Apostille & Document Execution for "
            : "Apostille for "
          : "Document Authentication for "}
        <em className="text-[#C6A55A]">{country.name}</em>
      </h1>
      <p className="mb-4 max-w-3xl text-base font-light leading-relaxed text-[#8A8A8A] md:text-lg">
        {premiumCorridor?.positioning ?? memberNote}
      </p>
      {premiumCorridor && (
        <p className="mb-8 max-w-3xl text-sm leading-relaxed text-[#666]">
          U.S.-side execution, authority routing, custody, and release are coordinated as one Matter. The receiving authority and document origin are reviewed before any notarization, apostille, authentication, or courier path is confirmed.
        </p>
      )}

      <div
        className="mb-8 h-px w-20"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(198,165,90,0.4), transparent)",
        }}
      />

      {premiumCorridor && (
        <section className="mb-10 rounded-xl border border-[#C6A55A]/20 bg-[#0A0906] p-6 md:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.18em] text-[#C6A55A]/70">
                Professional Corridor · Priority {premiumCorridor.rank}
              </p>
              <h2 className="font-serif text-2xl text-white">
                For Attorneys & Professional Advisors
              </h2>
            </div>
            <span className="rounded-full border border-[#C6A55A]/25 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[#C6A55A]">
              U.S. Execution Desk
            </span>
          </div>

          <p className="mb-6 text-sm leading-relaxed text-[#A0A0A0]">
            {premiumCorridor.professionalAudience}
          </p>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-medium text-white">
                Common U.S.-side matters
              </h3>
              <ul className="space-y-2">
                {premiumCorridor.commonMatters.map((matter) => (
                  <li
                    key={matter}
                    className="flex items-start gap-2 text-sm leading-relaxed text-[#888]"
                  >
                    <span className="mt-1 text-[#C6A55A]">•</span>
                    <span>{matter}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-medium text-white">
                What the desk coordinates
              </h3>
              <ul className="space-y-2 text-sm leading-relaxed text-[#888]">
                <li>• Document-origin and competent-authority review</li>
                <li>• Notarization or execution only when required</li>
                <li>• State or federal apostille/authentication routing</li>
                <li>• Client-safe status, custody, and release workflow</li>
                <li>• International courier coordination when selected</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 border-t border-white/[0.06] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-1 font-mono text-[8px] uppercase tracking-[0.12em] text-[#555]">
                Cross-border request language
              </p>
              <p className="text-sm text-[#8A8A8A]">
                {premiumCorridor.nativeLanguageQuery}
              </p>
            </div>
            <Link
              href={professionalIntakeHref}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#C6A55A] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#050507] transition-colors hover:bg-[#D4B76A]"
            >
              {premiumCorridor.professionalCta} →
            </Link>
          </div>
        </section>
      )}

      <section
        aria-label={`${country.name} execution intelligence`}
        className="mb-10 grid items-stretch gap-6 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]"
      >
        <div className="min-w-0">
          <GlobalRouteGlobe
            key={`authority-${country.slug}`}
            selectedSlug={country.slug}
            className="h-full w-full"
          />
        </div>
        <div className="min-w-0">
          <SeoCorridorMapPreview
            key={`corridor-${country.slug}`}
            slug={country.slug}
            className="h-full"
          />
        </div>
      </section>

      <div className="mb-10 flex flex-wrap gap-3">
        <Link
          href={premiumCorridor ? professionalIntakeHref : standardIntakeHref}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#C6A55A] px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#050507] transition-colors hover:bg-[#D4B76A]"
        >
          Begin {country.name} Intake →
        </Link>
        <Link
          href={`/map?country=${country.slug}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#C6A55A]/30 px-5 py-2.5 text-[11px] uppercase tracking-[0.1em] text-[#C6A55A] transition-colors hover:border-[#C6A55A]"
        >
          View in Atlas →
        </Link>
      </div>

      <div className="mb-12">
        <h2 className="mb-6 font-serif text-xl text-white">Common Documents</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {apostillableDocs.map((document) => (
            <Link
              key={document.slug}
              href={`/apostille/${country.slug}/${document.slug}`}
              className="group flex min-h-12 items-center justify-between border border-white/5 bg-[#0D0D0D] p-4 transition-colors hover:border-[#C6A55A]/30"
            >
              <span className="text-sm text-[#D0D0D0] transition-colors group-hover:text-white">
                {document.name}
              </span>
              <span className="text-xs text-[#C6A55A] opacity-0 transition-opacity group-hover:opacity-100">
                →
              </span>
            </Link>
          ))}
        </div>
      </div>

      {country.faqs.length > 0 && (
        <div className="mb-12">
          <h2 className="mb-6 font-serif text-xl text-white">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {country.faqs.map((faq, index) => (
              <div
                key={index}
                className="border-l-2 border-[#C6A55A]/30 pl-5"
              >
                <p className="mb-2 text-sm font-medium text-white">{faq.q}</p>
                <p className="text-sm leading-relaxed text-[#8A8A8A]">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border border-white/5 bg-[#0A0A0A] p-4">
        <p className="text-xs leading-relaxed text-[#5A5A5A]">
          {CLIENT_COPY.disclaimer}
        </p>
      </div>
    </div>
  );
}
