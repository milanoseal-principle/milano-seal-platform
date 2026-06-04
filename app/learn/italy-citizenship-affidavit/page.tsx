import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Italy Citizenship Affidavit & Document Apostille | The Milano Seal™",
  description: "Jure Sanguinis document requirements, apostille for the Italian Consulate, and key considerations for Italian citizenship applications.",
  robots: { index: true, follow: true },
};

export default function ItalyCitizenshipPage() {
  return (
    <>
      <div style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(198,165,90,0.7)", marginBottom: 16 }}>
        / THE MILANO SEAL™ GUIDE /
      </div>
      <h1 style={{ fontSize: 32, fontWeight: 400, fontFamily: "var(--font-playfair, Georgia, serif)", color: "#F6F1E6", margin: "0 0 32px", lineHeight: 1.3 }}>
        Italy Citizenship Affidavit &amp; Document Apostille
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <p style={{ fontSize: 14, color: "#F6F1E6", lineHeight: 1.8, margin: 0 }}>
          Italian citizenship by descent — known as Jure Sanguinis, meaning &ldquo;right of blood&rdquo; — allows individuals with Italian ancestors to apply for recognition of Italian citizenship through the Italian Consulate or a court in Italy. This process requires assembling a package of vital records tracing an unbroken Italian lineage, along with supporting affidavits and other documents. Many of these documents must be apostilled before the Consulate will accept them as authentic.
        </p>
        <p style={{ fontSize: 14, color: "#A8A29A", lineHeight: 1.8, margin: 0 }}>
          Common documents required for a Jure Sanguinis application include birth certificates, marriage certificates, death certificates, and naturalization records for each generation in the lineage. For U.S.-issued documents, each must typically be apostilled through the appropriate state Secretary of State (for state vital records) or through the U.S. Department of State (for federal documents such as naturalization certificates). Requirements can vary by the specific Italian Consulate handling the application.
        </p>
        <p style={{ fontSize: 14, color: "#A8A29A", lineHeight: 1.8, margin: 0 }}>
          Affidavits may be required for certain evidentiary purposes — for example, to attest to the accuracy of records, to clarify discrepancies in names or dates across documents, or to explain gaps in the chain of evidence. These affidavits must be notarized before they can be apostilled. Italy is a member of the Hague Apostille Convention, so apostille processing through the relevant U.S. authority is the standard authentication pathway for documents destined for Italian authorities.
        </p>
        <p style={{ fontSize: 14, color: "#A8A29A", lineHeight: 1.8, margin: 0 }}>
          Italian authorities also require a codice fiscale (Italian tax identification number) in certain procedural contexts, and all documents submitted to the Italian Consulate or an Italian court in a language other than Italian must be accompanied by a certified Italian translation. Translation requirements should be confirmed with the specific Consulate handling the application, as practices vary. Each Jure Sanguinis matter involves unique document sets — the intake review process is used to identify the correct apostille pathway and translation requirements for each specific application.
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
