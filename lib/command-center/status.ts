// Command Center — canonical status/dropdown constants (internal).

export const MASTER_STATUS = [
  "Not Started",
  "Contacted",
  "Intake Received",
  "Quoted",
  "Awaiting Payment",
  "Paid",
  "Scheduled",
  "In Execution",
  "Apostille Processing",
  "Completed",
  "Closed",
] as const;

export const REVENUE_STATUS = ["Planned", "Quoted", "Collected", "Partial", "Closed"] as const;
export const EXECUTION_TYPE = ["RON", "Mobile", "Apostille Only", "Full Service"] as const;
export const LANE_TYPE = ["Signature", "Priority", "Executive"] as const;
export const APOSTILLE_STATUS = ["Not Started", "Sent to State", "Processing", "Completed", "Returned", "Delivered"] as const;
export const DELAY_RISK = ["Low", "Medium", "High"] as const;
export const REVIEW_PLATFORM = ["Google", "LinkedIn", "Facebook", "Other"] as const;

export type MasterStatus = (typeof MASTER_STATUS)[number];
export type RevenueStatus = (typeof REVENUE_STATUS)[number];
export type ExecutionType = (typeof EXECUTION_TYPE)[number];
export type LaneType = (typeof LANE_TYPE)[number];
export type ApostilleStatus = (typeof APOSTILLE_STATUS)[number];
export type DelayRisk = (typeof DELAY_RISK)[number];
export type ReviewPlatform = (typeof REVIEW_PLATFORM)[number];
