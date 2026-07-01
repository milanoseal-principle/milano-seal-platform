import { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = {
  title: "Apostille vs. Authentication | The Milano Seal™",
  description: "Apostille is for Hague Convention countries. Authentication and legalization is for non-Hague countries. Learn the difference and which process you need.",
  alternates: { canonical: "https://www.themilanoseal.com/learn/apostille-vs-authentication" },
  openGraph: { title: "Apostille vs. Authentication", description: "The difference between apostille and authentication/legalization for international documents.", images: [{ url: "https://www.themilanoseal.com/og-image.png", width: 1200, height: 630 }] },
};
const DISCLAIMER = "The Milano Seal provides document coordination, notarization, apostille/authentication routing review, courier custody, and release support. International use remains subject to destination-country and receiving-authority requirements. This service does not provide legal guidance.";
export default function Page() {
  return (
    <div className="min-h-screen" style={{ background: "#060402" }}>
      <div className="max-w-2xl mx-auto px-6 py-16">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase mb-3" style={{ color: "rgba(212,175,55,0.5)" }}><Link href="/learn" style={{ color: "inherit" }}>Education</Link> · Authentication</p>
        <h1 className="font-serif text-3xl text-white tracking-wide mb-6">Apostille vs. Authentication</h1>
        <div className="space-y-5 text-base" style={{ color: "rgba(245,241,232,0.78)", lineHeight: "1.75" }}>
          <p>The correct process for internationalizing a document depends entirely on the destination country&apos;s membership in the Hague Apostille Convention.</p>
          <p><strong style={{ color: "rgba(255,255,255,0.9)" }}>Apostille (Hague countries):</strong> If the destination country is a Hague member, an apostille issued by the document&apos;s country of origin is sufficient. No further embassy or consulate action is required. The apostille is a standardized certificate attached to or issued alongside the document.</p>
          <p><strong style={{ color: "rgba(255,255,255,0.9)" }}>Authentication + Legalization (non-Hague countries):</strong> If the destination country has not joined the Hague Convention, the process is longer. The document must first be authenticated by the U.S. Department of State, then legalized by the destination country&apos;s embassy or consulate in the United States. This two-step chain is sometimes called "chain authentication" or "consular legalization."</p>
          <p>Examples of non-Hague countries that require legalization include Saudi Arabia, UAE (for certain documents), Canada (partially), and others. Always verify current status — countries can join or update their position.</p>
          <p>Choosing the wrong process can result in document rejection by the receiving authority. The receiving authority&apos;s specific requirements should be confirmed before processing begins.</p>
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
