export const allianceDashboardModules = [
  "referralSubmit",
  "referralStatus",
  "onboardingStatus",
  "toolbeltChecklist",
  "complianceReadiness",
  "partnerResources",
  "approvedScripts",
  "trainingLinks",
  "referralPayoutStatus",
] as const;

export type AllianceDashboardModule = typeof allianceDashboardModules[number];
