import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { getDocumentBySlug, DOCUMENT_TAXONOMY } from "@/lib/compliance/documents";
import { buildDocumentPageSchema } from "@/lib/compliance/schemaBuilders";
import { CLIENT_COPY } from "@/lib/compliance/clientCopy";
import { DocumentAuthorityPage } from "@/components/seo/DocumentAuthorityPage";

type Props = { params: Promise<{ document: string }> };

export async function generateStaticParams() {
  return DOCUMENT_TAXONOMY.map(d => ({ document: d.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { document: slug } = await params;
  const doc = getDocumentBySlug(slug);
  if (!doc) return {};
  return {
    title: doc.seoTitle,
    description: doc.seoDescription,
    robots: { index: true, follow: true },
  };
}

export default async function DocumentPage({ params }: Props) {
  const { document: slug } = await params;
  const doc = getDocumentBySlug(slug);
  if (!doc) notFound();

  const schema = buildDocumentPageSchema(
    doc,
    `https://www.themilanoseal.com/documents/${slug}`
  );

  return (
    <>
      <Header />
      <main className="bg-[#060606] min-h-screen pb-16" style={{ paddingTop: "calc(var(--header-total-height) + var(--sa-top))" }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
        <DocumentAuthorityPage document={doc} />
      </main>
      <Footer />
    </>
  );
}
