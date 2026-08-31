import { RON_STATE_REGISTRY } from "./ronStateRegistry";
import { assessRonPartner } from "./ronPartnerVerification";
import type { RonCoverageSummary, RonPartnerRecord } from "./types";

export function summarizeRonCoverage(partners: RonPartnerRecord[]): RonCoverageSummary {
  const statesWithApplicants = new Set(
    partners.map((partner) => partner.stateCommissioned.trim().toLowerCase()).filter(Boolean),
  );

  const ronReady = partners.filter((partner) => {
    const assessment = assessRonPartner(partner);
    return assessment.level === "RON_READY" || assessment.level === "EXECUTION_PARTNER" || assessment.level === "PRIORITY_DISPATCH_PARTNER";
  });

  const readyStates = new Set(
    ronReady.map((partner) => partner.stateCommissioned.trim().toLowerCase()).filter(Boolean),
  );

  return {
    targetStates: RON_STATE_REGISTRY.length,
    statesWithApplicants: statesWithApplicants.size,
    statesWithRonReadyPartners: readyStates.size,
    totalApplicants: partners.length,
    ronReadyPartners: ronReady.length,
    mobileFallbackPartners: partners.filter((partner) => partner.mobileAvailable).length,
    priorityDispatchPartners: partners.filter(
      (partner) => assessRonPartner(partner).level === "PRIORITY_DISPATCH_PARTNER",
    ).length,
  };
}
