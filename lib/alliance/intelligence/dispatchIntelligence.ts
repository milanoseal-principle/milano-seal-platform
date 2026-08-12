import type { TrustNetworkPartnerProfile } from "./trustNetworkRegistry";

export interface DispatchReadinessResult {
  partnerId: string;
  score: number;
  status: "Not Ready" | "Review" | "Dispatch Ready";
  blockers: string[];
}

export function scoreDispatchReadiness(profile: TrustNetworkPartnerProfile): DispatchReadinessResult {
  const signals = new Set(profile.readinessSignals);
  const blockers = [
    !signals.has("identity") ? "identity verification" : "",
    !signals.has("commission") ? "commission verification" : "",
    !signals.has("insurance") ? "insurance verification" : "",
    !signals.has("availability") ? "availability confirmation" : "",
  ].filter(Boolean);
  const score = Math.min(100, profile.trustScore + (signals.has("qa") ? 5 : 0) + (signals.has("international") ? 5 : 0));
  const status = blockers.length > 0 ? "Not Ready" : score >= 80 ? "Dispatch Ready" : "Review";
  return { partnerId: profile.id, score, status, blockers };
}
