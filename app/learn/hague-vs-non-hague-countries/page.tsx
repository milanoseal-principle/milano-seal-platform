import { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = {
  title: "Hague vs. Non-Hague Countries | The Milano Seal™",
  description: "Learn how Hague and non-Hague routing affects apostille, authentication, legalization, and receiving-authority review for U.S. documents intended for use abroad.",
  alternates: { canonical: "https://www.themilanoseal.com/learn/hague-vs-non-hague-countries" },
  openGraph: { title: "Hague vs. Non-Hague Countries", description: "How treaty status, document origin, competent authority, and receiving-authority requirements shape the authentication route.", images: [{ url: "https://www.themilanoseal.com/og-image.png", width: 1200, height: 630 }] },
};
const DISCLAIMER = "The Milano Seal provides document coordination, notarization, apostille/authentication routing review, courier custody, and release support. International use remains subject to destination-country and receiving-authority requirements. This service does not provide legal guidance.";
export default function Page() {
  return (
    <div className="min-h-screen" style={{ background: "#060402" }}>
      <div className="max-w-2xl mx-auto px-6 py-16">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase mb-3" style={{ color: "rgba(212,175,55,0.5)" }}><Link href="/learn" style={{ color: "inherit" }}>Education</Link> · Hague Convention</p>
        <h1 className="font-serif text-3xl text-white tracking-wide mb-6">Hague vs. Non-Hague Countries</h1>
        <div className="space-y-5 text-base" style={{ color: "rgba(245,241,232,0.78)", lineHeight: "1.75" }}>
          <p>The Hague Apostille Convention (formally the Convention of 5 October 1961 Abolishing the Requirement of Legalisation for Foreign Public Documents) created a simplified one-step certification — the apostille — for use between member countries.</p>
          <p><strong style={{ color: "rgba(255,255,255,0.9)" }}>Hague routing</strong> can allow an apostille to replace the traditional legalization chain when the Convention is in force between the relevant jurisdictions and the document is eligible for that route. The competent authority still depends on the document origin and execution facts, and the receiving authority may impose additional requirements.</p>
          <p><strong style={{ color: "rgba(255,255,255,0.9)" }}>Non-Hague or non-apostille routing</strong> may require state authentication, federal authentication, embassy or consular legalization, translation review, or another receiving-authority-specific sequence. The exact chain is Matter-specific and should be verified before execution.</p>
          <p><strong style={{ color: "rgba(255,255,255,0.9)" }}>Important caveat:</strong> Treaty status, bilateral applicability, competent-authority rules, and receiving-authority requirements can change. The Milano Seal uses governed route intelligence and operator review rather than relying on a static country label alone.</p>
          <p>Even within Hague countries, some receiving authorities (consulates, courts, private institutions) may impose additional requirements beyond the apostille. Confirming the specific receiving authority&apos;s requirements is always recommended.</p>
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
