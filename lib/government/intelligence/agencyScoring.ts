import type { AgencyProfile } from "./agencyRegistry";

export interface AgencyScoreBreakdown { relationship: number; fit: number; timing: number; readiness: number; total: number; recommendation: string; }

export function scoreAgency(agency: AgencyProfile): AgencyScoreBreakdown {
  const fit = agency.naicsUsed.length * 6 + agency.knownPainPoints.length * 4;
  const timing = agency.renewalCycle.toLowerCase().includes("monitor") ? 12 : 6;
  const readiness = agency.procurementPortal ? 16 : 8;
  const relationship = agency.relationshipScore;
  const total = Math.min(100, relationship + fit + timing + readiness);
  return { relationship, fit, timing, readiness, total, recommendation: total >= 70 ? "relationship-ready" : total >= 45 ? "registration-and-research" : "research-first" };
}
