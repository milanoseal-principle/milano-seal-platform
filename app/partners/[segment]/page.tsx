import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { ArrowRight } from "lucide-react";

const SEGMENTS: Record<
  string,
  {
    title: string;
    subtitle: string;
    label: string;
    description: string;
    body: string;
    useCases: string[];
    ctaLabel: string;
    metaDescription: string;
    keywords: string[];
  }
> = {
  attorneys: {
    title: "Attorneys",
    subtitle: "Legal Execution Partner",
    label: "Client Segment — Legal",
    description:
      "Reliable notarization and apostille execution for client matters. We handle the procedural requirements so you can focus on legal strategy.",
    body: "Law firms and solo practitioners rely on The Milano Seal™ for time-sensitive document execution — from single-page notarizations to multi-document international packages. Florida-commissioned execution, chain-of-custody documentation, and structured release handled to your specifications.",
    useCases: [
      "Client matter notarization (RON or mobile notary)",
      "Power of attorney execution and apostille",
      "International document packages for foreign jurisdictions",
      "Real estate and closing document execution",
      "Estate planning document notarization",
      "Deposition-related and court-adjacent document handling",
    ],
    ctaLabel: "Submit a Client Matter",
    metaDescription:
      "Reliable notarization, apostille, and international document execution for attorneys and law firms. Florida-commissioned. Structured release. Chain-of-custody documentation.",
    keywords: [
      "notary for attorneys",
      "law firm notary service",
      "attorney document execution",
      "apostille for lawyers",
      "legal document notarization Florida",
    ],
  },
  "real-estate": {
    title: "Real Estate Professionals",
    subtitle: "Closing & Title Support",
    label: "Client Segment — Real Estate",
    description:
      "Closing documents, powers of attorney, and property-related executions with precision timing and location flexibility.",
    body: "Title agents, real estate attorneys, and brokers use The Milano Seal™ for on-time, on-location notarization at closings and signing appointments. Mobile notary dispatch available for buyer and seller locations. Same-day scheduling for time-critical closings.",
    useCases: [
      "Closing document notarization at buyer or seller location",
      "Deed and title instrument execution",
      "Buyer/seller power of attorney for closing",
      "Mobile notary dispatch to title companies and offices",
      "Same-day and after-hours scheduling for tight timelines",
      "International buyer document coordination and apostille",
    ],
    ctaLabel: "Submit a Closing Matter",
    metaDescription:
      "Mobile notary and closing document execution for real estate professionals. On-location, same-day available. Florida-commissioned notary dispatched to your closing.",
    keywords: [
      "real estate notary Florida",
      "closing document notary",
      "mobile notary real estate",
      "title company notary",
      "closing notary same day",
    ],
  },
  medical: {
    title: "Medical Providers",
    subtitle: "Healthcare Document Execution",
    label: "Client Segment — Healthcare",
    description:
      "Healthcare directives, consent forms, and sensitive medical documents handled with discretion and HIPAA awareness.",
    body: "Hospitals, clinics, and healthcare administrators engage The Milano Seal™ for bedside and on-location notarization of advance directives, medical powers of attorney, and consent documents. Mobile dispatch available to patient rooms, nursing facilities, and healthcare campuses.",
    useCases: [
      "Advance healthcare directive and living will notarization",
      "Medical power of attorney execution",
      "Consent and authorization form notarization",
      "Bedside notarization at hospitals and care facilities",
      "HIPAA-aware document handling procedures",
      "After-hours and weekend dispatch for urgent matters",
    ],
    ctaLabel: "Submit a Medical Matter",
    metaDescription:
      "Bedside and on-location notarization for healthcare providers. Advance directives, medical powers of attorney, and consent forms. HIPAA-aware. Florida-commissioned.",
    keywords: [
      "hospital notary Florida",
      "bedside notary",
      "medical power of attorney notary",
      "advance directive notarization",
      "healthcare document notary",
    ],
  },
  "international-clients": {
    title: "International Clients",
    subtitle: "Cross-Border Document Coordination",
    label: "Client Segment — International",
    description:
      "Cross-border document coordination for individuals and businesses operating between the U.S. and foreign jurisdictions.",
    body: "Foreign nationals, expatriates, and multinational businesses rely on The Milano Seal™ to handle the U.S. side of international document matters — notarization, apostille through the Florida Secretary of State, embassy legalization, and international courier dispatch. Destination-country requirements reviewed before execution begins.",
    useCases: [
      "Apostille coordination through Florida Secretary of State",
      "Embassy and consulate document preparation",
      "Hague Convention routing for member countries",
      "Non-Hague country legalization sequences",
      "U.S. document authentication for foreign use",
      "International courier dispatch with tracking",
    ],
    ctaLabel: "Begin International Matter",
    metaDescription:
      "U.S. document authentication, apostille coordination, and international courier dispatch for foreign nationals and multinational clients. Florida-commissioned. Hague and non-Hague routing.",
    keywords: [
      "international document authentication",
      "apostille Florida international",
      "foreign national notary",
      "cross-border document Florida",
      "US documents abroad",
    ],
  },
  "private-clients": {
    title: "Private Clients",
    subtitle: "Personal Document Execution",
    label: "Client Segment — Private",
    description:
      "Estate planning, personal legal documents, and family matters executed with the highest level of discretion and care.",
    body: "Individuals and families engage The Milano Seal™ for sensitive personal matters — wills, trusts, powers of attorney, and family legal documents. Remote online notarization available from the privacy of your home, or mobile notary dispatched to your location. All matters handled with strict confidentiality.",
    useCases: [
      "Estate planning document notarization",
      "Personal and financial power of attorney",
      "Trust document execution",
      "Family legal matter notarization",
      "Remote online notarization from home",
      "Confidential mobile notary for sensitive matters",
    ],
    ctaLabel: "Submit Your Matter",
    metaDescription:
      "Discreet, private notarization for estate planning, powers of attorney, and personal legal documents. Remote online or mobile notary. Florida-commissioned. Strict confidentiality.",
    keywords: [
      "private notary Florida",
      "estate planning notary",
      "personal document notarization",
      "power of attorney notary",
      "discreet notary service",
    ],
  },
};

