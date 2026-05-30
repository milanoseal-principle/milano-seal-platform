import { notFound } from "next/navigation";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import Link from "next/link";
import type { Metadata } from "next";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CountryProfile {
  name: string;
  slug: string;
  hague_member: boolean;
  apostille_note: string;
  translation_note: string;
  common_documents: string[];
  execution_path: string;
  courier_note: string;
  legalization_note: string;
  overview: string;
}

// ---------------------------------------------------------------------------
// Country Registry — procedural guidance only, no legal guarantees
// ---------------------------------------------------------------------------

const COUNTRY_REGISTRY: Record<string, CountryProfile> = {
  italy: {
    name: "Italy",
    slug: "italy",
    hague_member: true,
    overview:
      "Italy is a Hague Convention member. US documents submitted to Italian authorities typically require an apostille and often a sworn Italian translation.",
    apostille_note:
      "US apostille from the issuing state is the standard authentication path for Italy.",
    translation_note:
      "Italian translation is typically required. Translation requirements are confirmed with the receiving authority.",
    common_documents: [
      "Power of Attorney",
      "Affidavit",
      "Birth Certificate",
      "Marriage Certificate",
      "Diploma",
    ],
    execution_path:
      "Notarization → State apostille → Italian translation (if required) → International courier",
    courier_note:
      "DHL Express and FedEx International are standard carriers for Italy.",
    legalization_note: "",
  },
  spain: {
    name: "Spain",
    slug: "spain",
    hague_member: true,
    overview:
      "Spain is a Hague Convention member. Documents for use in Spain generally require a US apostille.",
    apostille_note:
      "US apostille from the issuing state is the standard authentication path.",
    translation_note:
      "Spanish translation is typically required. Requirements confirmed with receiving authority.",
    common_documents: [
      "Power of Attorney",
      "Affidavit",
      "Birth Certificate",
      "Corporate Documents",
    ],
    execution_path:
      "Notarization → State apostille → Spanish translation (if required) → International courier",
    courier_note:
      "DHL Express and FedEx International are standard carriers for Spain.",
    legalization_note: "",
  },
  germany: {
    name: "Germany",
    slug: "germany",
    hague_member: true,
    overview:
      "Germany is a Hague Convention member. German authorities typically require a US apostille and German translation.",
    apostille_note:
      "US apostille is the standard authentication path for Germany.",
    translation_note:
      "German translation is typically required. Confirm with receiving authority.",
    common_documents: [
      "Power of Attorney",
      "Affidavit",
      "Birth Certificate",
      "Corporate Documents",
      "Citizenship Documents",
    ],
    execution_path:
      "Notarization → State apostille → German translation (if required) → International courier",
    courier_note: "DHL Express is the preferred carrier for Germany.",
    legalization_note: "",
  },
  portugal: {
    name: "Portugal",
    slug: "portugal",
    hague_member: true,
    overview:
      "Portugal is a Hague Convention member. Documents for Portuguese authorities typically require a US apostille.",
    apostille_note: "US apostille is the standard authentication path.",
    translation_note:
      "Portuguese translation is typically required. Requirements confirmed with receiving authority.",
    common_documents: [
      "Power of Attorney",
      "Affidavit",
      "Birth Certificate",
    ],
    execution_path:
      "Notarization → State apostille → Portuguese translation (if required) → International courier",
    courier_note:
      "DHL Express and FedEx International are standard carriers.",
    legalization_note: "",
  },
  uae: {
    name: "UAE",
    slug: "uae",
    hague_member: false,
    overview:
      "The UAE is not a member of the Hague Apostille Convention. Documents for UAE use typically require a different authentication chain.",
    apostille_note:
      "Apostille does not apply for UAE. Documents may require state-level authentication, US Department of State legalization, and UAE embassy attestation.",
    translation_note:
      "Arabic translation may be required depending on the document and receiving authority. Requirements confirmed before submission.",
    common_documents: [
      "Power of Attorney",
      "Corporate Documents",
      "Affidavit",
      "Marriage Certificate",
    ],
    execution_path:
      "Notarization → State authentication → US Dept of State legalization → UAE Embassy attestation",
    courier_note: "DHL Express is the standard carrier for UAE.",
    legalization_note:
      "Authentication chain: State-level notarization → State-level authentication → US Dept of State legalization → UAE Embassy attestation. This chain may vary — confirm current requirements before execution.",
  },
  mexico: {
    name: "Mexico",
    slug: "mexico",
    hague_member: true,
    overview:
      "Mexico is a Hague Convention member. US documents for use in Mexico typically require a US apostille.",
    apostille_note:
      "US apostille from the issuing state is the standard authentication path for Mexico.",
    translation_note:
      "Spanish translation is typically required for Mexican authorities. Requirements confirmed with receiving authority.",
    common_documents: [
      "Power of Attorney",
      "Affidavit",
      "Birth Certificate",
      "Corporate Documents",
    ],
    execution_path:
      "Notarization → State apostille → Spanish translation (if required) → International courier",
    courier_note:
      "DHL Express and FedEx International are standard carriers for Mexico.",
    legalization_note: "",
  },
};

// ---------------------------------------------------------------------------
// Motion constants (restrained)
// ---------------------------------------------------------------------------

const EASE = [0.16, 1, 0.3, 1] as const;

// ---------------------------------------------------------------------------
// Static params — 6 priority slugs
// ---------------------------------------------------------------------------

