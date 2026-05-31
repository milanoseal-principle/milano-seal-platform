import { notFound } from "next/navigation";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getCountry,
  getAllCountries,
  getAllDocumentTypes,
  getWorkflowOrDerive,
} from "@/data/intelligence";

// ---------------------------------------------------------------------------
// Static params — all 128 intelligence countries
// ---------------------------------------------------------------------------

export async function generateStaticParams() {
  return getAllCountries().map((c) => ({ country: c.id }));
}

export const dynamicParams = false;

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ country: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country: slug } = await params;
  const country = getCountry(slug);
  if (!country) return { title: "Not Found" };

  const isHague = country.corridorType === "hague";
  const canonical = `https://themilanoseal.com/countries/${slug}`;

  return {
    title: `${country.name} Document Authentication | The Milano Seal™`,
    description: `Professional apostille and document authentication services for ${country.name}. ${isHague ? `${country.name} is a Hague Convention member — apostille is the standard authentication path.` : `${country.name} requires consular legalization — full authentication chain executed correctly.`} Florida notarization, apostille, translation, and international courier.`,
    alternates: { canonical },
    openGraph: {
      title: `${country.name} Document Authentication | The Milano Seal™`,
      description: `Professional apostille and document authentication for ${country.name}. Executed properly the first time.`,
      url: canonical,
    },
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CountryPage({ params }: PageProps) {
  const { country: slug } = await params;
  const country = getCountry(slug);
  if (!country) notFound();

  const isHague = country.corridorType === "hague";
  const documents = getAllDocumentTypes();

  // Top 5 documents for this country (prefer commonDocuments list, else first 5)
  const priorityDocIds = country.commonDocuments?.length
    ? country.commonDocuments.slice(0, 5)
    : documents.slice(0, 5).map((d) => d.id);

  const topDocs = priorityDocIds
    .map((id) => documents.find((d) => d.id === id))
    .filter(Boolean) as typeof documents;

  // Derive workflows for top documents
  const topWorkflows = topDocs.map((doc) => ({
    doc,
    workflow: getWorkflowOrDerive(country!.id, doc.id),
  }));

  const canonical = `https://themilanoseal.com/countries/${slug}`;

  return (
    <>
      <Header />
      <main style={{ background: "rgba(8,5,1,0.97)", minHeight: "100vh" }} className="pt-[116px] overflow-x-hidden">

        {/* ── Hero ────────────────────────────────────────────────── */}
        <section className="px-6 pt-16 pb-10 max-w-4xl mx-auto">
          <div style={{ fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.3em", color: "rgba(212,175,55,0.8)", marginBottom: "1.25rem", textTransform: "uppercase" }}>
            {country.name} Document Services
          </div>

          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(2rem, 5vw, 3.25rem)", fontWeight: 700, color: "rgba(255,255,255,0.75)", lineHeight: 1.15, marginBottom: "1rem" }}>
            {country.name} Document Authentication
          </h1>

          <p style={{ color: "rgba(255,255,255,0.5)", fontWeight: 300, fontSize: "1.0625rem", lineHeight: 1.65, maxWidth: "620px", marginBottom: "1.5rem" }}>
            {isHague
              ? `${country.name} is a member of the Hague Apostille Convention${country.hagueSince ? ` (member since ${country.hagueSince})` : ""}. Florida-executed documents destined for ${country.name} are authenticated via apostille issued by the Florida Department of State.`
              : `${country.name} is not a member of the Hague Apostille Convention. Documents destined for ${country.name} require a full consular legalization chain: state-level authentication, US Department of State endorsement, and ${country.name} Embassy attestation.`
            }
          </p>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <span style={{
              display: "inline-block",
              fontFamily: "monospace",
              fontSize: "9px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              padding: "4px 12px",
              borderRadius: "4px",
              border: isHague ? "1px solid rgba(52,211,153,0.45)" : "1px solid rgba(251,191,36,0.45)",
              color: isHague ? "rgba(52,211,153,0.85)" : "rgba(251,191,36,0.85)",
              background: isHague ? "rgba(52,211,153,0.06)" : "rgba(251,191,36,0.06)",
            }}>
              {isHague ? `Hague Member${country.hagueSince ? ` · ${country.hagueSince}` : ""}` : "Consular Route"}
            </span>
            {country.translationLanguage && (
              <span style={{
                display: "inline-block",
                fontFamily: "monospace",
                fontSize: "9px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                padding: "4px 12px",
                borderRadius: "4px",
                border: "1px solid rgba(148,163,184,0.3)",
                color: "rgba(148,163,184,0.75)",
                background: "rgba(148,163,184,0.04)",
              }}>
                {country.translationLanguage} Translation
              </span>
            )}
            {country.requiresWitnesses && (
              <span style={{
                display: "inline-block",
                fontFamily: "monospace",
                fontSize: "9px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                padding: "4px 12px",
                borderRadius: "4px",
                border: "1px solid rgba(148,163,184,0.3)",
                color: "rgba(148,163,184,0.75)",
                background: "rgba(148,163,184,0.04)",
              }}>
                {country.witnessCount ?? 1} Witness{(country.witnessCount ?? 1) > 1 ? "es" : ""} Required
              </span>
            )}
          </div>
        </section>

        {/* ── Authentication Path ─────────────────────────────────── */}
        <section className="px-6 pb-6 max-w-4xl mx-auto">
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "10px", padding: "1.75rem" }}>
            <div style={{ fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(212,175,55,0.7)", marginBottom: "1rem" }}>
              Authentication Path
            </div>
            {isHague ? (
              <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[
                  "Florida notarization (mobile or Remote Online Notarization)",
                  "Apostille issued by Florida Department of State",
                  country.translationLanguage ? `Certified ${country.translationLanguage} translation` : null,
                  `International courier delivery to ${country.name}`,
                ].filter(Boolean).map((step, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", color: "rgba(255,255,255,0.65)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                    <span style={{ flexShrink: 0, width: "22px", height: "22px", borderRadius: "50%", background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", fontSize: "9px", color: "rgba(212,175,55,0.8)", marginTop: "2px" }}>
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            ) : (
              <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[
                  "Florida notarization",
                  "Florida Department of State authentication",
                  "U.S. Department of State authentication",
                  `${country.name} Embassy or Consulate attestation`,
                  country.translationLanguage ? `Certified ${country.translationLanguage} translation` : null,
                  `International courier delivery to ${country.name}`,
                ].filter(Boolean).map((step, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", color: "rgba(255,255,255,0.65)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                    <span style={{ flexShrink: 0, width: "22px", height: "22px", borderRadius: "50%", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", fontSize: "9px", color: "rgba(251,191,36,0.75)", marginTop: "2px" }}>
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            )}
            {country.specialNotes && (
              <div style={{ marginTop: "1.25rem", padding: "0.875rem 1rem", borderLeft: "3px solid rgba(212,175,55,0.4)", background: "rgba(212,175,55,0.04)", borderRadius: "0 6px 6px 0" }}>
                <p style={{ color: "rgba(212,175,55,0.8)", fontSize: "0.8rem", lineHeight: 1.6, margin: 0 }}>{country.specialNotes}</p>
              </div>
            )}
          </div>
        </section>

        {/* ── Top Document Workflows ─────────────────────────────── */}
        <section className="px-6 pb-6 max-w-4xl mx-auto">
          <div style={{ fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(212,175,55,0.7)", marginBottom: "1rem" }}>
            Common Documents for {country.name}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {topWorkflows.map(({ doc, workflow }) => (
              <Link
                key={doc.id}
                href={`/apostille-intel/${country.id}/${doc.id}`}
                style={{ textDecoration: "none" }}
              >
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", padding: "1rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", cursor: "pointer", transition: "border-color 0.2s" }}>
                  <div>
                    <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9rem", fontWeight: 500, margin: "0 0 0.25rem" }}>{doc.name}</p>
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.75rem", margin: 0, fontFamily: "monospace" }}>
                      {workflow?.estimatedTimeline ?? "—"} · {workflow?.translationRequired ? `${workflow.translationLanguage} translation` : "No translation"} · {workflow?.witnessRequired ? `${workflow.witnessCount ?? 1} witness` : "No witnesses"}
                    </p>
                  </div>
                  <span style={{ color: "rgba(212,175,55,0.6)", fontSize: "0.8rem", flexShrink: 0 }}>View →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────────── */}
        <section className="px-6 pb-16 max-w-4xl mx-auto">
          <div style={{ border: "1px solid rgba(212,175,55,0.3)", borderRadius: "12px", padding: "2.25rem", textAlign: "center", background: "rgba(212,175,55,0.03)" }}>
            <div style={{ fontFamily: "monospace", fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(212,175,55,0.6)", marginBottom: "0.75rem" }}>
              Begin Your Matter
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.375rem, 3vw, 1.875rem)", fontWeight: 700, color: "rgba(255,255,255,0.75)", marginBottom: "1rem" }}>
              Begin your {country.name} matter
            </h2>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.9rem", marginBottom: "1.75rem", lineHeight: 1.6 }}>
              Submit your document details and we will confirm the correct authentication path for your {country.name} matter.
            </p>
            <Link
              href={`/intake?country=${country.id}`}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 2rem", background: "rgba(212,175,55,0.9)", color: "rgba(8,5,1,0.97)", borderRadius: "8px", fontWeight: 600, fontSize: "0.875rem", textDecoration: "none", letterSpacing: "0.05em" }}
            >
              Begin {country.name} Execution
              <span aria-hidden="true">→</span>
            </Link>
            <p style={{ marginTop: "2rem", fontSize: "0.6875rem", color: "rgba(255,255,255,0.25)", lineHeight: 1.6, maxWidth: "480px", margin: "2rem auto 0" }}>
              Procedural guidance only. Not legal advice. Requirements confirmed with receiving authority before execution.
            </p>
          </div>
        </section>

        <link rel="canonical" href={canonical} />
      </main>
      <Footer />
    </>
  );
}
