import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Globe2, ShieldCheck } from "lucide-react";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { PREMIUM_CORRIDORS } from "@/lib/seo-premium-corridors";

const canonical = "https://www.themilanoseal.com/professional";

export const metadata: Metadata = {
  title: "U.S. Apostille & Document Execution for International Attorneys | The Milano Seal™",
  description:
    "A professional U.S. document execution and apostille coordination desk for international attorneys, notaries, fiduciaries, family offices, corporate counsel, and cross-border advisors.",
  alternates: { canonical },
  robots: { index: true, follow: true },
  openGraph: {
    title: "U.S. Apostille & Document Execution for International Attorneys | The Milano Seal™",
    description:
      "One accountable U.S. execution desk for cross-border professional matters requiring document execution, apostille or authentication coordination, custody, and release.",
    url: canonical,
    siteName: "The Milano Seal™",
    type: "website",
    images: [
      {
        url: "https://www.themilanoseal.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "The Milano Seal™ — U.S. document execution for international professionals",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "U.S. Apostille & Document Execution for International Attorneys | The Milano Seal™",
    description:
      "Professional U.S. execution and apostille coordination for high-trust cross-border matters.",
    images: ["https://www.themilanoseal.com/og-image.png"],
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "U.S. Apostille & Document Execution for International Attorneys and Advisors",
  description:
    "Professional U.S. document execution and apostille coordination for cross-border legal, private-client, estate, property, corporate, citizenship, and professional matters.",
  url: canonical,
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: PREMIUM_CORRIDORS.length,
    itemListElement: PREMIUM_CORRIDORS.map((corridor) => ({
      "@type": "ListItem",
      position: corridor.rank,
      name: `U.S. Document Execution for ${corridor.name}`,
      url: `${canonical}/${corridor.slug}`,
    })),
  },
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.themilanoseal.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Professional",
        item: canonical,
      },
    ],
  },
};

const universalQuestions = [
  {
    question: "Who can coordinate a U.S. apostille for an international law firm or foreign attorney?",
    answer:
      "The Milano Seal provides a U.S.-side execution and apostille coordination desk for foreign counsel and professional advisors. Each request is structured as a Matter so document origin, receiving instructions, execution, payment, authentication, custody, and release remain controlled together.",
  },
  {
    question: "Does every U.S. document need notarization before it can receive an apostille?",
    answer:
      "No. State public records, federal records, and privately executed documents follow different U.S. authority paths. The document category and issuing authority are reviewed before any execution or notarization step is added.",
  },
  {
    question: "Can one U.S. provider coordinate documents from different states or federal agencies?",
    answer:
      "The Milano Seal can coordinate the Matter across the applicable U.S. authority paths, but the competent authority depends on the document origin. Receiving-country acceptance requirements remain controlled by the foreign authority or professional handling the underlying matter.",
  },
];

