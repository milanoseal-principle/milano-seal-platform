// Source-backed authority processing advisory and estimated timeline.
// No processing time is hardcoded: advisories come only from recorded,
// expiring observations. The output is an ESTIMATE — never a guaranteed
// completion date, and no absolute calendar date is ever emitted.

import { isOfficialGovernmentSource } from "./stateAuthorityProvenance";

export const ESTIMATE_NOTICE = "Estimate — not guaranteed.";

export type ObservationConfidence = "VERIFIED_SOURCE" | "OPERATOR_CONFIRMED" | "OBSERVED" | "LOW_CONFIDENCE";
export type AdvisoryStatus = "CURRENT" | "LOW_CONFIDENCE" | "STALE" | "NONE";

export interface ProcessingObservation {
  id: string;
  authority_id: string;
  service_type: string;
  source_url: string | null;
  source_title: string | null;
  source_date: string | null;
  observed_processing_date: string | null;
  estimated_days: number | null;
  observation_method: string;
  confidence: ObservationConfidence;
  observed_at: string;
  expires_at: string;
  operator_override: boolean;
  override_reason: string | null;
  verified_by: string | null;
}

export interface ProcessingAdvisory {
  status: AdvisoryStatus;
  reviewRequired: boolean;
  estimatedDays: number | null;
  confidence: ObservationConfidence | null;
  officialSource: string | null;
  sourceTitle: string | null;
  observedProcessingDate: string | null;
  observedAt: string | null;
  lastVerified: string | null;
  expiresAt: string | null;
  observationId: string | null;
  reasons: string[];
  notice: typeof ESTIMATE_NOTICE;
}

const CONFIDENCE_RANK: Record<ObservationConfidence, number> = {
  VERIFIED_SOURCE: 4,
  OPERATOR_CONFIRMED: 3,
  OBSERVED: 2,
  LOW_CONFIDENCE: 1,
};

const time = (value: string | null | undefined) => {
  const parsed = value ? new Date(value).getTime() : NaN;
  return Number.isNaN(parsed) ? null : parsed;
};

/**
 * Effective confidence. VERIFIED_SOURCE without an official government source
 * (or source date) is downgraded; nothing is trusted upward from storage.
 */
export function effectiveConfidence(observation: Pick<ProcessingObservation, "confidence" | "source_url" | "source_date" | "verified_by">): ObservationConfidence {
  if (observation.confidence === "VERIFIED_SOURCE") {
    return isOfficialGovernmentSource(observation.source_url) && observation.source_date && observation.verified_by
      ? "VERIFIED_SOURCE"
      : "LOW_CONFIDENCE";
  }
  if (observation.confidence === "OPERATOR_CONFIRMED" && !observation.verified_by) return "LOW_CONFIDENCE";
  return observation.confidence;
}

/** Picks the best unexpired observation; expired → STALE; no official source → LOW_CONFIDENCE. */
export function evaluateProcessingAdvisory(
  observations: readonly ProcessingObservation[] | null | undefined,
  options: { serviceType?: string; now?: Date; pendingSourceReviews?: number } = {},
): ProcessingAdvisory {
  const now = (options.now ?? new Date()).getTime();
  const relevant = (observations ?? []).filter((row) => !options.serviceType || row.service_type === options.serviceType);
  const empty: ProcessingAdvisory = {
    status: "NONE",
    reviewRequired: true,
    estimatedDays: null,
    confidence: null,
    officialSource: null,
    sourceTitle: null,
    observedProcessingDate: null,
    observedAt: null,
    lastVerified: null,
    expiresAt: null,
    observationId: null,
    reasons: ["No processing observation is recorded for this authority."],
    notice: ESTIMATE_NOTICE,
  };
  if (relevant.length === 0) return empty;

  const current = relevant.filter((row) => (time(row.expires_at) ?? 0) > now && row.estimated_days !== null);
  if (current.length === 0) {
    const latest = [...relevant].sort((a, b) => (time(b.observed_at) ?? 0) - (time(a.observed_at) ?? 0))[0];
    return {
      ...empty,
      status: "STALE",
      observedAt: latest.observed_at,
      expiresAt: latest.expires_at,
      reasons: ["Every processing observation for this authority has expired; re-verify against the official source."],
    };
  }

  const best = [...current].sort(
    (a, b) =>
      CONFIDENCE_RANK[effectiveConfidence(b)] - CONFIDENCE_RANK[effectiveConfidence(a)] ||
      (time(b.observed_at) ?? 0) - (time(a.observed_at) ?? 0),
  )[0];
  const confidence = effectiveConfidence(best);
  const official = isOfficialGovernmentSource(best.source_url) ? best.source_url : null;
  const reasons: string[] = [];
  if (!official) reasons.push("No official government source backs this advisory.");
  if (confidence === "LOW_CONFIDENCE" || confidence === "OBSERVED") reasons.push(`Advisory confidence is ${confidence.replace("_", " ").toLowerCase()}.`);
  if (options.pendingSourceReviews && options.pendingSourceReviews > 0) {
    reasons.push("An official-source change is awaiting operator review.");
  }
  const lowConfidence = !official || confidence === "LOW_CONFIDENCE" || confidence === "OBSERVED";

  return {
    status: lowConfidence ? "LOW_CONFIDENCE" : "CURRENT",
    reviewRequired: lowConfidence || Boolean(options.pendingSourceReviews),
    estimatedDays: best.estimated_days,
    confidence,
    officialSource: official,
    sourceTitle: best.source_title,
    observedProcessingDate: best.observed_processing_date,
    observedAt: best.observed_at,
    lastVerified: best.verified_by ? best.observed_at : null,
    expiresAt: best.expires_at,
    observationId: best.id,
    reasons,
    notice: ESTIMATE_NOTICE,
  };
}

export interface TimelineComponent {
  label: string;
  days: number | null;
  basis: string;
}

export interface EstimatedTimeline {
  components: TimelineComponent[];
  totalEstimatedDays: number | null;
  complete: boolean;
  notice: typeof ESTIMATE_NOTICE;
}

/**
 * ESTIMATED TIMELINE: outbound carrier estimate + authority advisory + return
 * carrier estimate. Durations only — never a completion date. Unknown parts
 * leave the total unknown rather than guessing.
 */
export function composeEstimatedTimeline(input: {
  outboundCarrierDays: number | null | undefined;
  advisory: Pick<ProcessingAdvisory, "status" | "estimatedDays">;
  returnCarrierDays: number | null | undefined;
  returnRequired: boolean;
}): EstimatedTimeline {
  const advisoryDays = input.advisory.status === "CURRENT" || input.advisory.status === "LOW_CONFIDENCE" ? input.advisory.estimatedDays : null;
  const components: TimelineComponent[] = [
    { label: "Outbound carrier", days: input.outboundCarrierDays ?? null, basis: "Selected carrier rate estimate" },
    { label: "Authority processing", days: advisoryDays ?? null, basis: `Authority advisory (${input.advisory.status.toLowerCase().replace("_", " ")})` },
  ];
  if (input.returnRequired) {
    components.push({ label: "Return carrier", days: input.returnCarrierDays ?? null, basis: "Selected return rate estimate" });
  }
  const complete = components.every((component) => typeof component.days === "number");
  return {
    components,
    totalEstimatedDays: complete ? components.reduce((sum, component) => sum + (component.days as number), 0) : null,
    complete,
    notice: ESTIMATE_NOTICE,
  };
}
