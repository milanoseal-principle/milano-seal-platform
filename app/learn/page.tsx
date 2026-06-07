import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Document Education Center | The Milano Seal™",
  description: "Learn about apostilles, authentication, RON, FBI background checks, and international document use. Educational guides from The Milano Seal™.",
  alternates: { canonical: "https://www.themilanoseal.com/learn" },
  openGraph: {
    title: "Document Education Center | The Milano Seal™",
    description: "Educational guides on apostilles, RON, international document routing, and more.",
    url: "https://www.themilanoseal.com/learn",
    images: [{ url: "https://www.themilanoseal.com/og-image.png", width: 1200, height: 630 }],
  },
};

const TOPICS = [
  { slug: "what-is-an-apostille", title: "What Is an Apostille?" },
  { slug: "apostille-vs-authentication", title: "Apostille vs. Authentication" },
  { slug: "can-a-ron-document-be-apostilled", title: "Can a RON Document Be Apostilled?" },
  { slug: "fbi-background-check-apostille", title: "FBI Background Check Apostille" },
  { slug: "power-of-attorney-for-use-abroad", title: "Power of Attorney for Use Abroad" },
  { slug: "italy-citizenship-affidavit", title: "Italy Citizenship Affidavit" },
  { slug: "international-document-courier-release", title: "International Document Courier & Release" },
  { slug: "hague-vs-non-hague-countries", title: "Hague vs. Non-Hague Countries" },
];

const DISCLAIMER = "The Milano Seal provides document coordination, notarization, apostille/authentication routing review, courier custody, and release support. International use remains subject to destination-country and receiving-authority requirements. This service does not provide legal advice.";

export default function LearnIndexPage() {
  return (
    <div className="min-h-screen" style={{ background: "#060402" }}>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase mb-3" style={{ color: "rgba(212,175,55,0.5)" }}>Education Center</p>
        <h1 className="font-serif text-3xl text-white tracking-wide mb-4">Document Intelligence Guides</h1>
        <p className="text-base mb-10 max-w-xl" style={{ color: "rgba(245,241,232,0.7)", lineHeight: "1.7" }}>
          Understand apostilles, notarization, international document routing, and more. Practical guides for attorneys, families, and global transactions.
        </p>
        <div className="space-y-3">
          {TOPICS.map(t => (
            <Link key={t.slug} href={`/learn/${t.slug}`}
              className="flex items-center justify-between px-5 py-4 rounded border group transition-colors"
              style={{ borderColor: "rgba(212,175,55,0.12)", background: "rgba(255,255,255,0.02)" }}>
              <span className="text-base font-medium" style={{ color: "rgba(255,255,255,0.82)" }}>{t.title}</span>
              <span className="font-mono text-xs" style={{ color: "rgba(212,175,55,0.5)" }}>→</span>
            </Link>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t" style={{ borderColor: "rgba(212,175,55,0.1)" }}>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)", lineHeight: "1.7" }}>{DISCLAIMER}</p>
        </div>
      </div>
    </div>
  );
}
