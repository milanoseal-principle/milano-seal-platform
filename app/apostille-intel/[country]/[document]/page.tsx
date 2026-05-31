import type { Metadata } from "next";
import Link from "next/link";
import {
  getWorkflow,
  getAllCountries,
  getAllDocumentTypes,
  getCountry,
  getDocumentType,
} from "@/data/intelligence";
import { WORKFLOWS } from "@/data/intelligence";

// ── Static params ─────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return WORKFLOWS.map((w) => ({
    country: w.countryId,
    document: w.documentId,
  }));
}

// ── SEO metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string; document: string }>;
}): Promise<Metadata> {
  const { country, document } = await params;
  const countryData = getCountry(country);
  const docData = getDocumentType(document);
  const countryName = countryData?.name ?? country;
  const docName = docData?.name ?? document.replace(/-/g, " ");

  return {
    title: `${countryName} ${docName} Apostille Requirements | The Milano Seal™`,
    description: `Complete apostille requirements for ${docName} documents destined for ${countryName} from Florida. Timeline, witnesses, translation requirements, and rejection triggers.`,
  };
}

// ── Country flag helper ───────────────────────────────────────────────────────

const FLAG_MAP: Record<string, string> = {
  IT: "🇮🇹",
  GR: "🇬🇷",
  ES: "🇪🇸",
  BR: "🇧🇷",
  PT: "🇵🇹",
  DE: "🇩🇪",
  AE: "🇦🇪",
  MX: "🇲🇽",
  FR: "🇫🇷",
  AR: "🇦🇷",
  CO: "🇨🇴",
  GB: "🇬🇧",
  JP: "🇯🇵",
  AU: "🇦🇺",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function WorkflowPage({
  params,
}: {
  params: Promise<{ country: string; document: string }>;
}) {
  const { country, document } = await params;
  const workflow = getWorkflow(country, document);
  const countryData = getCountry(country);
  const docData = getDocumentType(document);

  const countryName = countryData?.name ?? country.replace(/-/g, " ");
  const docName = docData?.name ?? document.replace(/-/g, " ");
  const flag = countryData ? (FLAG_MAP[countryData.isoCode] ?? countryData.isoCode) : "";

  // ── No workflow found ────────────────────────────────────────────────────

  if (!workflow) {
    return (
      <main style={{ minHeight: "100vh", backgroundColor: "#0A0A0A", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 1rem", fontFamily: "var(--font-geist, sans-serif)" }}>
        <div style={{ maxWidth: "540px", width: "100%", textAlign: "center" }}>
          <p style={{ color: "#C6A55A", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "1rem" }}>
            Intelligence / {countryName} / {docName}
          </p>
          <h1 style={{ color: "#FFFFFF", fontSize: "2rem", fontFamily: "var(--font-playfair, serif)", marginBottom: "1rem" }}>
            Corridor Not Yet Mapped
          </h1>
          <p style={{ color: "#9A9A9A", lineHeight: 1.65, marginBottom: "2rem" }}>
            We don&apos;t have a pre-built workflow for {docName} → {countryName} yet.
            Our specialists can guide you through the exact requirements for your matter.
          </p>
          <Link
            href={`/intake?country=${country}&document=${docName}`}
            style={{
              display: "inline-block",
              backgroundColor: "#C6A55A",
              color: "#0A0A0A",
              borderRadius: "6px",
              fontSize: "0.9rem",
              fontWeight: 700,
              padding: "0.9rem 2rem",
              textDecoration: "none",
              letterSpacing: "0.05em",
            }}
          >
            Contact Us for This Corridor →
          </Link>
        </div>
      </main>
    );
  }

  // ── Workflow found ───────────────────────────────────────────────────────

  const isHague = workflow.routeType === "Hague Convention";

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#0A0A0A", color: "#FFFFFF", fontFamily: "var(--font-geist, sans-serif)" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "3rem 1.5rem 5rem" }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: "2rem" }}>
          <nav style={{ color: "#5A5A5A", fontSize: "0.8rem", marginBottom: "1rem" }}>
            <Link href="/apostille-intel" style={{ color: "#5A5A5A", textDecoration: "none" }}>Intelligence</Link>
            <span style={{ margin: "0 0.4rem" }}>/</span>
            <span>{countryName}</span>
            <span style={{ margin: "0 0.4rem" }}>/</span>
            <span style={{ color: "#C6A55A" }}>{docName}</span>
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "2.5rem" }}>{flag}</span>
            <div>
              <h1 style={{ color: "#FFFFFF", fontSize: "clamp(1.5rem, 4vw, 2.25rem)", fontFamily: "var(--font-playfair, serif)", fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
                {docName}
              </h1>
              <p style={{ color: "#9A9A9A", margin: "0.25rem 0 0", fontSize: "0.95rem" }}>
                {countryName}
              </p>
            </div>
          </div>
        </div>

        {/* ── Route type badge ────────────────────────────────────────────── */}
        <div style={{ marginBottom: "2rem" }}>
          <span style={{
            display: "inline-block",
            border: "1px solid #C6A55A",
            color: "#C6A55A",
            borderRadius: "999px",
            fontSize: "0.75rem",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            padding: "0.35rem 1rem",
          }}>
            {workflow.routeType}
          </span>
        </div>

        {/* ── Timeline ────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: "2.5rem" }}>
          <p style={{ color: "#5A5A5A", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 0.35rem" }}>
            Estimated Timeline
          </p>
          <p style={{ color: "#C6A55A", fontSize: "clamp(1.5rem, 4vw, 2rem)", fontFamily: "var(--font-playfair, serif)", fontWeight: 700, margin: 0 }}>
            {workflow.estimatedTimeline}
          </p>
        </div>

        {/* ── Requirements grid ────────────────────────────────────────────── */}
        <div style={{ marginBottom: "2.5rem" }}>
          <p style={{ color: "#5A5A5A", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "1rem" }}>
            Requirements
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
            {/* Notarization */}
            <RequirementCard
              label="Notarization"
              value={
                workflow.notarizationRequired
                  ? workflow.notarizationType === "mobile"
                    ? "Mobile Notarization"
                    : workflow.notarizationType === "ron"
                    ? "RON (Remote Online)"
                    : "Mobile or RON"
                  : "Not Required"
              }
              met={workflow.notarizationRequired}
            />

            {/* Witnesses */}
            <RequirementCard
              label="Witnesses"
              value={
                workflow.witnessRequired
                  ? `${workflow.witnessCount ?? 1} Witness${(workflow.witnessCount ?? 1) > 1 ? "es" : ""} Required`
                  : "Not Required"
              }
              met={workflow.witnessRequired}
            />

            {/* Translation */}
            <RequirementCard
              label="Translation"
              value={
                workflow.translationRequired
                  ? `${workflow.translationLanguage}${workflow.certifiedTranslationRequired ? " (Certified)" : ""}`
                  : "Not Required"
              }
              met={workflow.translationRequired}
            />

            {/* Apostille / Legalization */}
            <RequirementCard
              label={isHague ? "Apostille" : "Legalization"}
              value={
                workflow.apostilleRequired
                  ? workflow.apostilleAuthority ?? "Required"
                  : workflow.consularLegalizationRequired
                  ? "Consular Legalization"
                  : "Not Required"
              }
              met={workflow.apostilleRequired || !!workflow.consularLegalizationRequired}
            />
          </div>
        </div>

        {/* ── Execution Path ───────────────────────────────────────────────── */}
        <div style={{ marginBottom: "2.5rem" }}>
          <p style={{ color: "#5A5A5A", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "1.25rem" }}>
            Execution Path
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {workflow.executionPath.map((step, i) => (
              <div key={i} style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                {/* Vertical line column */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                  <div style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    backgroundColor: "#C6A55A",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#0A0A0A",
                    flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  {i < workflow.executionPath.length - 1 && (
                    <div style={{ width: "1px", backgroundColor: "#2A2A2A", flexGrow: 1, minHeight: "24px" }} />
                  )}
                </div>
                {/* Step content */}
                <div style={{ paddingBottom: i < workflow.executionPath.length - 1 ? "1.5rem" : 0, paddingTop: "4px" }}>
                  <p style={{ color: "#FFFFFF", fontSize: "0.9rem", lineHeight: 1.55, margin: 0 }}>{step}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Rejection Triggers ───────────────────────────────────────────── */}
        <div style={{ marginBottom: "2.5rem" }}>
          <p style={{ color: "#5A5A5A", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "1.25rem" }}>
            Common Rejection Triggers
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {workflow.rejectionTriggers.map((rt, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: "#111111",
                  border: `1px solid ${rt.severity === "fatal" ? "#5A1A1A" : "#3A2D00"}`,
                  borderRadius: "8px",
                  padding: "1rem 1.25rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                  <span style={{
                    display: "inline-block",
                    flexShrink: 0,
                    marginTop: "2px",
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: rt.severity === "fatal" ? "#EF4444" : "#F59E0B",
                  }} />
                  <div>
                    <p style={{
                      color: rt.severity === "fatal" ? "#FCA5A5" : "#FCD34D",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      margin: "0 0 0.35rem",
                    }}>
                      {rt.trigger}
                      <span style={{
                        marginLeft: "0.5rem",
                        fontSize: "0.65rem",
                        fontWeight: 600,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: rt.severity === "fatal" ? "#EF4444" : "#F59E0B",
                      }}>
                        {rt.severity}
                      </span>
                    </p>
                    <p style={{ color: "#9A9A9A", fontSize: "0.82rem", lineHeight: 1.55, margin: 0 }}>
                      {rt.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Special Instructions ─────────────────────────────────────────── */}
        {workflow.specialInstructions && (
          <div style={{ marginBottom: "2.5rem" }}>
            <div style={{
              backgroundColor: "#0F0F0F",
              border: "1px solid #2A2A2A",
              borderLeft: "3px solid #C6A55A",
              borderRadius: "8px",
              padding: "1.25rem 1.5rem",
            }}>
              <p style={{ color: "#C6A55A", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 0.6rem" }}>
                Special Instructions
              </p>
              <p style={{ color: "#D4D4D4", fontSize: "0.88rem", lineHeight: 1.65, margin: 0 }}>
                {workflow.specialInstructions}
              </p>
            </div>
          </div>
        )}

        {/* ── CTA ─────────────────────────────────────────────────────────── */}
        <div style={{ borderTop: "1px solid #1A1A1A", paddingTop: "2rem" }}>
          <Link
            href={`/intake?country=${country}&document=${docName}&useCase=${workflow.id}`}
            style={{
              display: "inline-block",
              backgroundColor: "#C6A55A",
              color: "#0A0A0A",
              borderRadius: "6px",
              fontSize: "0.9rem",
              fontWeight: 700,
              padding: "0.9rem 2rem",
              textDecoration: "none",
              letterSpacing: "0.05em",
            }}
          >
            Begin Secure Intake →
          </Link>
        </div>
      </div>
    </main>
  );
}

// ── Requirement Card component ────────────────────────────────────────────────

function RequirementCard({ label, value, met }: { label: string; value: string; met: boolean }) {
  return (
    <div style={{
      backgroundColor: "#111111",
      border: "1px solid #1E1E1E",
      borderRadius: "8px",
      padding: "1rem 1.25rem",
    }}>
      <p style={{ color: "#5A5A5A", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 0.5rem" }}>
        {label}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: "0.9rem", color: met ? "#22C55E" : "#5A5A5A" }}>
          {met ? "✓" : "—"}
        </span>
        <p style={{ color: met ? "#FFFFFF" : "#5A5A5A", fontSize: "0.85rem", fontWeight: 500, margin: 0 }}>
          {value}
        </p>
      </div>
    </div>
  );
}
