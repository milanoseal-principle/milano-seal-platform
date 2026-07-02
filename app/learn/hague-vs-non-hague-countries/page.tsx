import { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = {
  title: "Hague vs. Non-Hague Countries | The Milano Seal™",
  description: "Hague Convention members accept apostilles. Non-Hague countries require a longer legalization chain through the U.S. Department of State and the destination embassy.",
  alternates: { canonical: "https://www.themilanoseal.com/learn/hague-vs-non-hague-countries" },
  openGraph: { title: "Hague vs. Non-Hague Countries", description: "Which countries accept apostilles and which require full legalization — and what that means for your documents.", images: [{ url: "https://www.themilanoseal.com/og-image.png", width: 1200, height: 630 }] },
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
          <p><strong style={{ color: "rgba(255,255,255,0.9)" }}>Hague member countries</strong> accept an apostille as sufficient certification of the origin of a public document. Examples include: Italy, Spain, France, Germany, Mexico, Brazil, Israel, Japan, South Korea, Australia, and over 120 others. No embassy or consulate step is required after the apostille is attached.</p>
          <p><strong style={{ color: "rgba(255,255,255,0.9)" }}>Non-Hague countries</strong> do not recognize apostilles. Documents intended for use in these countries must go through a full legalization chain: (1) notarization (if applicable), (2) state-level certification (if applicable), (3) authentication by the U.S. Department of State, and (4) legalization by the destination country&apos;s embassy or consulate in the U.S. Examples of non-Hague countries include: Saudi Arabia, most Gulf states (prior to recent accessions), several African nations, and others.</p>
          <p><strong style={{ color: "rgba(255,255,255,0.9)" }}>Important caveat:</strong> Country status can change. The UAE acceded to the Hague Convention in 2021; other countries periodically join. Always verify current Hague membership for your specific destination country before beginning document processing.</p>
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
