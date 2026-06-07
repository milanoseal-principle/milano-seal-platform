<<<<<<< HEAD
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Apostille vs. Authentication | The Milano Seal™",
  description: "Understand the difference between Hague apostille and consular legalization, and when to use each for international document use.",
  robots: { index: true, follow: true },
};

export default function ApostilleVsAuthenticationPage() {
  return (
    <>
      <div style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(198,165,90,0.7)", marginBottom: 16 }}>
        / THE MILANO SEAL™ GUIDE /
      </div>
      <h1 style={{ fontSize: 32, fontWeight: 400, fontFamily: "var(--font-playfair, Georgia, serif)", color: "#F6F1E6", margin: "0 0 32px", lineHeight: 1.3 }}>
        Apostille vs. Authentication
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <p style={{ fontSize: 14, color: "#F6F1E6", lineHeight: 1.8, margin: 0 }}>
          When a U.S. document needs to be used internationally, two primary pathways exist depending on the destination country: the Hague apostille and consular legalization (also called authentication or chain legalization). Understanding which applies to your situation depends primarily on whether the destination country is a member of the Hague Apostille Convention.
        </p>
        <p style={{ fontSize: 14, color: "#A8A29A", lineHeight: 1.8, margin: 0 }}>
          <strong style={{ color: "#F6F1E6" }}>Hague Apostille:</strong> If the destination country is a member of the Hague Convention of 5 October 1961, an apostille issued by the appropriate U.S. authority is sufficient. The receiving country is obligated under the Convention to accept the apostille as valid certification of the document&apos;s origin — no further diplomatic processing is required. The apostille is attached to, or issued alongside, the authenticated document and includes standardized information about the issuing authority.
        </p>
        <p style={{ fontSize: 14, color: "#A8A29A", lineHeight: 1.8, margin: 0 }}>
          <strong style={{ color: "#F6F1E6" }}>Consular Legalization (Authentication):</strong> For countries that are not members of the Hague Convention, a multi-step process is required. The document typically must first be notarized, then certified by the relevant state authority (such as the Secretary of State), then authenticated by the U.S. Department of State, and finally legalized by the consulate or embassy of the destination country. This process is longer and involves more parties than an apostille.
        </p>
        <p style={{ fontSize: 14, color: "#A8A29A", lineHeight: 1.8, margin: 0 }}>
          Examples of countries that are not Hague members and require consular legalization include some countries in Southeast Asia, the Middle East, and parts of Africa — though membership expands periodically. Each matter is reviewed at intake to determine the correct pathway for the specific destination country and document type. Confirming the current membership status of the destination country is a standard part of the review process.
        </p>
      </div>

      <div style={{ marginTop: 48, padding: "20px 24px", background: "rgba(198,165,90,0.06)", border: "1px solid rgba(198,165,90,0.2)", borderRadius: 8 }}>
        <p style={{ fontSize: 13, color: "#F6F1E6", margin: "0 0 12px" }}>
          Ready to apostille your documents? Start your matter.
        </p>
        <Link href="/intake" style={{ display: "inline-flex", alignItems: "center", padding: "10px 20px", background: "rgba(198,165,90,0.1)", border: "1px solid rgba(198,165,90,0.4)", borderRadius: 5, color: "#C6A55A", fontSize: 12, fontFamily: "monospace", letterSpacing: "0.1em", textDecoration: "none" }}>
          START YOUR MATTER →
        </Link>
      </div>
      <p style={{ fontSize: 11, color: "#5A5550", marginTop: 32, lineHeight: 1.6, fontFamily: "monospace" }}>
        This guide is for informational purposes only and does not constitute legal advice.
      </p>
    </>
=======
import { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = {
  title: "Apostille vs. Authentication | The Milano Seal™",
  description: "Apostille is for Hague Convention countries. Authentication and legalization is for non-Hague countries. Learn the difference and which process you need.",
  alternates: { canonical: "https://www.themilanoseal.com/learn/apostille-vs-authentication" },
  openGraph: { title: "Apostille vs. Authentication", description: "The difference between apostille and authentication/legalization for international documents.", images: [{ url: "https://www.themilanoseal.com/og-image.png", width: 1200, height: 630 }] },
};
const DISCLAIMER = "The Milano Seal provides document coordination, notarization, apostille/authentication routing review, courier custody, and release support. International use remains subject to destination-country and receiving-authority requirements. This service does not provide legal advice.";
export default function Page() {
  return (
    <div className="min-h-screen" style={{ background: "#060402" }}>
      <div className="max-w-2xl mx-auto px-6 py-16">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase mb-3" style={{ color: "rgba(212,175,55,0.5)" }}><Link href="/learn" style={{ color: "inherit" }}>Education</Link> · Authentication</p>
        <h1 className="font-serif text-3xl text-white tracking-wide mb-6">Apostille vs. Authentication</h1>
        <div className="space-y-5 text-base" style={{ color: "rgba(245,241,232,0.78)", lineHeight: "1.75" }}>
          <p>The correct process for internationalizing a document depends entirely on the destination country&apos;s membership in the Hague Apostille Convention.</p>
          <p><strong style={{ color: "rgba(255,255,255,0.9)" }}>Apostille (Hague countries):</strong> If the destination country is a Hague member, an apostille issued by the document&apos;s country of origin is sufficient. No further embassy or consulate action is required. The apostille is a standardized certificate attached to or issued alongside the document.</p>
          <p><strong style={{ color: "rgba(255,255,255,0.9)" }}>Authentication + Legalization (non-Hague countries):</strong> If the destination country has not joined the Hague Convention, the process is longer. The document must first be authenticated by the U.S. Department of State, then legalized by the destination country&apos;s embassy or consulate in the United States. This two-step chain is sometimes called "chain authentication" or "consular legalization."</p>
          <p>Examples of non-Hague countries that require legalization include Saudi Arabia, UAE (for certain documents), Canada (partially), and others. Always verify current status — countries can join or update their position.</p>
          <p>Choosing the wrong process can result in document rejection by the receiving authority. The receiving authority&apos;s specific requirements should be confirmed before processing begins.</p>
        </div>
        <div className="mt-10">
          <Link href="/intake" className="inline-block px-6 py-3 rounded font-mono text-sm font-semibold" style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.4)", color: "#D4AF37" }}>
            Start Your Matter →
          </Link>
        </div>
        <div className="mt-12 pt-8 border-t" style={{ borderColor: "rgba(212,175,55,0.1)" }}>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)", lineHeight: "1.7" }}>{DISCLAIMER}</p>
        </div>
      </div>
    </div>
>>>>>>> claude/funny-maxwell-hlxQN
  );
}
