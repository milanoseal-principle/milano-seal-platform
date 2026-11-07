import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { PublicShell } from "@/components/layout/PublicShell";
import { COUNSEL_USE_CASES } from "@/lib/counsel/content";
import { CounselContextLink } from "@/components/counsel/CounselContextLink";
import "../../counsel.css";
type Props = { params: Promise<{ useCase: string }> };
export function generateStaticParams() {
  return COUNSEL_USE_CASES.map((item) => ({ useCase: item.slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { useCase } = await params;
  const item = COUNSEL_USE_CASES.find((item) => item.slug === useCase);
  if (!item) return {};
  const title = `U.S. Execution Support: ${item.title} | The Milano Seal™`,
    canonical = `https://www.themilanoseal.com/counsel/use-cases/${item.slug}`;
  return {
    title,
    description: item.situation,
    alternates: { canonical },
    openGraph: {
      title,
      description: item.situation,
      url: canonical,
      type: "website",
      images: ["/og-image.png"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: item.situation,
      images: ["/og-image.png"],
    },
  };
}
export default async function Page({ params }: Props) {
  const { useCase } = await params;
  const item = COUNSEL_USE_CASES.find((item) => item.slug === useCase);
  if (!item) notFound();
  const path = `/counsel/use-cases/${item.slug}`;
  const sections = [
    ["The situation", item.situation],
    ["Documents counsel may send", item.examples],
    [
      "What counsel controls",
      "Legal advice, legal strategy, client representation, document substance, legal sufficiency and receiving-authority legal judgment remain with counsel.",
    ],
    [
      "What Milano coordinates",
      "Execution-readiness review, signer coordination, eligible notarization, applicable apostille or authentication routing, controlled custody, courier coordination and international release within the reviewed scope.",
    ],
    ["What Milano needs", item.needs],
    ["What can delay coordination", item.delay],
    [
      "How the Matter moves",
      "Inquiry receipt → operator response and qualification → canonical Matter intake → Matter Review System → confirmed execution route → private quote → Wise verified settlement → authorized scheduling → execution, custody and controlled release. The appropriate next action is confirmed after review.",
    ],
  ];
  const breadcrumbs = {
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
        name: "Professional use cases",
        item: "https://www.themilanoseal.com/counsel/use-cases",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: item.title,
        item: `https://www.themilanoseal.com${path}`,
      },
    ],
  };
  return (
    <PublicShell>
      <main className="counsel-page">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbs).replace(/</g, "\\u003c"),
          }}
        />
        <section className="counsel-wrap counsel-section">
          <nav aria-label="Breadcrumb">
            <Link href="/counsel">Counsel</Link> /{" "}
            <Link href="/counsel/use-cases">Professional use cases</Link>
          </nav>
          <p className="counsel-eyebrow">U.S. execution support for counsel</p>
          <h1>{item.title}</h1>
          <p>{item.situation}</p>
          <CounselContextLink
            className="counsel-button"
            context={{ practice_area: item.slug, landing_page: path }}
          >
            Send a U.S. Matter
          </CounselContextLink>
          <div className="counsel-scenarios">
            {sections.map(([heading, copy]) => (
              <article key={heading}>
                <div>
                  <h2 className="!text-2xl">{heading}</h2>
                  <p>{copy}</p>
                </div>
              </article>
            ))}
          </div>
          <p className="counsel-note">
            These are professional situations, not legal services offered by
            Milano. The Milano Seal is not a law firm and does not provide legal
            advice or legal representation. Final acceptance remains with the
            receiving authority.
          </p>
          <Link className="counsel-text-link" href={item.authority}>
            Related document and operational context
          </Link>
        </section>
      </main>
    </PublicShell>
  );
}
