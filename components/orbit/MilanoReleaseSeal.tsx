"use client";

import { MilanoSealOrbitCore } from "./MilanoSealOrbitCore";

interface MilanoReleaseSealProps {
  // New spec props
  verificationId?: string;
  isReleased?: boolean;
  // Legacy props
  matterId?: string;
  matterRef?: string;
  onConfirm?: () => void;
}

export function MilanoReleaseSeal({
  verificationId,
  isReleased = false,
  matterRef,
  onConfirm,
}: MilanoReleaseSealProps) {
  return (
    <section className="milano-release-seal">
      <MilanoSealOrbitCore
        mode="release"
        state={isReleased ? "released" : "verified"}
        size="lg"
        showRouteArcs={false}
        showNodes={isReleased}
        label="Milano Seal release certificate seal"
      />
      <div>
        <p className="orbit-eyebrow">/ SEAL OF RECORD /</p>
        <h3 style={{ fontFamily: "var(--font-serif, Georgia, serif)", color: "#F6F1E6", fontSize: "clamp(22px,3vw,36px)", fontWeight: 500, margin: "6px 0" }}>
          {isReleased ? "Paid & Released" : "Release Review"}
        </h3>
        <p style={{ color: "#A8A29A", maxWidth: 400, fontSize: 13, margin: "0 0 12px" }}>
          {isReleased
            ? "This matter has been sealed with a custody verification record."
            : "Complete release review before final certificate generation."}
        </p>
        {(verificationId ?? matterRef) && (
          <code style={{ fontSize: 11, color: "#C6A55A", letterSpacing: "0.1em", background: "rgba(198,165,90,0.08)", padding: "4px 10px", borderRadius: 4 }}>
            {verificationId ?? matterRef}
          </code>
        )}
        {!isReleased && onConfirm && (
          <button
            onClick={onConfirm}
            style={{
              display: "block",
              marginTop: 16,
              padding: "9px 22px",
              background: "transparent",
              border: "1px solid #C6A55A",
              borderRadius: 3,
              color: "#C6A55A",
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Initiate Release
          </button>
        )}
      </div>
    </section>
  );
}
