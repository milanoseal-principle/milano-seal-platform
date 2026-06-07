import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Can a Remote Online Notarization Be Apostilled? | The Milano Seal™",
  description: "Understand RON and apostille compatibility, Florida law, and how destination-country acceptance varies by matter.",
  robots: { index: true, follow: true },
};

export default function RonApostillePage() {
  return (
    <>
      <div style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(198,165,90,0.7)", marginBottom: 16 }}>
        / THE MILANO SEAL™ GUIDE /
      </div>
      <h1 style={{ fontSize: 32, fontWeight: 400, fontFamily: "var(--font-playfair, Georgia, serif)", color: "#F6F1E6", margin: "0 0 32px", lineHeight: 1.3 }}>
        Can a Remote Online Notarization Be Apostilled?
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <p style={{ fontSize: 14, color: "#F6F1E6", lineHeight: 1.8, margin: 0 }}>
          Remote Online Notarization (RON) allows a notary public to perform notarizations using audio-video technology when the signer is not physically present. Florida was among the first states to authorize RON by statute, and Florida-commissioned notaries may perform RON for signers located anywhere in the world when certain conditions are met. The question of whether a RON-notarized document can subsequently receive an apostille is one that comes up frequently in international document matters.
        </p>
        <p style={{ fontSize: 14, color: "#A8A29A", lineHeight: 1.8, margin: 0 }}>
          From a Florida legal standpoint, a document notarized via RON by a Florida notary public can be presented to the Florida Secretary of State for an apostille. The apostille certifies the notary&apos;s authority and the authenticity of their signature — it does not certify the content of the document or the identity of the signer beyond what the notary attested to. Provided the notarization was properly performed under Florida law, the document is eligible for apostille processing through the Secretary of State.
        </p>
        <p style={{ fontSize: 14, color: "#A8A29A", lineHeight: 1.8, margin: 0 }}>
          The more significant variable is whether the destination country will accept a RON-notarized, apostilled document. Acceptance varies by country, by the receiving authority within that country, and sometimes by the specific document type and purpose. Some countries and institutions explicitly accept RON-executed documents with apostille; others require in-person notarization for certain document categories. This is not a determination that can be made universally — it must be confirmed for each specific matter and destination.
        </p>
        <p style={{ fontSize: 14, color: "#A8A29A", lineHeight: 1.8, margin: 0 }}>
          At intake, the operator reviews each matter to assess whether RON is an appropriate execution pathway given the destination country and the receiving authority&apos;s known requirements. When RON acceptance by the receiving authority cannot be confirmed, the matter will be flagged for discussion before execution proceeds.
        </p>
      </div>

      <div style={{ marginTop: 48, padding: "20px 24px", background: "rgba(198,165,90,0.06)", border: "1px solid rgba(198,165,90,0.2)", borderRadius: 8 }}>
        <p style={{ fontSize: 13, color: "#F6F1E6", margin: "0 0 12px" }}>Ready to apostille your documents? Start your matter.</p>
        <Link href="/intake" style={{ display: "inline-flex", alignItems: "center", padding: "10px 20px", background: "rgba(198,165,90,0.1)", border: "1px solid rgba(198,165,90,0.4)", borderRadius: 5, color: "#C6A55A", fontSize: 12, fontFamily: "monospace", letterSpacing: "0.1em", textDecoration: "none" }}>
          START YOUR MATTER →
        </Link>
      </div>
      <p style={{ fontSize: 11, color: "#5A5550", marginTop: 32, lineHeight: 1.6, fontFamily: "monospace" }}>
        This guide is for informational purposes only and does not constitute legal advice.
      </p>
    </>
  );
}
