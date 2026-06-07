import { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = {
  title: "What Is an Apostille? | The Milano Seal™",
  description: "An apostille is a certificate that authenticates the origin of a public document for use in countries that are members of the Hague Apostille Convention.",
  alternates: { canonical: "https://www.themilanoseal.com/learn/what-is-an-apostille" },
  openGraph: { title: "What Is an Apostille?", description: "Learn what an apostille is, how it works, and when you need one.", images: [{ url: "https://www.themilanoseal.com/og-image.png", width: 1200, height: 630 }] },
};
const DISCLAIMER = "The Milano Seal provides document coordination, notarization, apostille/authentication routing review, courier custody, and release support. International use remains subject to destination-country and receiving-authority requirements. This service does not provide legal advice.";
export default function Page() {
  return (
    <div className="min-h-screen" style={{ background: "#060402" }}>
      <div className="max-w-2xl mx-auto px-6 py-16">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase mb-3" style={{ color: "rgba(212,175,55,0.5)" }}><Link href="/learn" style={{ color: "inherit" }}>Education</Link> · Apostille</p>
        <h1 className="font-serif text-3xl text-white tracking-wide mb-6">What Is an Apostille?</h1>
        <div className="space-y-5 text-base" style={{ color: "rgba(245,241,232,0.78)", lineHeight: "1.75" }}>
          <p>An apostille is a certificate issued by a designated government authority that authenticates the origin of a public document. It confirms that a signature, seal, or stamp on a document is genuine.</p>
          <p>The apostille system was established by the Hague Convention of 5 October 1961 (the "Apostille Convention"). Countries that have joined the convention agree to recognize apostilles issued by other member countries.</p>
          <p>Common documents that may require an apostille include: birth certificates, marriage certificates, death certificates, court orders, powers of attorney, notarized documents, educational diplomas, and corporate documents.</p>
          <p>In Florida, apostilles for notarized documents are issued by the Florida Department of State. Federal documents (such as FBI background checks) require a U.S. Department of State apostille.</p>
          <p>If your destination country is not a member of the Hague Convention, an apostille is not valid. Instead, the document must go through a legalization process, which typically involves authentication by the U.S. Department of State followed by legalization by the destination country&apos;s embassy or consulate.</p>
        </div>
        <div className="mt-10">
          <Link href="/intake" className="inline-block px-6 py-3 rounded font-mono text-sm font-semibold" style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.4)", color: "#D4AF37" }}>
            Start Your Apostille →
          </Link>
        </div>
        <div className="mt-12 pt-8 border-t" style={{ borderColor: "rgba(212,175,55,0.1)" }}>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)", lineHeight: "1.7" }}>{DISCLAIMER}</p>
        </div>
      </div>
    </div>
  );
}
