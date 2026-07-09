export const PROCUREMENT_LIFECYCLE = ["Research", "Watch", "Vendor Registration", "Capability Sent", "Relationship", "Pre-Solicitation", "Solicitation Open", "Bid Draft", "Submitted", "Evaluation", "Award", "Contract", "Renewal", "Archive"] as const;
export type ProcurementLifecycleStage = (typeof PROCUREMENT_LIFECYCLE)[number];

export function nextLifecycleStage(stage: ProcurementLifecycleStage): ProcurementLifecycleStage {
  const index = PROCUREMENT_LIFECYCLE.indexOf(stage);
  return PROCUREMENT_LIFECYCLE[Math.min(index + 1, PROCUREMENT_LIFECYCLE.length - 1)];
}

export function isActiveProcurementStage(stage: ProcurementLifecycleStage): boolean {
  return !["Archive", "Award", "Contract"].includes(stage);
}
