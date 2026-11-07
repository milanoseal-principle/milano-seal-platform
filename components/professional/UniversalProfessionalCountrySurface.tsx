import { CounselContextLink } from "@/components/counsel/CounselContextLink";
import { getPublicCountryExecutionIntelligence } from "@/data/public-country-intelligence";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Globe2,
  Scale,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import type { Destination } from "@/data/destinations";
import { isPendingApostilleConventionDestination } from "@/lib/professional/universal-attorney-journey";

export function UniversalProfessionalCountrySurface({
  destination,
}: {
  destination: Destination;
}) {
  const intelligence = getPublicCountryExecutionIntelligence(
    destination.slug,
    destination.name,
  );
  const pendingConvention =
    isPendingApostilleConventionDestination(destination);
  const context = {
    corridor: `us-${destination.slug}`,
    landing_page: `/professional/${destination.slug}`,
  };

  return (
    <main
      className="min-h-screen bg-[#060606] text-white"
      style={{ paddingTop: "calc(var(--header-total-height) + var(--sa-top))" }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Counsel",
                item: "https://www.themilanoseal.com/counsel",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: destination.name,
                item: `https://www.themilanoseal.com/professional/${destination.slug}`,
              },
            ],
          }).replace(/</g, "\\u003c"),
        }}
      />
      <section className="relative overflow-hidden border-b border-white/[0.055] px-4 py-16 sm:px-6 md:py-24">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(circle at 78% 12%, rgba(198,166,91,0.10), transparent 28%)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#C6A65B]/68">
              Professional Execution Desk · {destination.name}
            </p>
            <h1 className="mt-5 font-serif text-5xl font-medium leading-[0.99] text-white sm:text-6xl md:text-7xl">
              U.S. document execution for{" "}
              <em className="text-[#C6A65B]">{destination.name} matters.</em>
            </h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-white/52">
              The Milano Seal coordinates the U.S. execution, notarization or
              certification review, apostille/authentication routing, custody,
              and international release side of the Matter.
            </p>
            <p className="mt-4 max-w-3xl text-base leading-7 text-white/36">
              Counsel and the appropriate professional advisor retain legal
              advice, legal strategy, document substance, instrument choice, and
              receiving-authority judgment.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <CounselContextLink
                destination={destination.name}
                context={context}
                className="group inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-[#C6A65B] px-7 text-sm font-semibold text-[#050507] transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-[#D4B76A]"
              >
                Send a U.S. Matter for {destination.name}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </CounselContextLink>
              <Link
                href={`/global-document-intelligence?country=${encodeURIComponent(destination.slug)}`}
                className="inline-flex min-h-13 items-center justify-center rounded-xl border border-white/[0.1] px-7 text-sm font-medium text-white/62 transition-colors hover:border-[#C6A65B]/35 hover:text-[#C6A65B]"
              >
                Open Global Intelligence
              </Link>
            </div>
          </div>

          <aside className="rounded-[1.75rem] border border-white/[0.075] bg-[#0A0A0A] p-6 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#C6A65B]/60">
                  Convention posture
                </p>
                <h2 className="mt-3 font-serif text-2xl text-[#F6F1E6]">
                  {destination.name}
                </h2>
              </div>
              <Globe2 className="h-5 w-5 text-[#C6A65B]" />
            </div>
            <p className="mt-5 text-[15px] leading-7 text-white/48">
              {intelligence.authoritySummary}
            </p>
            {pendingConvention ? (
              <div className="mt-5 flex gap-3 rounded-xl border border-amber-300/12 bg-amber-300/[0.025] p-4">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-200/65" />
                <p className="text-sm leading-6 text-white/44">
                  Convention entry into force is pending. Milano will verify the
                  current effective date and interim authentication posture
                  before any route is treated as operative.
                </p>
              </div>
            ) : (
              <div className="mt-5 flex gap-3 rounded-xl border border-[#C6A65B]/14 bg-[#C6A65B]/[0.025] p-4">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#C6A65B]" />
                <p className="text-sm leading-6 text-white/44">
                  The Convention posture identifies the starting framework.
                  Document origin and receiving-authority requirements still
                  control the Matter-specific route.
                </p>
              </div>
            )}
          </aside>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-7 px-4 py-12 sm:px-6 md:grid-cols-2">
        <div>
          <h2 className="font-serif text-3xl">What requires review</h2>
          <p className="mt-4 text-sm leading-7 text-white/75">
            {intelligence.routeLabel}. Intelligence status:{" "}
            {intelligence.sourceStatus}. Document origin, instrument, signer
            location, recipient instructions and intended use must be checked
            for this Matter. Country membership alone does not determine the
            requirements.
          </p>
        </div>
        <div>
          <h2 className="font-serif text-3xl">What can delay the U.S. side</h2>
          <p className="mt-4 text-sm leading-7 text-white/75">
            Incomplete documents, unclear issuing authorities, changed signer
            logistics or unconfirmed recipient instructions can delay readiness
            review. Wet-ink, witness, translation and authentication questions
            require document-specific confirmation.
          </p>
        </div>
        <div>
          <h2 className="font-serif text-3xl">What to send</h2>
          <p className="mt-4 text-sm leading-7 text-white/75">
            Your firm/contact details, destination, a short description and any
            written receiving-authority instructions. You can optionally provide
            the document privately. No account or route determination is
            required for first contact.
          </p>
        </div>
        <div>
          <h2 className="font-serif text-3xl">After receipt</h2>
          <p className="mt-4 text-sm leading-7 text-white/75">
            Milano reviews the request and contacts counsel about the next step.
            Canonical intake and the Matter Review System establish the route
            before a private quote. Wise settlement and the remaining controls
            govern scheduling, execution and release.
          </p>
          <Link
            href="/counsel/use-cases"
            className="inline-flex min-h-12 items-center text-[#E1C78F] underline"
          >
            Explore professional use cases
          </Link>
        </div>
      </section>
      <section className="px-4 py-16 sm:px-6 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-5 lg:grid-cols-3">
            <article className="rounded-2xl border border-white/[0.07] bg-[#0A0A0A] p-6">
              <ShieldCheck className="h-5 w-5 text-[#C6A65B]" />
              <h2 className="mt-5 font-serif text-2xl">U.S. route review</h2>
              <p className="mt-3 text-sm leading-6 text-white/40">
                Document origin, public-document eligibility, execution posture,
                and competent authority are reviewed before the authentication
                stage is treated as settled.
              </p>
            </article>
            <article className="rounded-2xl border border-white/[0.07] bg-[#0A0A0A] p-6">
              <Scale className="h-5 w-5 text-[#C6A65B]" />
              <h2 className="mt-5 font-serif text-2xl">
                Counsel stays in control
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/40">
                Milano does not choose the legal instrument, provide legal
                advice, or determine the receiving authority&apos;s legal
                sufficiency requirements.
              </p>
            </article>
            <article className="rounded-2xl border border-white/[0.07] bg-[#0A0A0A] p-6">
              <Globe2 className="h-5 w-5 text-[#C6A65B]" />
              <h2 className="mt-5 font-serif text-2xl">
                International release
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/40">
                Custody and courier release are coordinated as part of the same
                Matter after applicable execution and authentication stages are
                completed.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="border-y border-white/[0.055] bg-[#080808] px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#C6A65B]/60">
              Common document classes
            </p>
            <h2 className="mt-4 font-serif text-4xl">
              Start with the actual document.
            </h2>
            <p className="mt-4 text-base leading-7 text-white/40">
              General destination intelligence does not make every document
              follow the same path. The issuing authority and document class
              determine the U.S. competent-authority review.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {(destination.commonDocuments.length > 0
              ? destination.commonDocuments
              : [
                  "Power of Attorney",
                  "Affidavit",
                  "Corporate Document",
                  "Vital Record",
                ]
            ).map((document) => (
              <div
                key={document}
                className="flex min-h-14 items-center gap-3 rounded-xl border border-white/[0.06] bg-[#0A0A0A] px-4 py-3 text-sm text-white/55"
              >
                <Check className="h-4 w-4 shrink-0 text-[#C6A65B]" />
                {document}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 text-center sm:px-6 md:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#C6A65B]/60">
            Professional handoff
          </p>
          <h2 className="mt-4 font-serif text-4xl">
            Send the Matter. Milano will structure the U.S. side.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/40">
            Route information is operational guidance, not legal advice or a
            guarantee of apostille, legalization, or receiving-authority
            acceptance.
          </p>
          <CounselContextLink
            destination={destination.name}
            context={context}
            className="group mt-8 inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-[#C6A65B] px-8 text-sm font-semibold text-[#050507] transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-[#D4B76A]"
          >
            Send a U.S. Matter
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </CounselContextLink>
        </div>
      </section>
    </main>
  );
}