export async function generateStaticParams() {
  return [
    { country: "italy" },
    { country: "spain" },
    { country: "germany" },
    { country: "portugal" },
    { country: "uae" },
    { country: "mexico" },
  ];
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ country: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country: slug } = await params;
  const profile = COUNTRY_REGISTRY[slug];

  if (!profile) {
    return { title: "Not Found" };
  }

  const canonical = `https://themilanoseal.com/countries/${slug}`;

  return {
    title: `${profile.name} Document Authentication | The Milano Seal™`,
    description: `Professional apostille and document authentication services for ${profile.name}. Notarization, apostille, translation, and international courier. Executed properly the first time.`,
    alternates: { canonical },
    openGraph: {
      title: `${profile.name} Document Authentication | The Milano Seal™`,
      description: `Professional apostille and document authentication services for ${profile.name}. Executed properly the first time.`,
      url: canonical,
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function parseExecutionSteps(path: string): string[] {
  return path.split("→").map((s) => s.trim());
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function CountryPage({ params }: PageProps) {
  const { country: slug } = await params;
  const profile = COUNTRY_REGISTRY[slug];

  if (!profile) {
    notFound();
  }

  const steps = parseExecutionSteps(profile.execution_path);
  const canonical = `https://themilanoseal.com/countries/${slug}`;

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
            {profile.name} Document Services
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
            {profile.name} Document Authentication
          </h1>

          {/* Subtitle */}
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontWeight: 300,
              fontSize: "1.0625rem",
              lineHeight: 1.65,
              maxWidth: "620px",
              marginBottom: "1.5rem",
            }}
          >
            {profile.overview}
          </p>

          {/* Hague badge */}
          {profile.hague_member ? (
            <span
              style={{
                display: "inline-block",
                fontFamily: "monospace",
                fontSize: "9px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                padding: "4px 12px",
                borderRadius: "4px",
                border: "1px solid rgba(52,211,153,0.45)",
                color: "rgba(52,211,153,0.85)",
                background: "rgba(52,211,153,0.06)",
              }}
            >
              Hague Member
            </span>
          ) : (
            <span
              style={{
                display: "inline-block",
                fontFamily: "monospace",
                fontSize: "9px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                padding: "4px 12px",
                borderRadius: "4px",
                border: "1px solid rgba(251,191,36,0.45)",
                color: "rgba(251,191,36,0.85)",
                background: "rgba(251,191,36,0.06)",
              }}
            >
              Non-Hague
            </span>
          )}
        </section>

        {/* ── Authentication Path ───────────────────────────────────── */}
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
              Authentication Path
            </div>

            <p
              style={{
                color: "rgba(255,255,255,0.65)",
                fontSize: "0.9375rem",
                lineHeight: 1.7,
                marginBottom: profile.hague_member ? 0 : "1.5rem",
              }}
            >
              {profile.hague_member
                ? profile.apostille_note
                : profile.apostille_note}
            </p>

            {/* UAE legalization chain */}
            {!profile.hague_member && profile.legalization_note && (
              <>
                <div
                  style={{
                    fontFamily: "monospace",
                    fontSize: "9px",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                    color: "rgba(251,191,36,0.65)",
                    marginBottom: "0.75rem",
                  }}
                >
                  Legalization Chain
                </div>
                <ol
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  {profile.legalization_note
                    .split("→")
                    .map((step) => step.replace(/^Authentication chain:\s*/i, "").trim())
                    .filter(Boolean)
                    .map((step, i) => (
                      <li
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "0.75rem",
                          color: "rgba(255,255,255,0.6)",
                          fontSize: "0.875rem",
                          lineHeight: 1.6,
                        }}
                      >
                        <span
                          style={{
                            flexShrink: 0,
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                            background: "rgba(251,191,36,0.12)",
                            border: "1px solid rgba(251,191,36,0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "monospace",
                            fontSize: "9px",
                            color: "rgba(251,191,36,0.8)",
                            marginTop: "2px",
                          }}
                        >
                          {i + 1}
                        </span>
                        {step.replace(/\.$/, "")}
                      </li>
                    ))}
                </ol>
              </>
            )}
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

        {/* ── Common Documents ──────────────────────────────────────── */}
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
                marginBottom: "1.25rem",
              }}
            >
              Common Documents
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              {profile.common_documents.map((doc) => (
                <Link
                  key={doc}
                  href={`/intake?country=${profile.slug}&document=${slugify(doc)}`}
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
                  {doc}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Execution Path ────────────────────────────────────────── */}
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
                marginBottom: "1.25rem",
              }}
            >
              Execution Path
            </div>
            <ol
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: "0.625rem",
              }}
            >
              {steps.map((step, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.875rem",
                    color: "rgba(255,255,255,0.65)",
                    fontSize: "0.9rem",
                    lineHeight: 1.6,
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      background: "rgba(212,175,55,0.1)",
                      border: "1px solid rgba(212,175,55,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "monospace",
                      fontSize: "9px",
                      color: "rgba(212,175,55,0.8)",
                      marginTop: "2px",
                    }}
                  >
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Courier & Release ─────────────────────────────────────── */}
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
              Courier &amp; Release
            </div>
            <p
              style={{
                color: "rgba(255,255,255,0.65)",
                fontSize: "0.9375rem",
                lineHeight: 1.7,
              }}
            >
              {profile.courier_note}
            </p>
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
              authentication path for your {profile.name} matter.
            </p>
            <Link
              href={`/intake?country=${profile.slug}`}
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

        {/* Canonical link hint (for structured data crawlers) */}
        <link rel="canonical" href={canonical} />
      </main>
      <Footer />
    </>
  );
}
