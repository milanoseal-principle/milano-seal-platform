import Link from "next/link";
import type { CountryComplianceProfile } from "@/lib/compliance/countries";
import { CLIENT_COPY } from "@/lib/compliance/clientCopy";
import { DOCUMENT_TAXONOMY } from "@/lib/compliance/documents";
import { getPublicCountryCompliance } from "@/data/global-compliance-atlas";
import { getCountryRoleUseCase } from "@/data/country-role-use-cases";

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
  const atlas = getPublicCountryCompliance(country.slug);
  const lawyerUseCase = getCountryRoleUseCase(country.slug, "international_lawyer");

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

      <div style={{ width: 80, height: 1, background: "linear-gradient(90deg, transparent, rgba(198,165,90,0.4), transparent)", marginBottom: 40 }} />

      <section className="mb-12 rounded-2xl border border-[#C6A55A]/20 bg-[#0D0D0D] p-6">
        <p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-[#C6A55A]/70">Milano Seal Global Execution Atlas</p>
        <h2 className="mb-3 font-serif text-2xl text-white">{atlas.publicRouteLabel}</h2>
        <p className="mb-4 text-sm leading-6 text-[#B0B0B0]">{atlas.publicSummary}</p>
        <div className="mb-4 flex flex-wrap gap-2">
          {atlas.publicFlags.map((flag) => (
            <span key={flag} className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-[#C6A55A]/75">{flag}</span>
          ))}
        </div>
        <p className="text-xs leading-5 text-[#8A8A8A]">{atlas.receivingAuthorityBoundary}</p>
        {lawyerUseCase && (
          <p className="mt-4 text-xs leading-5 text-[#8A8A8A]">{lawyerUseCase.howTheyUseMilanoSeal}</p>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={`/intake?destination=${country.slug}`} className="rounded-lg bg-[#C6A55A] px-4 py-2 text-xs font-medium text-[#0A0A0A]">Start Controlled Intake</Link>
          <Link href="/lawyer-access" className="rounded-lg border border-[#C6A55A]/30 px-4 py-2 text-xs text-[#C6A55A]">Request Lawyer Access</Link>
          <Link href="/access" className="rounded-lg border border-[#C6A55A]/30 px-4 py-2 text-xs text-[#C6A55A]">Request Private Client Review</Link>
          <Link href="/alliance/apply" className="rounded-lg border border-[#C6A55A]/30 px-4 py-2 text-xs text-[#C6A55A]">Apply for Alliance Access</Link>
        </div>
      </section>

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
        <p className="text-[#5A5A5A] text-xs leading-relaxed">The Milano Seal provides document coordination, notarization support, apostille/authentication routing review, courier custody, and release support. International use remains subject to destination-country, receiving-authority, document-type, and signer-location requirements.</p>
      </div>
    </div>
  );
}
