import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Globe2, ShieldCheck } from "lucide-react";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { UniversalAttorneyJourney } from "@/components/professional/UniversalAttorneyJourney";
import { HAGUE_PROFESSIONAL_DESTINATIONS } from "@/lib/professional/universal-attorney-journey";

const canonical = "https://www.themilanoseal.com/professional";

export const metadata: Metadata = {
  title: "U.S. Document Execution for International Counsel | The Milano Seal™",
  description:
    "A universal professional workflow for international attorneys and advisors coordinating U.S. document execution, apostille or authentication routing, custody, and international release.",
  alternates: { canonical },
  robots: { index: true, follow: true },
  openGraph: {
    title: "U.S. Document Execution for International Counsel | The Milano Seal™",
    description:
      "One accountable U.S. execution point for international counsel coordinating cross-border documents for use abroad.",
    url: canonical,
    siteName: "The Milano Seal™",
    type: "website",
    images: [
      {
        url: "https://www.themilanoseal.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "The Milano Seal™ — U.S. document execution for international counsel",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "U.S. Document Execution for International Counsel | The Milano Seal™",
    description:
      "Professional U.S. execution and apostille/authentication coordination for international matters.",
    images: ["https://www.themilanoseal.com/og-image.png"],
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "U.S. Document Execution for International Counsel",
  description:
    "A universal professional workflow for international attorneys and advisors coordinating U.S. document execution, apostille or authentication routing, custody, and international release.",
  url: canonical,
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: HAGUE_PROFESSIONAL_DESTINATIONS.length,
    itemListElement: HAGUE_PROFESSIONAL_DESTINATIONS.map((destination, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: `U.S. Document Execution for ${destination.name}`,
      url: `${canonical}/${destination.slug}`,
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

const questions = [
  ["Can you handle the U.S. side?", "Yes — execution-readiness, notarization/certification coordination, apostille or authentication routing, custody, and international release."],
  ["Are you a law firm?", "No. The Milano Seal is an execution and coordination platform, not a law firm."],
  ["Do I keep control of the legal work?", "Yes. Counsel and the appropriate professional advisor retain legal advice, strategy, document substance, and receiving-authority judgment."],
  ["Can I review the likely route first?", "Yes. Select the destination, document class, U.S. origin, and signer posture to structure the initial operational route."],
  ["Can I see what remains uncertain?", "Yes. The interface fails closed and shows what still requires operator or receiving-authority confirmation."],
  ["How do I start?", "Carry the structured route directly into secure professional intake."],
] as const;

export default function ProfessionalHubPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#060606] pt-[var(--header-total-height)] text-white">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />

        <section className="px-4 pb-16 pt-14 sm:px-6 md:pb-20 md:pt-20">
          <div className="mx-auto max-w-7xl">
            <div className="grid items-end gap-10 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#C6A55A]/70">
                  For International Counsel & Professional Advisors
                </p>
                <h1 className="mt-5 max-w-4xl font-serif text-4xl font-medium leading-[1.02] text-white sm:text-5xl md:text-7xl">
                  Your U.S. execution point for <em className="text-[#C6A55A]">international matters.</em>
                </h1>
                <p className="mt-7 max-w-3xl text-lg leading-8 text-white/52">
                  The Milano Seal coordinates the U.S. document-execution side of cross-border matters while counsel retains legal strategy, document substance, and receiving-authority judgment.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="#professional-journey"
                    className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-[#C6A55A] px-7 text-[10px] font-bold uppercase tracking-[0.12em] text-[#050507] transition-colors hover:bg-[#D4B76A]"
                  >
                    Review Your Country Route <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/intake?lane=professional&source=professional-hero"
                    className="inline-flex min-h-13 items-center justify-center rounded-xl border border-white/[0.1] px-7 text-[10px] uppercase tracking-[0.12em] text-white/62 transition-colors hover:border-[#C6A55A]/35 hover:text-[#C6A55A]"
                  >
                    Submit a Client Matter
                  </Link>
                </div>
              </div>

              <div className="rounded-3xl border border-white/[0.07] bg-[#09090A] p-6 sm:p-7">
                <div className="flex items-center gap-3">
                  <Globe2 className="h-5 w-5 text-[#C6A55A]" />
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#C6A55A]/55">Universal professional architecture</p>
                    <p className="mt-1 font-serif text-2xl">One journey. Every canonical Hague destination.</p>
                  </div>
                </div>
                <p className="mt-5 text-sm leading-6 text-white/42">
                  {HAGUE_PROFESSIONAL_DESTINATIONS.length} Hague destinations are currently represented in the canonical routing registry. The user experience stays consistent while jurisdiction intelligence changes underneath it.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-2 text-xs text-white/42">
                  {["Destination", "Document", "U.S. origin", "Signer posture", "Authority route", "Operator review"].map((item) => (
                    <div key={item} className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-black/20 px-3 py-2.5">
                      <Check className="h-3 w-3 text-[#C6A55A]/70" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/[0.05] bg-[#080808] px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#C6A55A]/55">The six questions counsel needs answered</p>
            <div className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.06] md:grid-cols-2 xl:grid-cols-3">
              {questions.map(([question, answer], index) => (
                <article key={question} className="bg-[#070708] p-6">
                  <div className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#C6A55A]/45">0{index + 1}</div>
                  <h2 className="mt-3 font-serif text-xl text-white">{question}</h2>
                  <p className="mt-3 text-sm leading-6 text-white/42">{answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <div id="professional-journey" className="scroll-mt-32">
          <UniversalAttorneyJourney />
        </div>

        <section className="px-4 py-16 sm:px-6 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="rounded-3xl border border-white/[0.07] bg-[#080809] p-7 md:p-9">
                <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/32">You retain</p>
                <h2 className="mt-3 font-serif text-3xl">Legal judgment stays with counsel.</h2>
                <div className="mt-6 space-y-3 text-sm text-white/48">
                  {["Legal advice and strategy", "Document substance and legal sufficiency", "Choice of legal instrument", "Receiving-authority legal judgment"].map((item) => (
                    <div key={item} className="flex items-center gap-3"><span className="h-1.5 w-1.5 rounded-full bg-white/25" />{item}</div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-[#C6A55A]/14 bg-[#C6A55A]/[0.025] p-7 md:p-9">
                <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-[#C6A55A]/55">Milano coordinates</p>
                <h2 className="mt-3 font-serif text-3xl">The U.S. execution side stays controlled.</h2>
                <div className="mt-6 space-y-3 text-sm text-white/55">
                  {["Execution-readiness review", "Notarization / certification coordination", "Apostille or authentication routing", "Controlled custody and release", "Operational Matter status", "Human operator review when required"].map((item) => (
                    <div key={item} className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-[#C6A55A]/70" />{item}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/[0.05] px-4 py-16 text-center sm:px-6">
          <div className="mx-auto max-w-3xl">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#C6A55A]/55">Professional handoff</p>
            <h2 className="mt-4 font-serif text-3xl md:text-4xl">Send the Matter, not a generic service request.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/42">
              Structure the destination and execution facts once, carry them into secure intake, and let Milano operator review confirm the U.S. path before payment or scheduling.
            </p>
            <Link
              href="/intake?lane=professional&source=professional-bottom"
              className="mt-7 inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-[#C6A55A] px-7 text-[10px] font-bold uppercase tracking-[0.12em] text-[#050507] transition-colors hover:bg-[#D4B76A]"
            >
              Start a Professional Matter <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-5 text-[11px] leading-5 text-white/23">
              The Milano Seal is not a law firm and does not provide legal advice or legal representation. Matter-specific receiving-authority requirements remain subject to professional review.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
