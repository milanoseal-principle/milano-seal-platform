import Link from "next/link";
import type { CountryComplianceProfile } from "@/lib/compliance/countries";
import { CLIENT_COPY } from "@/lib/compliance/clientCopy";
import { DOCUMENT_TAXONOMY } from "@/lib/compliance/documents";
import { GlobalRouteGlobe } from "@/components/globe/GlobalRouteGlobe";
import { SeoCorridorMapPreview } from "@/components/map/SeoCorridorMapPreview";

interface Props {
  country: CountryComplianceProfile;
  authMode?: "apostille" | "authentication";
}

export function CountryAuthorityPage({ country, authMode = "apostille" }: Props) {
  const isHague = country.hagueMember === "member";
  const memberNote = isHague
    ? CLIENT_COPY.hagueMemberNote(country.name)
    : CLIENT_COPY.nonHagueMemberNote(country.name);

  const apostillableDocs = DOCUMENT_TAXONOMY.filter(d => d.commonlyApostilled);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <p className="text-[#C6A55A] text-xs tracking-[0.3em] uppercase font-medium mb-4">
        {country.region} · {isHague ? "Hague Convention Member" : "Non-Hague Member"}
      </p>
      <h1 className="font-serif text-3xl md:text-5xl font-medium text-white mb-5">
        {authMode === "apostille" ? "Apostille for " : "Document Authentication for "}
        <em className="text-[#C6A55A]">{country.name}</em>
      </h1>
      <p className="text-[#8A8A8A] text-base md:text-lg font-light max-w-2xl mb-8 leading-relaxed">
        {memberNote}
      </p>

      <div style={{ width: 80, height: 1, background: "linear-gradient(90deg, transparent, rgba(198,165,90,0.4), transparent)", marginBottom: 32 }} />

      {/* Authority globe + corridor preview */}
      <div className="flex flex-col lg:flex-row gap-6 mb-10">
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C6A55A]/60 mb-2">Authority Coverage</p>
          <GlobalRouteGlobe selectedSlug={country.slug} className="w-full max-w-[400px]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C6A55A]/60 mb-2">Corridor Preview</p>
          <SeoCorridorMapPreview slug={country.slug} className="w-full" />
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap gap-3 mb-10">
        <Link
          href={`/intake?destination=${country.slug}&country=${encodeURIComponent(country.name)}`}
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

      {/* Document matrix */}
      <div className="mb-12">
        <h2 className="text-white font-serif text-xl mb-6">Common Documents</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {apostillableDocs.map(doc => (
            <Link
              key={doc.slug}
              href={`/apostille/${country.slug}/${doc.slug}`}
              className="group flex items-center justify-between p-4 border border-white/5 bg-[#0D0D0D] hover:border-[#C6A55A]/30 transition-colors"
            >
              <span className="text-[#D0D0D0] text-sm group-hover:text-white transition-colors">{doc.name}</span>
              <span className="text-[#C6A55A] text-xs opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </Link>
          ))}
        </div>
      </div>

      {/* FAQs */}
      {country.faqs.length > 0 && (
        <div className="mb-12">
          <h2 className="text-white font-serif text-xl mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {country.faqs.map((faq, i) => (
              <div key={i} className="border-l-2 border-[#C6A55A]/30 pl-5">
                <p className="text-white text-sm font-medium mb-2">{faq.q}</p>
                <p className="text-[#8A8A8A] text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="p-4 border border-white/5 bg-[#0A0A0A]">
        <p className="text-[#5A5A5A] text-xs leading-relaxed">{CLIENT_COPY.disclaimer}</p>
      </div>
    </div>
  );
}
