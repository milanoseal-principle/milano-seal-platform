import { notFound } from "next/navigation";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import Link from "next/link";
import type { Metadata } from "next";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DocumentProfile {
  name: string;
  slug: string;
  purpose: string;
  notarization_path: string;
  apostille_note: string;
  translation_note: string;
  country_routing_note: string;
  overview: string;
}

// ---------------------------------------------------------------------------
// Document Registry — procedural guidance only, no legal guarantees
// ---------------------------------------------------------------------------

const DOCUMENT_REGISTRY: Record<string, DocumentProfile> = {
  "power-of-attorney": {
    name: "Power of Attorney",
    slug: "power-of-attorney",
    purpose:
      "Authorizes another party to act on behalf of the principal in legal, financial, or property matters in a foreign jurisdiction.",
    notarization_path:
      "Requires notarization by a commissioned notary. Two adult witnesses are typically required for international execution.",
    apostille_note:
      "For Hague member countries, a US apostille from the issuing state is the standard authentication path. Non-Hague destinations may require an embassy authentication chain.",
    translation_note:
      "If the destination country's official language is not English, translation is typically required. Translation requirements are confirmed with the receiving authority.",
    country_routing_note:
      "Document requirements vary by destination country and receiving authority. The execution path is confirmed before international release.",
    overview:
      "A Power of Attorney for international use requires precise notarization and authentication. The Milano Seal executes POAs for use in Italy, Spain, Germany, Portugal, Mexico, UAE, and other destinations.",
  },
  affidavit: {
    name: "Affidavit",
    slug: "affidavit",
    purpose:
      "A sworn written statement of fact, used in legal proceedings, immigration, business, and personal matters in foreign jurisdictions.",
    notarization_path:
      "Requires notarization of the signer's sworn oath. Two adult witnesses may be required depending on the destination jurisdiction.",
    apostille_note:
      "Hague member destinations require US apostille. Non-Hague destinations may require embassy/consular chain authentication.",
    translation_note:
      "Translation to the destination language is typically required. Requirements confirmed with receiving authority.",
    country_routing_note:
      "Country-specific routing confirmed before execution. Some jurisdictions have specific affidavit format requirements.",
    overview:
      "Affidavits for international use must be properly notarized and authenticated for the destination country. The Milano Seal handles execution, authentication, and international delivery.",
  },
  "birth-certificate": {
    name: "Birth Certificate",
    slug: "birth-certificate",
    purpose:
      "Official vital record used for citizenship applications, residency, marriage registration, inheritance proceedings, and other legal matters abroad.",
    notarization_path:
      "Certified copies may require additional notarization or certification depending on the issuing authority and destination requirements.",
    apostille_note:
      "Apostille is required for Hague member destinations. The apostille is attached to the certified copy or notarized document.",
    translation_note:
      "Translation is typically required for non-English speaking destination countries. Certified translation requirements confirmed with receiving authority.",
    country_routing_note:
      "Birth certificate authentication requirements vary significantly by destination. Country-specific path confirmed before execution.",
    overview:
      "Birth certificates for international use require proper authentication and often translation. The execution path depends on the issuing state and destination country.",
  },
  "corporate-documents": {
    name: "Corporate Documents",
    slug: "corporate-documents",
    purpose:
      "Business formation documents, certificates of good standing, board resolutions, and corporate authorizations for international business transactions.",
    notarization_path:
      "Corporate documents require notarization of authorized signatory. Articles of incorporation and certificates of good standing require secretary of state authentication.",
    apostille_note:
      "Apostille is attached to the authenticated corporate document. Some jurisdictions require additional authentication steps.",
    translation_note:
      "Translation to the destination business jurisdiction's official language is often required. Requirements confirmed with receiving authority.",
    country_routing_note:
      "Corporate document requirements vary by destination country and type of transaction. A qualified review is performed before execution.",
    overview:
      "Corporate documents for international use — articles, resolutions, good standing certificates — require precise authentication. The Milano Seal coordinates multi-step authentication chains.",
  },
  "citizenship-documents": {
    name: "Citizenship Documents",
    slug: "citizenship-documents",
    purpose:
      "Naturalization certificates, certificates of citizenship, and related documents used for dual nationality applications, ancestry claims, and residency proceedings.",
    notarization_path:
      "Citizenship documents typically require notarization of certified copies. Original document handling is governed by strict custody protocols.",
    apostille_note:
      "Apostille on citizenship documents is standard for Hague member destinations. Some destinations have specific requirements — confirmed before submission.",
    translation_note:
      "Translation is typically required. For citizenship proceedings, certified translation with notarization may be required.",
    country_routing_note:
      "Citizenship document requirements are highly specific to the destination country and proceeding type. Manual review is required before execution.",
    overview:
      "Citizenship documents for international proceedings require careful authentication and custody management. Each matter is reviewed individually.",
  },
  "yacht-maritime-documents": {
    name: "Yacht & Maritime Documents",
    slug: "yacht-maritime-documents",
    purpose:
      "Bills of sale, title transfers, vessel registration documents, and crew agreements for international yacht transactions and maritime operations.",
    notarization_path:
      "Maritime documents require notarization of the parties. Vessel documentation requirements may involve the US Coast Guard National Vessel Documentation Center.",
    apostille_note:
      "Apostille requirements for maritime documents depend on the flag state and destination jurisdiction. Requirements confirmed with maritime authority.",
    translation_note:
      "Translation may be required depending on the destination registry and flag state. Maritime translation requirements are confirmed before submission.",
    country_routing_note:
      "Maritime document authentication varies significantly by flag state, destination registry, and transaction type. Manual review is required.",
    overview:
      "Yacht and maritime documents for international transactions require specialized authentication. The Milano Seal coordinates notarization, authentication, and delivery for vessel transactions.",
  },
};

