"use client";

import { MilanoSealOrbitCore } from "./MilanoSealOrbitCore";
import { OrbitState } from "@/lib/orbit/orbitStateMap";

interface PortalTrustOrbitProps {
  state: OrbitState;
  clientName?: string;
}

export function PortalTrustOrbit({ state, clientName }: PortalTrustOrbitProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        padding: "24px 0",
      }}
    >
      <MilanoSealOrbitCore
        state={state}
        mode="portal"
        size={140}
        showLabel={true}
        crestSrc="/milano-seal-crest-canonical.png"
      />
      {clientName && (
        <div
          style={{
            fontSize: 10,
            color: "rgba(198,165,90,0.55)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          {clientName}
        </div>
      )}
    </div>
  );
}
