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
  );
}
