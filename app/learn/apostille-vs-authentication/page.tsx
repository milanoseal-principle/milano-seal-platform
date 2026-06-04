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
  );
}
