"use client";

import { MilanoOrbitSegment, MilanoSealOrbitCore } from "./MilanoSealOrbitCore";
import { getDashboardOrbitState } from "@/lib/orbit/orbitStateMap";

// Legacy props — pipeline state per matter
interface LegacyProps {
  currentState: string;
  matterRef?: string;
}

// System health props — dashboard-level
interface HealthProps {
  truthScore?: number | null;
  blockedMatters?: number;
  staleMatters?: number;
  releaseReady?: number;
  segments?: MilanoOrbitSegment[];
}

type DashboardOrbitStatesProps = LegacyProps | HealthProps;

function isHealthProps(p: DashboardOrbitStatesProps): p is HealthProps {
  return !("currentState" in p);
}

export function DashboardOrbitStates(props: DashboardOrbitStatesProps) {
  if (isHealthProps(props)) {
    const { truthScore, blockedMatters = 0, staleMatters = 0, releaseReady = 0, segments = [] } = props;
    const state = getDashboardOrbitState({ truthScore, blockedMatters, staleMatters, releaseReady });

    return (
      <section className="dashboard-orbit-card">
        <div>
          <p className="orbit-eyebrow">/ SYSTEM SEAL /</p>
          <h3 style={{ fontFamily: "var(--font-serif, Georgia, serif)", color: "#F6F1E6", fontSize: "clamp(24px,3vw,40px)", fontWeight: 500, margin: "6px 0" }}>
            Execution Orbit
          </h3>
          <p style={{ color: "#A8A29A", maxWidth: 420, fontSize: 13, margin: 0 }}>
            Live operational crest state — motion reflects real platform conditions only.
          </p>
        </div>
        <MilanoSealOrbitCore
          mode="dashboard"
          state={state}
          size="lg"
          showDataSegments={segments.length > 0}
          segments={segments}
          label="Dashboard execution orbit"
        />
        <div className="dashboard-orbit-meta">
          <span>Truth Score</span>
          <strong>{typeof truthScore === "number" ? `${truthScore}%` : "No data"}</strong>
        </div>
      </section>
    );
  }

  // Legacy: pipeline state per active matter
  const { currentState, matterRef } = props;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      {matterRef && (
        <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "rgba(198,165,90,0.5)", textTransform: "uppercase" }}>
          {matterRef}
        </div>
      )}
      <MilanoSealOrbitCore
        state={currentState as never}
        mode="dashboard"
        size="md"
        label={`Matter status: ${currentState}`}
      />
    </div>
  );
}
