import { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = {
  title: "Power of Attorney for Use Abroad | The Milano Seal™",
  description: "A power of attorney for international use requires notarization, apostille, and often certified translation. Learn country-specific requirements for Italy, Mexico, and UAE.",
  alternates: { canonical: "https://www.themilanoseal.com/learn/power-of-attorney-for-use-abroad" },
  openGraph: { title: "Power of Attorney for Use Abroad", description: "Notarization, apostille, and translation requirements for international powers of attorney.", images: [{ url: "https://www.themilanoseal.com/og-image.png", width: 1200, height: 630 }] },
};
const DISCLAIMER = "The Milano Seal provides document coordination, notarization, apostille/authentication routing review, courier custody, and release support. International use remains subject to destination-country and receiving-authority requirements. This service does not provide legal advice.";
export default function Page() {
  return (
    <div className="min-h-screen" style={{ background: "#060402" }}>
      <div className="max-w-2xl mx-auto px-6 py-16">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase mb-3" style={{ color: "rgba(212,175,55,0.5)" }}><Link href="/learn" style={{ color: "inherit" }}>Education</Link> · Power of Attorney</p>
        <h1 className="font-serif text-3xl text-white tracking-wide mb-6">Power of Attorney for Use Abroad</h1>
        <div className="space-y-5 text-base" style={{ color: "rgba(245,241,232,0.78)", lineHeight: "1.75" }}>
          <p>A power of attorney (POA) intended for use in a foreign country must typically be notarized in the United States and then apostilled or authenticated depending on the destination country.</p>
          <p><strong style={{ color: "rgba(255,255,255,0.9)" }}>Standard process:</strong> The POA is signed before a notary public, then submitted to the Florida Department of State (or relevant state) for an apostille. In most Hague Convention countries, this is sufficient for the document to be recognized.</p>
          <p><strong style={{ color: "rgba(255,255,255,0.9)" }}>Italy:</strong> Italian receiving authorities (courts, notai, land registry) generally require an apostille and a certified Italian translation. The POA must be carefully drafted to conform to Italian civil law requirements. Some Italian notai may request specific formalities.</p>
          <p><strong style={{ color: "rgba(255,255,255,0.9)" }}>Mexico:</strong> Mexico is a Hague member. An apostilled, Spanish-translated POA is generally required. Mexican notarial practice is distinct — Mexican notaries (notarios) have specific powers under law, so the POA must clearly state the acts it authorizes.</p>
          <p><strong style={{ color: "rgba(255,255,255,0.9)" }}>UAE:</strong> The UAE has joined the Hague Convention (effective 2021), but receiving authority acceptance varies. For many real estate and corporate transactions, notarization, apostille, and Arabic translation are all required.</p>
          <p>Translation must be performed by a certified translator accepted by the receiving authority. Some authorities maintain lists of approved translators.</p>
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
