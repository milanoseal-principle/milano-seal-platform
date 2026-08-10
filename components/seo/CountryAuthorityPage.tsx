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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <p className="text-[#C6A55A] text-xs tracking-[0.3em] uppercase font-medium mb-4">
        {country.region} · {isHague ? "Hague Convention Member" : "Non-Hague Member"}
      </p>
      <h1 className="font-serif text-3xl md:text-5xl font-medium text-white mb-5">
        {authMode === "apostille"
          ? premiumCorridor
            ? "U.S. Apostille & Document Execution for "
            : "Apostille for "
          : "Document Authentication for "}
        <em className="text-[#C6A55A]">{country.name}</em>
      </h1>
      <p className="text-[#8A8A8A] text-base md:text-lg font-light max-w-2xl mb-4 leading-relaxed">
        {premiumCorridor?.positioning ?? memberNote}
      </p>
      {premiumCorridor && (
        <p className="text-[#666] text-sm max-w-2xl mb-8 leading-relaxed">
          U.S.-side execution, authority routing, custody, and release are coordinated as one Matter. The receiving authority and document origin are reviewed before any notarization, apostille, authentication, or courier path is confirmed.
        </p>
      )}

      <div
        style={{
          width: 80,
          height: 1,
          background:
            "linear-gradient(90deg, transparent, rgba(198,165,90,0.4), transparent)",
          marginBottom: 32,
        }}
      />

      {premiumCorridor && (
        <section className="mb-10 rounded-xl border border-[#C6A55A]/20 bg-[#0A0906] p-6 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-[#C6A55A]/70 mb-2">
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

          <p className="text-[#A0A0A0] text-sm leading-relaxed mb-6">
            {premiumCorridor.professionalAudience}
          </p>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <h3 className="text-white text-sm font-medium mb-3">
                Common U.S.-side matters
              </h3>
              <ul className="space-y-2">
                {premiumCorridor.commonMatters.map((matter) => (
                  <li
                    key={matter}
                    className="flex items-start gap-2 text-[#888] text-sm leading-relaxed"
                  >
                    <span className="text-[#C6A55A] mt-1">•</span>
                    <span>{matter}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-white text-sm font-medium mb-3">
                What the desk coordinates
              </h3>
              <ul className="space-y-2 text-[#888] text-sm leading-relaxed">
                <li>• Document-origin and competent-authority review</li>
                <li>• Notarization or execution only when required</li>
                <li>• State or federal apostille/authentication routing</li>
                <li>• Client-safe status, custody, and release workflow</li>
                <li>• International courier coordination when selected</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#555] mb-1">
                Cross-border request language
              </p>
              <p className="text-[#8A8A8A] text-sm">
                {premiumCorridor.nativeLanguageQuery}
              </p>
            </div>
            <Link
              href={professionalIntakeHref}
              className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-[#C6A55A] text-[#050507] font-bold text-[10px] uppercase tracking-[0.12em] hover:bg-[#D4B76A] transition-colors"
            >
              {premiumCorridor.professionalCta} →
            </Link>
          </div>
        </section>
      )}

      <div className="flex flex-col lg:flex-row gap-6 mb-10">
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C6A55A]/60 mb-2">
            Authority Coverage
          </p>
          <GlobalRouteGlobe
            selectedSlug={country.slug}
            className="w-full max-w-[400px]"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C6A55A]/60 mb-2">
            Corridor Preview
          </p>
          <SeoCorridorMapPreview slug={country.slug} className="w-full" />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-10">
        <Link
          href={premiumCorridor ? professionalIntakeHref : standardIntakeHref}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C6A55A] text-[#050507] font-bold text-[11px] uppercase tracking-[0.12em] rounded-lg hover:bg-[#D4B76A] transition-colors"
        >
          Begin {country.name} Intake →
        </Link>
        <Link
          href={`/map?country=${country.slug}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#C6A55A]/30 text-[#C6A55A] text-[11px] uppercase tracking-[0.1em] rounded-lg hover:border-[#C6A55A] transition-colors"
        >
          View in Atlas →
        </Link>
      </div>

      <div className="mb-12">
        <h2 className="text-white font-serif text-xl mb-6">Common Documents</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {apostillableDocs.map((document) => (
            <Link
              key={document.slug}
              href={`/apostille/${country.slug}/${document.slug}`}
              className="group flex items-center justify-between p-4 border border-white/5 bg-[#0D0D0D] hover:border-[#C6A55A]/30 transition-colors"
            >
              <span className="text-[#D0D0D0] text-sm group-hover:text-white transition-colors">
                {document.name}
              </span>
              <span className="text-[#C6A55A] text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </span>
            </Link>
          ))}
        </div>
      </div>

      {country.faqs.length > 0 && (
        <div className="mb-12">
          <h2 className="text-white font-serif text-xl mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {country.faqs.map((faq, index) => (
              <div
                key={index}
                className="border-l-2 border-[#C6A55A]/30 pl-5"
              >
                <p className="text-white text-sm font-medium mb-2">{faq.q}</p>
                <p className="text-[#8A8A8A] text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 border border-white/5 bg-[#0A0A0A]">
        <p className="text-[#5A5A5A] text-xs leading-relaxed">
          {CLIENT_COPY.disclaimer}
        </p>
      </div>
    </div>
  );
}