// ---------------------------------------------------------------------------
// Priority country routing for document pages
// ---------------------------------------------------------------------------

const COUNTRY_CHIPS = [
  { name: "Italy", slug: "italy" },
  { name: "Spain", slug: "spain" },
  { name: "Germany", slug: "germany" },
  { name: "Portugal", slug: "portugal" },
  { name: "UAE", slug: "uae" },
  { name: "Mexico", slug: "mexico" },
];

// ---------------------------------------------------------------------------
// Static params
// ---------------------------------------------------------------------------

export async function generateStaticParams() {
  return [
    { document: "power-of-attorney" },
    { document: "affidavit" },
    { document: "birth-certificate" },
    { document: "corporate-documents" },
    { document: "citizenship-documents" },
    { document: "yacht-maritime-documents" },
  ];
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ document: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { document: slug } = await params;
  const profile = DOCUMENT_REGISTRY[slug];

  if (!profile) {
    return { title: "Not Found" };
  }

  const destinations = "Italy, Spain, Germany, Portugal, UAE, Mexico";
  const canonical = `https://themilanoseal.com/documents/${slug}`;

  return {
    title: `${profile.name} Apostille & Authentication | The Milano Seal™`,
    description: `Professional ${profile.name} apostille, notarization, and international authentication services. Executed properly for ${destinations}.`,
    alternates: { canonical },
    openGraph: {
      title: `${profile.name} Apostille & Authentication | The Milano Seal™`,
      description: `Professional ${profile.name} apostille, notarization, and international authentication services. Executed properly for ${destinations}.`,
      url: canonical,
    },
  };
}

// ---------------------------------------------------------------------------
// Stat chips data
// ---------------------------------------------------------------------------

