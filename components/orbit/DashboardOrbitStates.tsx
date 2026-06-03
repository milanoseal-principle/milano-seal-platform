"use client";

import { MilanoSealOrbitCore } from "./MilanoSealOrbitCore";
import { OrbitState, ORBIT_STATE_MAP } from "@/lib/orbit/orbitStateMap";

interface DashboardOrbitStatesProps {
  currentState: OrbitState;
  matterRef?: string;
}

const STATE_ORDER: OrbitState[] = [
  "intake_received",
  "under_review",
  "awaiting_payment",
  "scheduled",
  "in_execution",
  "apostille_processing",
  "in_transit",
  "delivered",
  "completed",
];

export function DashboardOrbitStates({ currentState, matterRef }: DashboardOrbitStatesProps) {
  const currentIndex = STATE_ORDER.indexOf(currentState);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {matterRef && (
        <div
          style={{
            fontSize: 10,
            letterSpacing: "0.2em",
            color: "rgba(198,165,90,0.5)",
            textTransform: "uppercase",
          }}
        >
          {matterRef}
        </div>
      )}

      <MilanoSealOrbitCore
        state={currentState}
        mode="dashboard"
        size={120}
        showLabel={true}
        crestSrc="/milano-seal-crest-canonical.png"
      />

      {/* progress track */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", maxWidth: 280 }}>
        {STATE_ORDER.map((s, i) => {
          const cfg = ORBIT_STATE_MAP[s];
          const past = i < currentIndex;
          const active = i === currentIndex;
          return (
            <div
              key={s}
              title={cfg.label}
              style={{
                width: 20,
                height: 4,
                borderRadius: 2,
                background: active
                  ? cfg.color
                  : past
                  ? "rgba(198,165,90,0.35)"
                  : "rgba(198,165,90,0.1)",
                transition: "background 0.4s",
              }}
            />
          );
        })}
      </div>

      <div
        style={{
          fontSize: 9.5,
          color: "rgba(198,165,90,0.4)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        Step {currentIndex + 1} of {STATE_ORDER.length}
      </div>
    </div>
  );
}
