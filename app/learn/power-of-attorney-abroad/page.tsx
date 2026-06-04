import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Power of Attorney for Use Abroad | The Milano Seal™",
  description: "Notarized POA requirements, apostille for international use, and common cross-border power of attorney scenarios.",
  robots: { index: true, follow: true },
};

export default function PowerOfAttorneyAbroadPage() {
  return (
    <>
      <div style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(198,165,90,0.7)", marginBottom: 16 }}>
        / THE MILANO SEAL™ GUIDE /
      </div>
      <h1 style={{ fontSize: 32, fontWeight: 400, fontFamily: "var(--font-playfair, Georgia, serif)", color: "#F6F1E6", margin: "0 0 32px", lineHeight: 1.3 }}>
        Power of Attorney for Use Abroad
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <p style={{ fontSize: 14, color: "#F6F1E6", lineHeight: 1.8, margin: 0 }}>
          A power of attorney (POA) executed in the United States for use in a foreign country typically requires notarization and, if the destination country is a Hague Convention member, an apostille. The apostille authenticates the notary&apos;s signature and seal so that the receiving country&apos;s authorities can verify the document was properly executed under U.S. law. Without this authentication, many foreign institutions — including banks, real estate registries, and courts — may decline to honor the POA.
        </p>
        <p style={{ fontSize: 14, color: "#A8A29A", lineHeight: 1.8, margin: 0 }}>
          Common international uses of a notarized, apostilled power of attorney include authorizing a representative to manage real property transactions abroad (buying, selling, or managing real estate), handling banking or financial matters in a foreign country, managing estate administration when a beneficiary or executor is located outside the country, and acting on behalf of a principal in legal or administrative proceedings in a foreign jurisdiction.
        </p>
        <p style={{ fontSize: 14, color: "#A8A29A", lineHeight: 1.8, margin: 0 }}>
          The drafting and notarization of the POA is an important step before apostille processing can begin. The document must first be properly notarized by a commissioned notary public. In Florida, Remote Online Notarization (RON) is available for signers who cannot appear in person. Once notarized, the document is submitted to the appropriate apostille-issuing authority — the Florida Secretary of State for Florida-notarized documents. Acceptance of RON-executed POAs by the receiving foreign authority should be confirmed before proceeding.
        </p>
        <p style={{ fontSize: 14, color: "#A8A29A", lineHeight: 1.8, margin: 0 }}>
          Some receiving countries also require that the apostilled POA be translated into the official language of that country before it can be used. Translation requirements vary by country and institution. These factors are assessed at intake to ensure the complete set of steps is identified before execution begins.
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
