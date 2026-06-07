<<<<<<< HEAD
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Document & Apostille Guides | The Milano Seal™",
  description: "Informational guides on apostilles, notarization, international document use, and more. Published by The Milano Seal™.",
  robots: { index: true, follow: true },
};

const GUIDES = [
  {
    href: "/learn/what-is-an-apostille",
    title: "What Is an Apostille?",
    description: "Understand what an apostille is, how the Hague Convention works, and when apostille certification is required.",
  },
  {
    href: "/learn/apostille-vs-authentication",
    title: "Apostille vs. Authentication",
    description: "The difference between Hague apostille and consular legalization, and when to use each.",
  },
  {
    href: "/learn/can-ron-documents-be-apostilled",
    title: "Can a Remote Online Notarization Be Apostilled?",
    description: "RON compatibility with apostille requirements, Florida law, and destination-country considerations.",
  },
  {
    href: "/learn/fbi-background-check-apostille",
    title: "FBI Background Check Apostille",
    description: "How to apostille an FBI Identity History Summary — federal vs. state apostille, and common uses abroad.",
  },
  {
    href: "/learn/power-of-attorney-abroad",
    title: "Power of Attorney for Use Abroad",
    description: "Notarized POA requirements, apostille for international use, and common cross-border scenarios.",
  },
  {
    href: "/learn/italy-citizenship-affidavit",
    title: "Italy Citizenship Affidavit & Document Apostille",
    description: "Jure Sanguinis document requirements, apostille for the Italian Consulate, and translation considerations.",
  },
  {
    href: "/learn/international-document-courier",
    title: "International Document Courier & Release",
    description: "Why secure chain of custody matters for international documents and how our release process works.",
  },
  {
    href: "/learn/hague-vs-non-hague-countries",
    title: "Hague vs. Non-Hague Countries",
    description: "What the Hague Convention is, apostille for member countries, and legalization for non-member countries.",
  },
];

export default function LearnIndexPage() {
  return (
    <div style={{ background: "#060608", minHeight: "100vh" }}>
      <div style={{ maxWidth: 768, margin: "0 auto", padding: "64px 24px 80px" }}>
        <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(198,165,90,0.7)", marginBottom: 16 }}>
          / THE MILANO SEAL™ GUIDES /
        </div>
        <h1 style={{
          fontSize: 36, fontWeight: 400,
          fontFamily: "var(--font-playfair, Georgia, serif)",
          color: "#F6F1E6", margin: "0 0 16px",
        }}>
          Document &amp; Apostille Guides
        </h1>
        <p style={{ fontSize: 14, color: "#A8A29A", lineHeight: 1.7, marginBottom: 48, maxWidth: 560 }}>
          Informational resources on apostilles, notarization, and international document use. Published by The Milano Seal™ for reference only — not legal advice.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {GUIDES.map((g) => (
            <Link
              key={g.href}
              href={g.href}
              style={{
                display: "block", padding: "20px 24px",
                background: "#0d0d0d",
                border: "1px solid rgba(198,165,90,0.12)",
                borderRadius: 8, textDecoration: "none",
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 500, color: "#F6F1E6", marginBottom: 6 }}>
                {g.title}
              </div>
              <div style={{ fontSize: 13, color: "#A8A29A", lineHeight: 1.6 }}>
                {g.description}
              </div>
            </Link>
          ))}
        </div>

        <p style={{ fontSize: 11, color: "#5A5550", marginTop: 48, lineHeight: 1.6, fontFamily: "monospace" }}>
          These guides are for informational purposes only and do not constitute legal advice. Consult a qualified professional for guidance specific to your situation.
        </p>
=======
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
>>>>>>> claude/funny-maxwell-hlxQN
      </div>
    </div>
  );
}
