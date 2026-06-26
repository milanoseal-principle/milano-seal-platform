export const operatorDashboardModules = [
  "kpiCards",
  "intakeQueue",
  "matterPipeline",
  "paymentLedger",
  "wiseStatus",
  "executionQueue",
  "apostilleTracker",
  "custodyTracker",
  "operationalLedger",
  "clientRegistry",
  "internalNotes",
  "manualOverrides",
  "matterAssignments",
] as const;

export type OperatorDashboardModule = typeof operatorDashboardModules[number];
