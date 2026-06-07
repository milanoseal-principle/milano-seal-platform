"use client";

import { MilanoSealOrbitCore } from "./MilanoSealOrbitCore";
import { getPortalOrbitState } from "@/lib/orbit/orbitStateMap";

interface PortalTrustOrbitProps {
  // New interaction-state props
  matterStatus?: string;
  isPaidAndReleased?: boolean;
  hasCourierActivity?: boolean;
  hasIssue?: boolean;
  // Legacy pipeline state prop
  state?: string;
  clientName?: string;
}

export function PortalTrustOrbit({
  matterStatus,
  isPaidAndReleased = false,
  hasCourierActivity = false,
  hasIssue = false,
  state,
  clientName,
}: PortalTrustOrbitProps) {
  const interactionState = state
    ? (state as never)
    : getPortalOrbitState({ status: matterStatus, isPaidAndReleased, hasCourierActivity, hasIssue });

  return (
    <section className="portal-trust-orbit">
      <MilanoSealOrbitCore
        mode="portal"
        state={interactionState}
        size="md"
        showRouteArcs={hasCourierActivity}
        showNodes={false}
        label="Milano Seal matter trust status"
      />
      <div>
        <p className="orbit-eyebrow">/ TRUST STATUS /</p>
        <h3 style={{ fontFamily: "var(--font-serif, Georgia, serif)", color: "#F6F1E6", fontSize: "clamp(22px,3vw,36px)", fontWeight: 500, margin: "6px 0" }}>
          {isPaidAndReleased ? "Released with Authority" : "Matter Protected"}
        </h3>
        <p style={{ color: "#A8A29A", maxWidth: 400, fontSize: 13, margin: 0 }}>
          {isPaidAndReleased
            ? "Your matter has reached final release and verification status."
            : "Your document workflow is being handled through a structured execution path."}
        </p>
        {clientName && (
          <p style={{ fontSize: 10, color: "rgba(198,165,90,0.5)", letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 8 }}>
            {clientName}
          </p>
        )}
      </div>
    </section>
  );
}
