import { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = {
  title: "FBI Background Check Apostille | The Milano Seal™",
  description: "An FBI background check is a federal document. It requires a U.S. Department of State apostille — not a Florida SOS apostille. Learn the process and timeline.",
  alternates: { canonical: "https://www.themilanoseal.com/learn/fbi-background-check-apostille" },
  openGraph: { title: "FBI Background Check Apostille", description: "FBI background checks require a federal apostille from the U.S. Department of State, not a state-level apostille.", images: [{ url: "https://www.themilanoseal.com/og-image.png", width: 1200, height: 630 }] },
};
const DISCLAIMER = "The Milano Seal provides document coordination, notarization, apostille/authentication routing review, courier custody, and release support. International use remains subject to destination-country and receiving-authority requirements. This service does not provide legal guidance.";
export default function Page() {
  return (
    <div className="min-h-screen" style={{ background: "#060402" }}>
      <div className="max-w-2xl mx-auto px-6 py-16">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase mb-3" style={{ color: "rgba(212,175,55,0.5)" }}><Link href="/learn" style={{ color: "inherit" }}>Education</Link> · FBI Apostille</p>
        <h1 className="font-serif text-3xl text-white tracking-wide mb-6">FBI Background Check Apostille</h1>
        <div className="space-y-5 text-base" style={{ color: "rgba(245,241,232,0.78)", lineHeight: "1.75" }}>
          <p>An FBI Identity History Summary (commonly called an FBI background check) is issued by a federal agency. Because it originates at the federal level — not the state level — it cannot receive a state-issued apostille such as a Florida Department of State apostille.</p>
          <p><strong style={{ color: "rgba(255,255,255,0.9)" }}>The correct apostille authority:</strong> FBI background checks must be apostilled by the U.S. Department of State, Office of Authentications in Washington, D.C. This is the only competent authority for federal documents.</p>
          <p><strong style={{ color: "rgba(255,255,255,0.9)" }}>Process overview:</strong> First, obtain the FBI Identity History Summary through the FBI&apos;s official channel or a channeler. Once received, the document is submitted to the U.S. Department of State for apostille. Processing times vary — standard service can take several weeks; expedited options may be available through authorized couriers.</p>
          <p><strong style={{ color: "rgba(255,255,255,0.9)" }}>Translation:</strong> Many destination countries (including Italy) require a certified translation of the background check in addition to the apostille. Translation requirements should be confirmed with the receiving authority.</p>
          <p>Common use cases include Italian citizenship by descent applications, immigration to EU countries, work visas, and property transactions abroad.</p>
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
