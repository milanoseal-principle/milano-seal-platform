import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Shield, FileText, Check, MapPin } from "lucide-react";
import { JURISDICTION_PROFILES } from "@/lib/jurisdiction-data";

export const metadata: Metadata = {
  title: "Consular Authentication Track — Multi-Tier Document Authentication | The Milano Seal™",
  description:
    "Florida-origin document execution and consular authentication coordination for non-Hague destinations. State, federal, and embassy review sequence. Chain-of-custody control.",
  keywords: [
    "consular authentication",
    "consular authentication track",
    "embassy authentication",
    "federal authentication routing",
    "chain-of-custody document coordination",
    "international document execution non-Hague",
  ],
  alternates: {
    canonical: "/consular-authentication",
  },
};

const CONSULAR_SEQUENCE = [
  {
    step: "01",
    label: "Document Execution",
    detail: "Remote online notarization or in-person execution. Document scope review and preparation coordination prior to authentication submission.",
  },
  {
    step: "02",
    label: "State Authentication",
    detail: "Florida Department of State authentication. State-level certification of notary credentials and document execution.",
  },
  {
    step: "03",
    label: "Federal-Level Review",
    detail: "Authentication review via the U.S. Department of State, Office of Authentications. Required for embassy-facing document submission.",
  },
  {
    step: "04",
    label: "Embassy / Consular Review",
    detail: "Consular review coordination where required by the receiving jurisdiction. Timelines are determined by the relevant consular authority.",
  },
];

const COMMON_DOCUMENTS = [
  "Power of Attorney",
  "Corporate Authorization",
  "Commercial Agreements",
  "Board Resolutions",
  "Affidavit",
  "Corporate Bylaws",
  "Appointment Letters",
  "Personal Civil Records",
];

const CONSULAR_PROFILES = JURISDICTION_PROFILES.filter(
  (p) => p.routeType === "Consular Authentication Track"
);

