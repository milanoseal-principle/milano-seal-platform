// Operator-facing quote builder. INTERNAL ONLY — assembles the internal quote
// range + add-ons for operator review. Never used on public/client surfaces.

import type { SmartPricingResult } from "./types";
import { formatAnchorInternal, type MarketAnchor } from "./marketAnchors";

export interface OperatorQuoteDraft {
  lane: string;
  internalBase: number | null;
  operatorRange: [number, number] | null;
  addOns: Record<string, number | [number, number]>;
  estimatedFloor: number | null;
  manualReviewRequired: boolean;
  requiresFounderReview: boolean;
  notes: string[];
}

function addOnFloor(value: number | [number, number]): number {
  return Array.isArray(value) ? value[0] : value;
}

// Build an operator quote draft from a Smart Intake pricing result.
export function buildOperatorQuote(result: SmartPricingResult): OperatorQuoteDraft {
  const addOnTotal = Object.values(result.addOns).reduce<number>((sum, v) => sum + addOnFloor(v), 0);
  const estimatedFloor =
    result.internalBase === null ? null : result.internalBase + addOnTotal;

  return {
    lane: result.suggestedLane,
    internalBase: result.internalBase,
    operatorRange: result.operatorInternalRange,
    addOns: result.addOns,
    estimatedFloor,
    manualReviewRequired: result.manualReviewRequired,
    requiresFounderReview: result.quoteRequiresFounderReview,
    notes: result.operatorNotes ?? [],
  };
}

export function describeAnchorForOperator(label: string, anchor: MarketAnchor): string {
  return `${label}: ${formatAnchorInternal(anchor)}`;
}
