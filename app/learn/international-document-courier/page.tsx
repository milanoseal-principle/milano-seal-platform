import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "International Document Courier & Release | The Milano Seal™",
  description: "Why secure chain of custody matters for international documents and how the delivered-not-released release process works.",
  robots: { index: true, follow: true },
};

export default function InternationalCourierPage() {
  return (
    <>
      <div style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(198,165,90,0.7)", marginBottom: 16 }}>
        / THE MILANO SEAL™ GUIDE /
      </div>
      <h1 style={{ fontSize: 32, fontWeight: 400, fontFamily: "var(--font-playfair, Georgia, serif)", color: "#F6F1E6", margin: "0 0 32px", lineHeight: 1.3 }}>
        International Document Courier &amp; Release
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <p style={{ fontSize: 14, color: "#F6F1E6", lineHeight: 1.8, margin: 0 }}>
          International apostilled and notarized documents represent the culmination of a careful execution process — and how they travel from the issuing authority to the final recipient matters. Secure courier handling is not a formality: original apostilled documents, once lost or damaged in transit, may require the entire execution process to be repeated. Secure, trackable shipping with proper chain-of-custody documentation is a standard part of international document handling.
        </p>
        <p style={{ fontSize: 14, color: "#A8A29A", lineHeight: 1.8, margin: 0 }}>
          Chain of custody refers to the documented sequence of custody, control, transfer, and handling of a document from execution through delivery. For international legal documents, maintaining a clear chain of custody protects the integrity of the document and provides a record that can be referenced if the receiving authority questions the document&apos;s handling history. This is particularly relevant for documents submitted to foreign courts, consulates, or government registries.
        </p>
        <p style={{ fontSize: 14, color: "#A8A29A", lineHeight: 1.8, margin: 0 }}>
          A delivered-not-released protocol means that a document is confirmed as physically delivered to its destination before it is considered &ldquo;released&rdquo; in the matter record. This distinction matters when matters involve multiple parties, when documents are held pending payment or compliance verification, or when secure release authorization is required before the document is handed off to the recipient. Delivery confirmation and release are tracked as separate events to maintain accountability.
        </p>
        <p style={{ fontSize: 14, color: "#A8A29A", lineHeight: 1.8, margin: 0 }}>
          International courier options vary by destination country, urgency, and document sensitivity. Carriers differ in their capabilities for signature-required delivery, remote area coverage, customs handling for legal documents, and real-time tracking. The appropriate courier pathway for each matter is assessed during intake and execution planning, with the goal of ensuring the document arrives at the correct destination, in the hands of the intended recipient, with the condition and custody record intact.
        </p>
      </div>

      <div style={{ marginTop: 48, padding: "20px 24px", background: "rgba(198,165,90,0.06)", border: "1px solid rgba(198,165,90,0.2)", borderRadius: 8 }}>
        <p style={{ fontSize: 13, color: "#F6F1E6", margin: "0 0 12px" }}>Ready to apostille your documents? Start your matter.</p>
        <Link href="/intake" style={{ display: "inline-flex", alignItems: "center", padding: "10px 20px", background: "rgba(198,165,90,0.1)", border: "1px solid rgba(198,165,90,0.4)", borderRadius: 5, color: "#C6A55A", fontSize: 12, fontFamily: "monospace", letterSpacing: "0.1em", textDecoration: "none" }}>
          START YOUR MATTER →
        </Link>
      </div>
      <p style={{ fontSize: 11, color: "#5A5550", marginTop: 32, lineHeight: 1.6, fontFamily: "monospace" }}>
        This guide is for informational purposes only and does not constitute legal advice.
      </p>
    </>
  );
}
