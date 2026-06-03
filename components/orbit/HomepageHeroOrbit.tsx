"use client";

import { MilanoSealOrbitCore } from "./MilanoSealOrbitCore";

export function HomepageHeroOrbit() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
        padding: "48px 0",
      }}
    >
      <MilanoSealOrbitCore
        state="idle"
        mode="hero"
        size={220}
        showLabel={false}
        crestSrc="/milano-seal-crest-canonical.png"
      />
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "#C6A55A",
          }}
        >
          The Milano Seal™
        </div>
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(198,165,90,0.5)",
            marginTop: 4,
          }}
        >
          Sealing Trust in Every Signature
        </div>
      </div>
    </div>
  );
}