export default function ProfessionalHubPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#060606] text-white pt-[var(--header-total-height)]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />

        <section className="px-4 sm:px-6 pt-16 pb-14">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-4xl">
              <p className="font-mono text-[10px] tracking-[0.24em] uppercase text-[#C6A55A]/70 mb-4">
                International Professional Execution Desk
              </p>
              <h1 className="font-serif text-4xl md:text-6xl leading-[1.04] font-medium text-white mb-6">
                U.S. Apostille & Document Execution for{" "}
                <em className="text-[#C6A55A]">International Attorneys & Advisors</em>
              </h1>
              <p className="text-[#A0A0A0] text-lg leading-relaxed max-w-3xl mb-5">
                One accountable U.S. coordination point for foreign counsel, notaries, fiduciaries, family offices, corporate advisors, and private-client professionals managing documents that must be executed or authenticated in the United States for use abroad.
              </p>
              <p className="text-[#676767] leading-relaxed max-w-3xl">
                The Milano Seal is positioned for professional matters where reliability, authority-aware routing, controlled custody, and clear status matter more than commodity apostille pricing. Final scope and pricing are confirmed only after the Matter is reviewed.
              </p>
              <div className="mt-8">
                <Link
                  href="/intake?lane=professional&source=professional-hub"
                  className="inline-flex items-center justify-center gap-2 min-h-[52px] px-7 rounded-lg bg-[#C6A55A] text-[#050507] font-bold text-[11px] uppercase tracking-[0.12em] hover:bg-[#D4B76A] transition-colors"
                >
                  Begin Professional Intake <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-12 border-y border-white/[0.05] bg-[#090909]">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-5">
            {[
              {
                Icon: ShieldCheck,
                title: "Authority-Aware Routing",
                body: "State public records, federal records, and privately executed documents are separated before the apostille or authentication path is confirmed.",
              },
              {
                Icon: Globe2,
                title: "Foreign-Counsel Ready",
                body: "The receiving attorney, notary, fiduciary, or authority can remain the source of truth for local acceptance while The Milano Seal controls the U.S. execution side.",
              },
              {
                Icon: CheckCircle2,
                title: "Matter-Level Control",
                body: "Intake, review, pricing, payment, execution, apostille, custody, courier release, and status remain attached to one canonical Matter.",
              },
            ].map(({ Icon, title, body }) => (
              <div key={title} className="rounded-xl border border-white/[0.06] bg-[#060606] p-6">
                <Icon className="w-5 h-5 text-[#C6A55A] mb-4" />
                <h2 className="font-serif text-xl mb-3">{title}</h2>
                <p className="text-[#777] text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-4 sm:px-6 py-16">
          <div className="max-w-6xl mx-auto">
            <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#C6A55A]/60 mb-3">
              Priority Professional Corridors
            </p>
            <h2 className="font-serif text-3xl md:text-4xl mb-4">
              Five premium Hague corridors for U.S.-origin Matters
            </h2>
            <p className="text-[#777] leading-relaxed max-w-3xl mb-9">
              These corridors receive dedicated professional pages because they combine recurring cross-border legal and private-client use cases with strong demand for U.S.-origin records, powers of attorney, affidavits, estate documents, corporate records, and federal documents.
            </p>

            <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
              {PREMIUM_CORRIDORS.map((corridor) => (
                <Link
                  key={corridor.slug}
                  href={`/professional/${corridor.slug}`}
                  className="group rounded-xl border border-white/[0.07] bg-[#090909] p-5 hover:border-[#C6A55A]/35 transition-colors"
                >
                  <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#C6A55A]/60 mb-3">
                    Priority {corridor.rank}
                  </div>
                  <h3 className="font-serif text-2xl mb-3 group-hover:text-[#C6A55A] transition-colors">
                    {corridor.name}
                  </h3>
                  <p className="text-[#777] text-sm leading-relaxed mb-5">
                    {corridor.positioning}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-[#C6A55A]">
                    View professional corridor <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-16 bg-[#090909] border-y border-white/[0.05]">
          <div className="max-w-4xl mx-auto">
            <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#C6A55A]/60 mb-3">
              Direct Answers for Cross-Border Counsel
            </p>
            <h2 className="font-serif text-3xl mb-8">Common U.S. apostille and execution questions</h2>
            <div className="space-y-4">
              {universalQuestions.map((item) => (
                <article key={item.question} className="rounded-xl border border-white/[0.06] bg-[#060606] p-6">
                  <h3 className="font-serif text-xl text-[#E8DCC0] mb-3">{item.question}</h3>
                  <p className="text-[#818181] text-sm leading-relaxed">{item.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-14">
          <div className="max-w-3xl mx-auto text-center">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#C6A55A]/60 mb-3">
              One U.S. Execution Counterpart
            </p>
            <h2 className="font-serif text-3xl mb-4">Send the Matter, not a generic service request.</h2>
            <p className="text-[#707070] leading-relaxed mb-7">
              The secure intake captures the receiving country, document origin, document type, signer facts, deadline, and requested service so the U.S. path can be reviewed before payment or scheduling.
            </p>
            <Link
              href="/intake?lane=professional&source=professional-hub-bottom"
              className="inline-flex items-center justify-center gap-2 min-h-[52px] px-7 rounded-lg bg-[#C6A55A] text-[#050507] font-bold text-[11px] uppercase tracking-[0.12em] hover:bg-[#D4B76A] transition-colors"
            >
              Start a Professional Matter <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
