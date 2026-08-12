import type { MatterReadiness } from "./types";

export function calculateReleaseVisibility(readiness: Omit<MatterReadiness, "releaseEligible">): MatterReadiness {
  return {
    ...readiness,
    releaseEligible: readiness.paymentConfirmed && readiness.qaComplete && readiness.executionComplete && readiness.blockers.length === 0,
  };
}
