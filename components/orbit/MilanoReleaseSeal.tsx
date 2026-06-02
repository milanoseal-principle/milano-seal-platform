"use client";

import { useEffect, useState } from "react";

interface MilanoReleaseSealProps {
  matterId: string;
  matterRef: string;
  onConfirm?: () => void;
}

export function MilanoReleaseSeal({ matterId, matterRef, onConfirm }: MilanoReleaseSealProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setPulse((p) => !p), 2000);
    return () => clearInterval(t);
  }, []);

  const handleRelease = () => {
    setConfirmed(true);
    onConfirm?.();
  };

  if (confirmed) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          padding: "20px",
          border: "1px solid rgba(63,164,122,0.4)",
          borderRadius: 4,
          background: "rgba(63,164,122,0.06)",
        }}
      >
        <div style={{ fontSize: 24, color: "#3FA47A" }}>✓</div>
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#3FA47A",
            fontWeight: 600,
          }}
        >
          Release Initiated
        </div>
        <div style={{ fontSize: 10, color: "rgba(63,164,122,0.6)" }}>{matterRef}</div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        padding: "20px",
        border: `1px solid ${pulse ? "rgba(198,165,90,0.6)" : "rgba(198,165,90,0.25)"}`,
        borderRadius: 4,
        background: "rgba(8,5,1,0.97)",
        transition: "border-color 1s",
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "rgba(198,165,90,0.6)",
        }}
      >
        Release Review
      </div>
      <div style={{ fontSize: 11, color: "rgba(198,165,90,0.8)", fontWeight: 600 }}>{matterRef}</div>
      <div style={{ fontSize: 10, color: "rgba(198,165,90,0.4)", textAlign: "center", maxWidth: 200 }}>
        Operator action only. Requires payment confirmation before release.
      </div>
      <button
        onClick={handleRelease}
        style={{
          marginTop: 4,
          padding: "8px 20px",
          background: "transparent",
          border: "1px solid #C6A55A",
          borderRadius: 2,
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
    </div>
  );
}
