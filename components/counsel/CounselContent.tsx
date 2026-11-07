import { CounselContextLink } from "./CounselContextLink";
import Link from "next/link";
import {
  COUNSEL_CORRIDORS,
  COUNSEL_FAQ,
  COUNSEL_USE_CASES,
} from "@/lib/counsel/content";
import { getProfessionalDestination } from "@/lib/professional/universal-attorney-journey";
export function CounselDiscovery() {
  return (
    <section className="counsel-wrap counsel-section">
      <p className="counsel-eyebrow">
        Professional situations. Governed destinations.
      </p>
      <h2>Find your client’s context.</h2>
      <p>
        Explore an execution-support situation or destination. These pages
        inform review; they do not determine a legal route.
      </p>
      <div className="counsel-actions">
        <Link className="counsel-text-link" href="/counsel/corridors">
          U.S. execution corridors
        </Link>
        <Link className="counsel-text-link" href="/counsel/use-cases">
          Professional use cases
        </Link>
      </div>
    </section>
  );
}
export function CounselFAQ() {
  return (
    <section className="counsel-wrap counsel-section">
      <p className="counsel-eyebrow">Counsel questions</p>
      <h2>Clear answers before your first Matter.</h2>
      {COUNSEL_FAQ.map(([question, answer]) => (
        <details key={question} className="border-b border-white/20 py-4">
          <summary className="min-h-12 cursor-pointer text-[#E1C78F]">
            {question}
          </summary>
          <p>{answer}</p>
        </details>
      ))}
      <p>Nicholas Milano is a commissioned Florida Notary Public.</p>
      <Link className="counsel-button" href="/counsel#inquiry">
        Send a U.S. Matter
      </Link>
    </section>
  );
}
export function CounselDiscoveryList({
  kind,
}: {
  kind: "corridors" | "use-cases";
}) {
  return (
    <section className="counsel-wrap counsel-section">
      <nav aria-label="Breadcrumb">
        <Link href="/counsel">Counsel</Link> /{" "}
        {kind === "corridors" ? "Corridors" : "Use cases"}
      </nav>
      <p className="counsel-eyebrow">For international counsel</p>
      <h1>
        {kind === "corridors"
          ? "Your U.S. side. Your destination."
          : "Execution support around your client’s situation."}
      </h1>
      <p>
        Milano coordinates the U.S. execution side. Counsel retains legal
        advice, strategy, instrument choice and legal sufficiency. Every Matter
        is reviewed individually; final acceptance stays with the receiving
        authority.
      </p>
      <div className="counsel-scenarios">
        {kind === "corridors"
          ? COUNSEL_CORRIDORS.map((slug) => {
              const destination = getProfessionalDestination(slug);
              return destination ? (
                <article key={slug}>
                  <div>
                    <h2 className="!text-2xl">
                      United States → {destination.name}
                    </h2>
                    <p>
                      Review document origin, signer logistics and
                      receiving-authority requirements for this destination.
                    </p>
                    <Link
                      className="counsel-text-link"
                      href={`/professional/${slug}`}
                    >
                      Review {destination.name} execution context
                    </Link>
                  </div>
                </article>
              ) : null;
            })
          : COUNSEL_USE_CASES.map((item) => (
              <article key={item.slug}>
                <div>
                  <h2 className="!text-2xl">{item.title}</h2>
                  <p>{item.situation}</p>
                  <Link
                    className="counsel-text-link"
                    href={`/counsel/use-cases/${item.slug}`}
                  >
                    View execution-support situation
                  </Link>
                </div>
              </article>
            ))}
      </div>
    </section>
  );
}
export function CounselAuthorityCTA({
  destination,
  landingPage,
}: {
  destination?: string;
  landingPage: string;
}) {
  return (
    <aside className="my-8 border-l border-[#C6A65B]/50 py-3 pl-5">
      <p className="text-xs uppercase tracking-widest text-[#C6A65B]">
        For international counsel
      </p>
      <p className="my-3 text-sm text-white/70">
        A U.S.-based client needs a document executed for use abroad? Send the
        context for review. You retain the legal work.
      </p>
      <CounselContextLink
        className="inline-flex min-h-12 items-center text-[#E1C78F] underline underline-offset-4"
        destination={destination}
        context={{ landing_page: landingPage }}
      >
        Send a U.S. Matter
      </CounselContextLink>
    </aside>
  );
}
