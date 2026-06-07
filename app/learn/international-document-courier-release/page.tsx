import { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = {
  title: "International Document Courier & Release | The Milano Seal™",
  description: "Documents don't ship until paid and operator-released. Learn about the courier custody and release workflow, tracking, and why release review is required.",
  alternates: { canonical: "https://www.themilanoseal.com/learn/international-document-courier-release" },
  openGraph: { title: "International Document Courier & Release", description: "How document custody, release review, and international courier shipping works.", images: [{ url: "https://www.themilanoseal.com/og-image.png", width: 1200, height: 630 }] },
};
const DISCLAIMER = "The Milano Seal provides document coordination, notarization, apostille/authentication routing review, courier custody, and release support. International use remains subject to destination-country and receiving-authority requirements. This service does not provide legal advice.";
export default function Page() {
  return (
    <div className="min-h-screen" style={{ background: "#060402" }}>
      <div className="max-w-2xl mx-auto px-6 py-16">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase mb-3" style={{ color: "rgba(212,175,55,0.5)" }}><Link href="/learn" style={{ color: "inherit" }}>Education</Link> · Courier Release</p>
        <h1 className="font-serif text-3xl text-white tracking-wide mb-6">International Document Courier &amp; Release</h1>
        <div className="space-y-5 text-base" style={{ color: "rgba(245,241,232,0.78)", lineHeight: "1.75" }}>
          <p>Once a document has been notarized, apostilled, and authenticated, it enters a custody and release phase before international shipment. This phase exists to protect the client and ensure documents are only released when payment is confirmed and all processing steps are verified.</p>
          <p><strong style={{ color: "rgba(255,255,255,0.9)" }}>The release gate:</strong> Documents do not ship until two conditions are met: (1) payment is confirmed, and (2) an operator completes a release review. The release review confirms the document chain is complete, the apostille is valid, and the package is correctly addressed to the receiving authority.</p>
          <p><strong style={{ color: "rgba(255,255,255,0.9)" }}>Why release review is required:</strong> International courier shipments of original documents are difficult to recall once dispatched. Release review reduces the risk of shipping an incomplete or incorrectly addressed package, which could result in rejection at the destination or loss of an original document.</p>
          <p><strong style={{ color: "rgba(255,255,255,0.9)" }}>Tracking:</strong> Once released, international shipments are tracked via the courier provider. Tracking information is shared with the client after the release is confirmed. Delivery times vary by destination country and service level.</p>
          <p><strong style={{ color: "rgba(255,255,255,0.9)" }}>Receiving authority delivery:</strong> For documents going to a specific consulate, comune, or government office, delivery confirmation at the institution is the client&apos;s responsibility. The courier delivers to the address; acceptance by the receiving authority is a separate step.</p>
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
