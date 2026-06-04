import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FBI Background Check Apostille | The Milano Seal™",
  description: "How to apostille an FBI Identity History Summary for international use — federal vs. state apostille and common uses abroad.",
  robots: { index: true, follow: true },
};

export default function FbiApostillePage() {
  return (
    <>
      <div style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(198,165,90,0.7)", marginBottom: 16 }}>
        / THE MILANO SEAL™ GUIDE /
      </div>
      <h1 style={{ fontSize: 32, fontWeight: 400, fontFamily: "var(--font-playfair, Georgia, serif)", color: "#F6F1E6", margin: "0 0 32px", lineHeight: 1.3 }}>
        FBI Background Check Apostille
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <p style={{ fontSize: 14, color: "#F6F1E6", lineHeight: 1.8, margin: 0 }}>
          An FBI Identity History Summary — commonly called an FBI background check or rap sheet — is a federal document that many foreign countries require as part of immigration, long-stay visa, residency, or employment applications. When the destination country is a member of the Hague Apostille Convention, the FBI background check typically must be apostilled before it will be accepted by the foreign authority.
        </p>
        <p style={{ fontSize: 14, color: "#A8A29A", lineHeight: 1.8, margin: 0 }}>
          Because the FBI is a federal agency, the apostille for an FBI background check is issued at the federal level — not the state level. The U.S. Department of State, Office of Authentications, is the competent authority for apostilling federal documents. This means the process differs from apostilling a state-issued document such as a birth certificate or a notarized affidavit. The FBI background check is sent directly to the U.S. Department of State for federal apostille processing, rather than to a state Secretary of State.
        </p>
        <p style={{ fontSize: 14, color: "#A8A29A", lineHeight: 1.8, margin: 0 }}>
          Common uses of apostilled FBI background checks include applications for foreign residency or retirement visas (such as Italy&apos;s elective residency visa), immigration applications in countries that require a criminal history check from the applicant&apos;s country of origin, employment authorization for certain roles abroad, and adoption proceedings. The specific requirements — including whether the document must be translated — vary by destination country and receiving institution.
        </p>
        <p style={{ fontSize: 14, color: "#A8A29A", lineHeight: 1.8, margin: 0 }}>
          Processing times for federal apostille can differ from state apostille timelines. The standard processing pathway through the U.S. Department of State involves mailing the original document with a cover sheet, payment, and return instructions. Each matter is reviewed at intake to confirm the current pathway and timeline based on the specific destination and purpose.
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
