import type { ExecutionHeatmapRegion, ExecutionHeatmapSignal } from "./types";

export function buildExecutionHeatmap(regions: readonly ExecutionHeatmapRegion[] = []) { return regions.map((region) => ({ ...region, opportunityScore: getRegionOpportunityScore(region) })); }
export function getExecutionHeatmapSignals(): readonly ExecutionHeatmapSignal[] { return ["low", "medium", "high", "unknown"]; }
export function getRegionOpportunityScore(region: ExecutionHeatmapRegion) { if (region.sourceStatus === "not_connected" || region.demandSignal === "unknown") return 0; return Math.max(0, Math.min(100, region.opportunityScore)); }
export function getHeatmapEmptyState() { return "No heatmap metrics connected. Regions remain manual or staged until verified data is connected."; }
