import React from "react";
import type { TranslationGuidanceEntry } from "@/lib/atlas/translationGuidance";

interface Props {
  entry: TranslationGuidanceEntry;
}

export function TranslationGuidanceCard({ entry }: Props) {
  return (
    <div style={{
      background: "rgba(12,12,18,0.96)",
      border: "1px solid rgba(212,175,55,0.18)",
      borderRadius: 8,
      padding: "20px 24px",
    }}>
      <div style={{
        fontSize: 10,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "rgba(212,175,55,0.7)",
        marginBottom: 8,
      }}>
        Translation Review
      </div>
      <div style={{
        fontFamily: "var(--font-playfair, Georgia), serif",
        fontSize: 16,
        fontWeight: 600,
        color: "#fff",
        marginBottom: 10,
      }}>
        {entry.language}-Language Guidance
      </div>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.65, margin: "0 0 16px" }}>
        {entry.guidance}
      </p>
      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 16px" }}>
        International documents may require translation review depending on destination country, receiving authority, document type, and language of origin. The Milano Seal flags translation-sensitive matters for operator review before execution or release.
      </p>
      <a
        href="/intake"
        style={{
          display: "inline-block",
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#C6A55A",
          textDecoration: "none",
          borderBottom: "1px solid rgba(198,165,90,0.35)",
          paddingBottom: 2,
        }}
      >
        Request Routing Review →
      </a>
    </div>
  );
}
