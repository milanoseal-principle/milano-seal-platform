export const clientPortalModules = [
  "matterTimeline",
  "invoiceStatus",
  "documentVault",
  "tracking",
  "nextSteps",
  "messages",
  "paidReleased",
] as const;

export type ClientPortalModule = typeof clientPortalModules[number];