const STAT_CHIPS = [
  "Hague Member Destinations",
  "International Delivery",
  "Full Chain Management",
] as const;

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function DocumentPage({ params }: PageProps) {
  const { document: slug } = await params;
  const profile = DOCUMENT_REGISTRY[slug];

  if (!profile) {
    notFound();
  }

  const canonical = `https://themilanoseal.com/documents/${slug}`;

  return (
    <>
      <Header />
      <main
        style={{ background: "rgba(8,5,1,0.97)", minHeight: "100vh" }}
        className="pt-[116px] overflow-x-hidden"
      >
        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section className="px-6 pt-16 pb-10 max-w-4xl mx-auto">
          {/* Gold chip */}
          <div
            style={{
              fontFamily: "monospace",
              fontSize: "9px",
              letterSpacing: "0.3em",
              color: "rgba(212,175,55,0.8)",
              marginBottom: "1.25rem",
              textTransform: "uppercase",
            }}
          >
            Apostille &amp; Authentication
          </div>

          {/* H1 */}
          <h1
            style={{
              fontFamily: "'Playfair Display', 'Playfair', Georgia, serif",
              fontSize: "clamp(2rem, 5vw, 3.25rem)",
              fontWeight: 700,
              color: "rgba(255,255,255,0.75)",
              lineHeight: 1.15,
              marginBottom: "1rem",
            }}
          >
            {profile.name}
          </h1>

          {/* Purpose */}
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontWeight: 300,
              fontSize: "1.0625rem",
              lineHeight: 1.65,
              maxWidth: "620px",
              marginBottom: "1.75rem",
            }}
          >
            {profile.purpose}
          </p>

          {/* Stat chips */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            {STAT_CHIPS.map((chip) => (
              <span
                key={chip}
                style={{
                  fontFamily: "monospace",
                  fontSize: "9px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  padding: "5px 13px",
                  borderRadius: "4px",
                  border: "1px solid rgba(212,175,55,0.2)",
                  color: "rgba(212,175,55,0.65)",
                  background: "rgba(212,175,55,0.04)",
                }}
              >
                {chip}
              </span>
            ))}
          </div>
        </section>

        {/* ── Notarization Path ─────────────────────────────────────── */}
        <section className="px-6 pb-6 max-w-4xl mx-auto">
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "10px",
              padding: "1.75rem",
            }}
          >
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "9px",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "rgba(212,175,55,0.7)",
                marginBottom: "1rem",
              }}
            >
              Notarization Path
            </div>
            <p
              style={{
                color: "rgba(255,255,255,0.65)",
                fontSize: "0.9375rem",
                lineHeight: 1.7,
              }}
            >
              {profile.notarization_path}
            </p>
          </div>
        </section>

        {/* ── Apostille & Authentication ────────────────────────────── */}
        <section className="px-6 pb-6 max-w-4xl mx-auto">
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "10px",
              padding: "1.75rem",
            }}
          >
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "9px",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "rgba(212,175,55,0.7)",
                marginBottom: "1rem",
              }}
            >
              Apostille &amp; Authentication
            </div>
            <p
              style={{
                color: "rgba(255,255,255,0.65)",
                fontSize: "0.9375rem",
                lineHeight: 1.7,
              }}
            >
              {profile.apostille_note}
            </p>
          </div>
        </section>

        {/* ── Translation Guidance ──────────────────────────────────── */}
        <section className="px-6 pb-6 max-w-4xl mx-auto">
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "10px",
              padding: "1.75rem",
            }}
          >
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "9px",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "rgba(212,175,55,0.7)",
                marginBottom: "1rem",
              }}
            >
              Translation Guidance
            </div>
            <p
              style={{
                color: "rgba(255,255,255,0.65)",
                fontSize: "0.9375rem",
                lineHeight: 1.7,
              }}
            >
              {profile.translation_note}
            </p>
          </div>
        </section>

        {/* ── Destination Routing ───────────────────────────────────── */}
        <section className="px-6 pb-6 max-w-4xl mx-auto">
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "10px",
              padding: "1.75rem",
            }}
          >
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "9px",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "rgba(212,175,55,0.7)",
                marginBottom: "1rem",
              }}
            >
              Destination Routing
            </div>
            <p
              style={{
                color: "rgba(255,255,255,0.65)",
                fontSize: "0.9375rem",
                lineHeight: 1.7,
                marginBottom: "1.5rem",
              }}
            >
              {profile.country_routing_note}
            </p>

            {/* Country chips */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              {COUNTRY_CHIPS.map((country) => (
                <Link
                  key={country.slug}
                  href={`/intake?document=${profile.slug}&country=${country.slug}`}
                  style={{
                    fontFamily: "monospace",
                    fontSize: "10px",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    padding: "6px 14px",
                    borderRadius: "5px",
                    border: "1px solid rgba(212,175,55,0.25)",
                    color: "rgba(212,175,55,0.75)",
                    background: "rgba(212,175,55,0.04)",
                    textDecoration: "none",
                    transition: "border-color 0.2s, color 0.2s",
                    display: "inline-block",
                  }}
                >
                  {country.name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Smart Intake CTA ──────────────────────────────────────── */}
        <section className="px-6 pb-16 max-w-4xl mx-auto">
          <div
            style={{
              border: "1px solid rgba(212,175,55,0.3)",
              borderRadius: "12px",
              padding: "2.25rem",
              textAlign: "center",
              background: "rgba(212,175,55,0.03)",
            }}
          >
            <div
              style={{
                fontFamily: "monospace",
                fontSize: "9px",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "rgba(212,175,55,0.6)",
                marginBottom: "0.75rem",
              }}
            >
              Begin Your Matter
            </div>
            <h2
              style={{
                fontFamily: "'Playfair Display', 'Playfair', Georgia, serif",
                fontSize: "clamp(1.375rem, 3vw, 1.875rem)",
                fontWeight: 700,
                color: "rgba(255,255,255,0.75)",
                marginBottom: "1rem",
              }}
            >
              Begin your {profile.name} matter
            </h2>
            <p
              style={{
                color: "rgba(255,255,255,0.45)",
                fontSize: "0.9rem",
                marginBottom: "1.75rem",
                lineHeight: 1.6,
              }}
            >
              Submit your document details and we will confirm the correct
              authentication path and destination routing for your matter.
            </p>
            <Link
              href={`/intake?document=${profile.slug}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 2rem",
                background: "rgba(212,175,55,0.9)",
                color: "rgba(8,5,1,0.97)",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "0.875rem",
                textDecoration: "none",
                letterSpacing: "0.05em",
              }}
            >
              Begin {profile.name} Execution
              <span aria-hidden="true">→</span>
            </Link>

            {/* Disclaimer */}
            <p
              style={{
                marginTop: "2rem",
                fontSize: "0.6875rem",
                color: "rgba(255,255,255,0.25)",
                lineHeight: 1.6,
                maxWidth: "480px",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              Procedural guidance only. Not legal advice. Requirements confirmed
              with receiving authority before execution.
            </p>
          </div>
        </section>

        {/* Canonical link hint */}
        <link rel="canonical" href={canonical} />
      </main>
      <Footer />
    </>
  );
}
