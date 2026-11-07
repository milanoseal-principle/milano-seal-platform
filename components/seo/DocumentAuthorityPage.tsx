import Link from "next/link";
import type { DocumentTaxonomyItem } from "@/lib/compliance/documents";
import { CLIENT_COPY } from "@/lib/compliance/clientCopy";
import { COUNTRY_REGISTRY } from "@/lib/compliance/countries";
import { CommercialCtaRow } from "@/components/conversion/CommercialCtaRow";

interface Props {
  document: DocumentTaxonomyItem;
}

export function DocumentAuthorityPage({ document }: Props) {
  const activeCountries = COUNTRY_REGISTRY.filter(c => c.corridorActive);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <p className="text-[#C6A55A] text-xs tracking-[0.3em] uppercase font-medium mb-4">
        {document.category.replace(/-/g, " ")} · {document.commonlyApostilled ? "Apostille Eligible" : "Notarization"}
      </p>
      <h1 className="font-serif text-3xl md:text-5xl font-medium text-white mb-5">
        <em className="text-[#C6A55A]">{document.name}</em>
        {document.commonlyApostilled ? " Apostille" : " Notarization"}
      </h1>
      <p className="text-[#8A8A8A] text-base md:text-lg font-light max-w-2xl mb-8 leading-relaxed">
        {document.seoDescription}
      </p>

      <CommercialCtaRow
        context={{ serviceIntent: document.commonlyApostilled ? "apostille" : "unsure", documentType: document.name, source: "document" }}
        actions={["get_pricing", "speak"]}
        className="mb-10"
      />

      <div style={{ width: 80, height: 1, background: "linear-gradient(90deg, transparent, rgba(198,165,90,0.4), transparent)", marginBottom: 40 }} />

      {/* Active corridors */}
      {document.commonlyApostilled && (
        <div className="mb-12">
          <h2 className="text-white font-serif text-xl mb-6">Active Destination Corridors</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeCountries.map(country => (
              <Link
                key={country.slug}
                href={`/apostille/${country.slug}/${document.slug}`}
                className="group flex items-center justify-between p-4 border border-white/5 bg-[#0D0D0D] hover:border-[#C6A55A]/30 transition-colors"
              >
                <span className="text-[#D0D0D0] text-sm group-hover:text-white transition-colors">{country.name}</span>
                <span className="text-[#C6A55A] text-xs opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* FAQs */}
      {document.faqs.length > 0 && (
        <div className="mb-12">
          <h2 className="text-white font-serif text-xl mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {document.faqs.map((faq, i) => (
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
