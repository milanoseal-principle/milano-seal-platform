<<<<<<< HEAD
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "What Is an Apostille? | The Milano Seal™",
  description: "Learn what an apostille is, how the Hague Convention works, and when apostille certification is required for international document use.",
  robots: { index: true, follow: true },
};

export default function WhatIsAnApostillePage() {
  return (
    <>
      <div style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(198,165,90,0.7)", marginBottom: 16 }}>
        / THE MILANO SEAL™ GUIDE /
      </div>
      <h1 style={{ fontSize: 32, fontWeight: 400, fontFamily: "var(--font-playfair, Georgia, serif)", color: "#F6F1E6", margin: "0 0 32px", lineHeight: 1.3 }}>
        What Is an Apostille?
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <p style={{ fontSize: 14, color: "#F6F1E6", lineHeight: 1.8, margin: 0 }}>
          An apostille is a form of authentication issued to documents for use in countries that participate in the Hague Convention of 5 October 1961. The word &ldquo;apostille&rdquo; comes from the French term for certification. When a document is apostilled, the issuing authority attaches a standardized certificate — the apostille — that verifies the authenticity of the original signature, seal, or stamp on the document.
        </p>
        <p style={{ fontSize: 14, color: "#A8A29A", lineHeight: 1.8, margin: 0 }}>
          The Hague Convention abolished the requirement for full diplomatic or consular legalization of public documents when those documents are to be used in another member country. Instead, the apostille serves as a single-step certification recognized by all Hague member states. As of today, more than 120 countries participate in the Hague Apostille Convention, making the apostille one of the most widely accepted forms of document authentication in the world.
        </p>
        <p style={{ fontSize: 14, color: "#A8A29A", lineHeight: 1.8, margin: 0 }}>
          Apostilles are typically required when U.S. documents — such as birth certificates, marriage certificates, powers of attorney, corporate documents, or notarized affidavits — must be presented to a foreign government, court, institution, or authority. Common examples include immigration proceedings, foreign real estate transactions, employment abroad, international business formation, and academic credential verification.
        </p>
        <p style={{ fontSize: 14, color: "#A8A29A", lineHeight: 1.8, margin: 0 }}>
          In the United States, apostilles are issued at the state level for documents signed or certified by a state official, and at the federal level for documents signed by a federal official. The competent authority varies by state — in Florida, for example, the Secretary of State issues apostilles for notarized documents. Because processes and requirements vary by document type and destination country, each matter is reviewed individually to determine the correct apostille pathway.
        </p>
      </div>

      <div style={{ marginTop: 48, padding: "20px 24px", background: "rgba(198,165,90,0.06)", border: "1px solid rgba(198,165,90,0.2)", borderRadius: 8 }}>
        <p style={{ fontSize: 13, color: "#F6F1E6", margin: "0 0 12px" }}>
          Ready to apostille your documents?
        </p>
        <Link
          href="/intake"
          style={{
            display: "inline-flex", alignItems: "center",
            padding: "10px 20px", background: "rgba(198,165,90,0.1)",
            border: "1px solid rgba(198,165,90,0.4)", borderRadius: 5,
            color: "#C6A55A", fontSize: 12, fontFamily: "monospace",
            letterSpacing: "0.1em", textDecoration: "none",
          }}
        >
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
  title: "What Is an Apostille? | The Milano Seal™",
  description: "An apostille is a certificate that authenticates the origin of a public document for use in countries that are members of the Hague Apostille Convention.",
  alternates: { canonical: "https://www.themilanoseal.com/learn/what-is-an-apostille" },
  openGraph: { title: "What Is an Apostille?", description: "Learn what an apostille is, how it works, and when you need one.", images: [{ url: "https://www.themilanoseal.com/og-image.png", width: 1200, height: 630 }] },
};
const DISCLAIMER = "The Milano Seal provides document coordination, notarization, apostille/authentication routing review, courier custody, and release support. International use remains subject to destination-country and receiving-authority requirements. This service does not provide legal advice.";
export default function Page() {
  return (
    <div className="min-h-screen" style={{ background: "#060402" }}>
      <div className="max-w-2xl mx-auto px-6 py-16">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase mb-3" style={{ color: "rgba(212,175,55,0.5)" }}><Link href="/learn" style={{ color: "inherit" }}>Education</Link> · Apostille</p>
        <h1 className="font-serif text-3xl text-white tracking-wide mb-6">What Is an Apostille?</h1>
        <div className="space-y-5 text-base" style={{ color: "rgba(245,241,232,0.78)", lineHeight: "1.75" }}>
          <p>An apostille is a certificate issued by a designated government authority that authenticates the origin of a public document. It confirms that a signature, seal, or stamp on a document is genuine.</p>
          <p>The apostille system was established by the Hague Convention of 5 October 1961 (the "Apostille Convention"). Countries that have joined the convention agree to recognize apostilles issued by other member countries.</p>
          <p>Common documents that may require an apostille include: birth certificates, marriage certificates, death certificates, court orders, powers of attorney, notarized documents, educational diplomas, and corporate documents.</p>
          <p>In Florida, apostilles for notarized documents are issued by the Florida Department of State. Federal documents (such as FBI background checks) require a U.S. Department of State apostille.</p>
          <p>If your destination country is not a member of the Hague Convention, an apostille is not valid. Instead, the document must go through a legalization process, which typically involves authentication by the U.S. Department of State followed by legalization by the destination country&apos;s embassy or consulate.</p>
        </div>
        <div className="mt-10">
          <Link href="/intake" className="inline-block px-6 py-3 rounded font-mono text-sm font-semibold" style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.4)", color: "#D4AF37" }}>
            Start Your Apostille →
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