export default function ConsularAuthenticationPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: "Consular Authentication Track",
            description:
              "Florida-origin document execution and consular authentication coordination for non-Hague destinations. State, federal, and embassy review sequence.",
            provider: {
              "@type": "Organization",
              name: "The Milano Seal™",
              url: "https://themilanoseal.com",
            },
            serviceType:
              "Consular authentication review and international document execution",
            url: "https://themilanoseal.com/consular-authentication",
          }, null, 2),
        }}
      />

      <main className="min-h-screen bg-[#050507] text-white">
        {/* Header bar */}
        <div className="border-b border-[#1A1A1A]">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link
              href="/"
              className="font-serif text-sm text-[#C6A55A] hover:text-[#D4B76A] transition-colors"
            >
              The Milano Seal™
            </Link>
            <Link
              href="/map"
              className="font-mono text-[10px] tracking-[0.22em] uppercase text-[#555] hover:text-[#888] transition-colors"
            >
              ← Global Map
            </Link>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-16 md:py-24">
          {/* Eyebrow */}
          <span className="font-mono text-[10px] tracking-[0.32em] uppercase text-[#6A4410] block mb-6">
            Authentication Route
          </span>

          {/* H1 */}
          <h1 className="font-serif text-3xl md:text-5xl font-medium text-white mb-4 text-balance leading-tight">
            Consular Authentication Track
          </h1>

          {/* Badge */}
          <div className="flex items-center gap-3 mb-12">
            <span className="inline-flex items-center gap-2 font-mono text-[10px] px-3 py-1.5 rounded border border-amber-500/25 text-amber-400/80 bg-amber-500/[0.05]">
              Consular Authentication Track
            </span>
            <span className="font-mono text-[9px] text-[#444] tracking-wider">
              FL ORIGIN → EMBASSY / CONSULAR REVIEW
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* Left column — main content */}
            <div className="md:col-span-2 space-y-10">

              {/* When This Route Applies */}
              <section>
                <h2 className="font-mono text-[9px] tracking-[0.28em] uppercase text-[#555] mb-4">
                  When This Route Applies
                </h2>
                <div className="bg-[#0D0D0D] border border-[#1E1E1E] rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-[#C6A55A] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-white font-medium mb-2">
                        Non-Hague Convention Destinations
                      </p>
                      <p className="text-xs text-[#888] leading-relaxed">
                        Documents destined for countries that are not signatories to the Hague Apostille Convention require authentication through a multi-tier review sequence rather than a standard state apostille. This pathway routes through state, federal, and embassy or consular review before reaching the destination jurisdiction.
                      </p>
                      <p className="text-xs text-[#888] leading-relaxed mt-2">
                        Some destinations that have acceded to the Hague Convention — such as the UAE — may still require embassy or consular review for certain document types, execution dates, or receiving institution requirements. Milano Seal evaluates the appropriate route based on the specific matter.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Sequential Review Pathway */}
              <section>
                <h2 className="font-mono text-[9px] tracking-[0.28em] uppercase text-[#555] mb-4">
                  Sequential Review Pathway
                </h2>
                <div className="space-y-3">
                  {CONSULAR_SEQUENCE.map((item) => (
                    <div key={item.step} className="flex items-start gap-4 bg-[#0D0D0D] border border-[#1E1E1E] rounded-xl p-4">
                      <span className="font-mono text-[#C6A55A]/40 text-[10px] mt-0.5 w-6 flex-shrink-0">
                        {item.step}
                      </span>
                      <div>
                        <p className="text-sm text-white font-medium mb-1">{item.label}</p>
                        <p className="text-xs text-[#888] leading-relaxed">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Common Document Types */}
              <section>
                <h2 className="font-mono text-[9px] tracking-[0.28em] uppercase text-[#555] mb-4">
                  Common Document Types
                </h2>
                <div className="bg-[#0D0D0D] border border-[#1E1E1E] rounded-xl p-5">
                  <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                    {COMMON_DOCUMENTS.map((doc) => (
                      <div key={doc} className="flex items-start gap-2.5">
                        <Check className="w-3.5 h-3.5 text-[#C6A55A] mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-[#B0B0B0] leading-snug">{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Important Review Note */}
              <section>
                <h2 className="font-mono text-[9px] tracking-[0.28em] uppercase text-[#555] mb-4">
                  Important Review Note
                </h2>
                <div className="bg-[#0D0D0D] border border-[#C6A55A]/10 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <Shield className="w-4 h-4 text-[#C6A55A]/60 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-[#888] leading-relaxed">
                      Milano Seal coordinates document execution, state authentication, federal routing, and consular review preparation. Milano Seal does not issue apostilles, issue embassy seals, or control government processing timelines. Embassy and consular review timelines are determined by the relevant authority. Acceptance by receiving institutions is determined by those institutions.
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* Right column — sidebar */}
            <div className="space-y-6">
              {/* Target Jurisdictions */}
              <section className="bg-[#0D0D0D] border border-[#1E1E1E] rounded-xl p-5">
                <h2 className="font-mono text-[9px] tracking-[0.28em] uppercase text-[#555] mb-4 flex items-center gap-2">
                  <FileText className="w-3 h-3" />
                  Target Jurisdictions
                </h2>
                <ul className="space-y-2.5">
                  {CONSULAR_PROFILES.map((profile) => (
                    <li key={profile.slug}>
                      <Link
                        href={`/jurisdictions/${profile.slug}`}
                        className="flex items-center gap-2.5 group"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500/40 flex-shrink-0 group-hover:bg-amber-500/70 transition-colors" />
                        <span className="text-xs text-[#B0B0B0] group-hover:text-[#C6A55A] transition-colors leading-snug">
                          {profile.name}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Execution Origin */}
              <section className="bg-[#0D0D0D] border border-[#1E1E1E] rounded-xl p-5">
                <h2 className="font-mono text-[9px] tracking-[0.28em] uppercase text-[#555] mb-3">
                  Execution Origin
                </h2>
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-[#C6A55A]" />
                  <span className="text-sm text-white">Florida, United States</span>
                </div>
                <p className="font-mono text-[9px] text-[#444] tracking-wider">
                  FLORIDA NOTARY #668288
                </p>
              </section>

              {/* Related */}
              <section className="bg-[#0D0D0D] border border-[#1E1E1E] rounded-xl p-5">
                <h2 className="font-mono text-[9px] tracking-[0.28em] uppercase text-[#555] mb-3">
                  Related
                </h2>
                <div className="space-y-2">
                  <Link
                    href="/apostille"
                    className="block text-xs text-[#888] hover:text-[#C6A55A] transition-colors"
                  >
                    → Apostille Coordination
                  </Link>
                  <Link
                    href="/map"
                    className="block text-xs text-[#888] hover:text-[#C6A55A] transition-colors"
                  >
                    → Global Document Intelligence Map
                  </Link>
                  <Link
                    href="/intake"
                    className="block text-xs text-[#888] hover:text-[#C6A55A] transition-colors"
                  >
                    → Begin Secure Intake
                  </Link>
                </div>
              </section>
            </div>
          </div>

          {/* CTA */}
          <div className="border-t border-[#1A1A1A] pt-12 flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/intake"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#C6A55A] text-[#050507] font-bold tracking-[0.12em] text-sm uppercase rounded-lg hover:bg-[#D4B76A] transition-colors"
            >
              Begin Secure Intake
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/map"
              className="inline-flex items-center gap-2 px-6 py-4 border border-[#C6A55A]/30 text-[#C6A55A] text-sm font-medium rounded-lg hover:border-[#C6A55A] hover:bg-[#C6A55A]/5 transition-colors"
            >
              View Global Map
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