type Props = { params: Promise<{ segment: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { segment } = await params;
  const data = SEGMENTS[segment];
  if (!data) return {};
  return {
    title: `${data.title} | The Milano Seal™`,
    description: data.metaDescription,
    keywords: data.keywords,
    alternates: {
      canonical: `https://themilanoseal.com/partners/${segment}`,
    },
  };
}

export function generateStaticParams() {
  return Object.keys(SEGMENTS).map((segment) => ({ segment }));
}

export default async function PartnerSegmentPage({ params }: Props) {
  const { segment } = await params;
  const data = SEGMENTS[segment];
  if (!data) notFound();

  return (
    <>
      <Header />
      <main className="bg-[#050507] min-h-screen">
        {/* Hero */}
        <section className="pt-28 pb-16 px-6 border-b border-[#1A1A1A]">
          <div className="max-w-4xl mx-auto">
            <p className="text-[#C6A55A] text-[10px] tracking-[0.3em] uppercase font-medium mb-4">
              {data.label}
            </p>
            <h1 className="font-serif text-4xl md:text-5xl font-medium text-white mb-6 text-balance">
              {data.title}
            </h1>
            <p className="text-[#B0B0B0] text-lg max-w-2xl leading-relaxed mb-8">
              {data.description}
            </p>
            <Link
              href="/intake"
              prefetch={false}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#C6A55A] text-[#0A0A0A] font-semibold text-sm rounded-xl hover:bg-[#D4BB7A] transition-colors duration-200"
            >
              {data.ctaLabel}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Body */}
        <section className="py-16 px-6 border-b border-[#1A1A1A]">
          <div className="max-w-4xl mx-auto">
            <p className="text-[#B0B0B0] text-base leading-relaxed max-w-2xl">
              {data.body}
            </p>
          </div>
        </section>

        {/* Use cases */}
        <section className="py-16 px-6 border-b border-[#1A1A1A]">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-serif text-2xl font-medium text-white mb-8">
              Common Matters
            </h2>
            <ul className="space-y-3">
              {data.useCases.map((uc) => (
                <li key={uc} className="flex items-start gap-3">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#C6A55A]/60 flex-shrink-0" />
                  <span className="text-[#B0B0B0] text-sm leading-relaxed">
                    {uc}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Services nav */}
        <section className="py-16 px-6 border-b border-[#1A1A1A]">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-serif text-2xl font-medium text-white mb-8">
              Execution Methods
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: "Remote Online Notarization", href: "/services/remote-online-notary" },
                { label: "Apostille Coordination", href: "/services/apostille" },
                { label: "International Document Execution", href: "/services/international-execution" },
                { label: "Mobile Notary", href: "/services/mobile-notary" },
              ].map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  prefetch={false}
                  className="flex items-center justify-between px-5 py-4 bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl hover:border-[#C6A55A]/30 hover:text-[#C6A55A] text-[#B0B0B0] text-sm transition-all duration-300 group"
                >
                  {s.label}
                  <ArrowRight className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-serif text-2xl font-medium text-white mb-4">
              Ready to Begin?
            </h2>
            <p className="text-[#8A8A8A] text-sm mb-8 max-w-md mx-auto">
              Submit your matter through secure intake. Execution confirmed within one business day.
            </p>
            <Link
              href="/intake"
              prefetch={false}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#C6A55A] text-[#0A0A0A] font-semibold text-sm rounded-xl hover:bg-[#D4BB7A] transition-colors duration-200"
            >
              {data.ctaLabel}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
