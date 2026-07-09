import type {
  ProcurementOpportunity,
  ProcurementOpportunityType,
} from "./types";

// Pure reducers/helpers over ProcurementOpportunity[]. No side effects.

const OPEN_TYPES: ProcurementOpportunityType[] = [
  "open_bid",
  "quote",
  "rfp",
  "rfq",
  "itb",
  "pre_bid_meeting",
];

export function classifyOpportunity(
  opp: ProcurementOpportunity,
): "open" | "renewal" | "closed" {
  if (opp.stage === "awarded" || opp.stage === "lost") return "closed";
  if (opp.type === "renewal" || opp.stage === "renewal") return "renewal";
  if (OPEN_TYPES.includes(opp.type)) return "open";
  return "closed";
}

export function filterOpenOpportunities(
  opps: ProcurementOpportunity[],
): ProcurementOpportunity[] {
  return opps.filter((o) => classifyOpportunity(o) === "open");
}

export function summarizePipelineValue(opps: ProcurementOpportunity[]): number {
  return opps.reduce((sum, o) => sum + (Number.isFinite(o.value) ? o.value : 0), 0);
}

export function summarizeOpenPipelineValue(
  opps: ProcurementOpportunity[],
): number {
  return summarizePipelineValue(filterOpenOpportunities(opps));
}
