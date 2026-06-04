import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hague vs. Non-Hague Countries | The Milano Seal™",
  description: "What the Hague Convention is, apostille for member countries, legalization for non-members, and examples of each.",
  robots: { index: true, follow: true },
};

export default function HagueVsNonHaguePage() {
  return (
    <>
      <div style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(198,165,90,0.7)", marginBottom: 16 }}>
        / THE MILANO SEAL™ GUIDE /
      </div>
      <h1 style={{ fontSize: 32, fontWeight: 400, fontFamily: "var(--font-playfair, Georgia, serif)", color: "#F6F1E6", margin: "0 0 32px", lineHeight: 1.3 }}>
        Hague vs. Non-Hague Countries
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <p style={{ fontSize: 14, color: "#F6F1E6", lineHeight: 1.8, margin: 0 }}>
          The Hague Convention Abolishing the Requirement of Legalisation for Foreign Public Documents, opened for signature on 5 October 1961, established the apostille as a single-step authentication mechanism for public documents exchanged between member states. A document apostilled in a Hague member country is recognized by all other Hague member countries as properly authenticated — no additional diplomatic processing is required between member states.
        </p>
        <p style={{ fontSize: 14, color: "#A8A29A", lineHeight: 1.8, margin: 0 }}>
          <strong style={{ color: "#F6F1E6" }}>Hague member countries</strong> (apostille countries) include the United States, the United Kingdom, France, Germany, Italy, Spain, Mexico, Brazil, Australia, Japan, South Korea, India, and over 100 others. When a U.S. document needs to be used in any of these countries, the apostille issued by the appropriate U.S. authority is the recognized form of document authentication. The receiving country&apos;s authorities accept the apostille under the Convention.
        </p>
        <p style={{ fontSize: 14, color: "#A8A29A", lineHeight: 1.8, margin: 0 }}>
          <strong style={{ color: "#F6F1E6" }}>Non-Hague countries</strong> are not parties to the Convention and do not recognize the apostille as sufficient authentication. Documents destined for these countries require a different process — typically called consular legalization or authentication — which involves multiple certification steps: notarization, state certification, U.S. Department of State authentication, and then legalization by the consulate or embassy of the destination country in the United States. This process is more time-consuming and involves more parties.
        </p>
        <p style={{ fontSize: 14, color: "#A8A29A", lineHeight: 1.8, margin: 0 }}>
          Countries that are not Hague Convention members include several in the Middle East, parts of Southeast Asia, and some African nations — though the membership list changes as new countries accede to the Convention. Because membership status affects the entire document execution pathway, confirming whether the destination country is currently a Hague member is one of the first steps in the intake review process. Each matter is assessed individually before any execution steps begin.
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
