export const INTAKE_ANALYTICS_EVENTS = [
  "intake_started",
  "description_completed",
  "document_uploaded",
  "analysis_completed",
  "analysis_corrected",
  "clarification_requested",
  "clarification_completed",
  "step_1_completed",
  "step_2_completed",
  "review_viewed",
  "review_edited",
  "intake_submitted",
  "intake_abandoned",
  "intake_error",
  "upload_failed",
  "upload_retry_started",
  "upload_retry_completed",
] as const;

export type IntakeAnalyticsEvent = (typeof INTAKE_ANALYTICS_EVENTS)[number];

const SAFE_METADATA_KEYS = new Set([
  "step",
  "questionCount",
  "documentFamily",
  "destinationCountry",
  "serviceClassification",
  "pricingState",
  "manualReview",
  "uploadCount",
  "retryCount",
  "success",
  "failureCategory",
  "duration",
]);

export interface IntakeAnalyticsPayload {
  event: IntakeAnalyticsEvent;
  matterId?: string;
  metadata: Record<string, unknown>;
}

export function buildIntakeAnalyticsPayload(
  event: IntakeAnalyticsEvent,
  metadata: Record<string, unknown> = {},
  matterId?: string,
): IntakeAnalyticsPayload {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (!SAFE_METADATA_KEYS.has(key)) continue;
    if (["string", "number", "boolean"].includes(typeof value) || value == null) {
      safe[key] = value;
    }
  }
  return { event, matterId, metadata: safe };
}
