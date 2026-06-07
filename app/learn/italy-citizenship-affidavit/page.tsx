<<<<<<< HEAD
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
=======
import { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = {
  title: "Italy Citizenship Affidavit | The Milano Seal™",
  description: "Italian citizenship by descent applications require apostilled affidavits, vital records, and certified translations. Learn about the jurat process and codice fiscale requirements.",
  alternates: { canonical: "https://www.themilanoseal.com/learn/italy-citizenship-affidavit" },
  openGraph: { title: "Italy Citizenship Affidavit", description: "Affidavit and document requirements for Italian citizenship by descent (jure sanguinis).", images: [{ url: "https://www.themilanoseal.com/og-image.png", width: 1200, height: 630 }] },
};
const DISCLAIMER = "The Milano Seal provides document coordination, notarization, apostille/authentication routing review, courier custody, and release support. International use remains subject to destination-country and receiving-authority requirements. This service does not provide legal advice.";
export default function Page() {
  return (
    <div className="min-h-screen" style={{ background: "#060402" }}>
      <div className="max-w-2xl mx-auto px-6 py-16">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase mb-3" style={{ color: "rgba(212,175,55,0.5)" }}><Link href="/learn" style={{ color: "inherit" }}>Education</Link> · Italy Citizenship</p>
        <h1 className="font-serif text-3xl text-white tracking-wide mb-6">Italy Citizenship Affidavit</h1>
        <div className="space-y-5 text-base" style={{ color: "rgba(245,241,232,0.78)", lineHeight: "1.75" }}>
          <p>Italian citizenship by descent (jure sanguinis) requires assembling a chain of vital records — birth, marriage, death, and naturalization documents — for each generational link to an Italian-born ancestor.</p>
          <p><strong style={{ color: "rgba(255,255,255,0.9)" }}>Affidavits and jurats:</strong> Some documents in the citizenship packet require a sworn affidavit or jurat from a notary public. An affidavit is a written statement made under oath; a jurat is the notarial certificate confirming the oath was administered. Each notarized affidavit must then receive an apostille from the Florida Department of State before submission to an Italian authority.</p>
          <p><strong style={{ color: "rgba(255,255,255,0.9)" }}>Codice fiscale:</strong> An Italian tax identification number (codice fiscale) may be required for certain administrative steps in Italy, including property transactions, banking, and some citizenship proceedings. The codice fiscale can be obtained through the Italian consulate.</p>
          <p><strong style={{ color: "rgba(255,255,255,0.9)" }}>Apostille on each document:</strong> Every U.S.-issued document in the citizenship packet — birth certificates, marriage certificates, death certificates, court orders — requires its own apostille. The apostille is issued separately for each document and cannot cover multiple documents in a single certificate.</p>
          <p><strong style={{ color: "rgba(255,255,255,0.9)" }}>Translation:</strong> All documents must be accompanied by a certified Italian translation. Translation requirements and accepted translator certifications vary by consulate and comune. Some Italian authorities maintain approved translator lists.</p>
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
