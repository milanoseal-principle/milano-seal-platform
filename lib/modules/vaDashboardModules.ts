export const vaDashboardModules = [
  "assignedTasks",
  "matterPrepChecklist",
  "documentReadiness",
  "apostillePacketChecklist",
  "courierLabelChecklist",
  "followUpTemplates",
  "uploadStatus",
  "qaFlags",
  "taskCompletion",
] as const;

export type VADashboardModule = typeof vaDashboardModules[number];
