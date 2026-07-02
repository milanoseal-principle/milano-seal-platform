import { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = {
  title: "Can a RON Document Be Apostilled? | The Milano Seal™",
  description: "Florida RON (Remote Online Notarization) documents can receive a Florida apostille. However, the receiving authority must also accept RON — which is not guaranteed.",
  alternates: { canonical: "https://www.themilanoseal.com/learn/can-a-ron-document-be-apostilled" },
  openGraph: { title: "Can a RON Document Be Apostilled?", description: "RON and apostille eligibility explained — what Florida authorizes vs. what receiving authorities accept.", images: [{ url: "https://www.themilanoseal.com/og-image.png", width: 1200, height: 630 }] },
};
const DISCLAIMER = "The Milano Seal provides document coordination, notarization, apostille/authentication routing review, courier custody, and release support. International use remains subject to destination-country and receiving-authority requirements. This service does not provide legal guidance.";
export default function Page() {
  return (
    <div className="min-h-screen" style={{ background: "#060402" }}>
      <div className="max-w-2xl mx-auto px-6 py-16">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase mb-3" style={{ color: "rgba(212,175,55,0.5)" }}><Link href="/learn" style={{ color: "inherit" }}>Education</Link> · RON</p>
        <h1 className="font-serif text-3xl text-white tracking-wide mb-6">Can a RON Document Be Apostilled?</h1>
        <div className="space-y-5 text-base" style={{ color: "rgba(245,241,232,0.78)", lineHeight: "1.75" }}>
          <p>Remote Online Notarization (RON) allows a notary public to perform notarial acts electronically using audio-video technology. Florida was among the first states to authorize RON and has a robust statutory framework for it.</p>
          <p><strong style={{ color: "rgba(255,255,255,0.9)" }}>Apostille eligibility:</strong> Because Florida law authorizes RON, Florida-notarized RON documents are eligible to receive a Florida Department of State apostille. The Florida SOS treats a RON notarization as legally equivalent to an in-person notarization for apostille purposes.</p>
          <p><strong style={{ color: "rgba(255,255,255,0.9)" }}>Receiving authority acceptance is a separate question:</strong> Whether the foreign receiving authority — such as an Italian consulate, comune, or court — will accept a RON-notarized document is not determined by Florida law. Many foreign institutions require in-person, wet-ink notarization and do not recognize or accept RON documents even if apostilled.</p>
          <p>Before using a RON document for international purposes, the receiving authority&apos;s specific acceptance of RON should be confirmed. This is a document coordination review step, not a legal determination.</p>
          <p>In practice, some Italian consulates and government bodies in Italy have rejected RON affidavits even with valid apostilles. Clients using documents for Italian citizenship, property, or family matters should inquire about receiving authority acceptance before proceeding with RON.</p>
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
