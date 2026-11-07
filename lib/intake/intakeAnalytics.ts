import { detectAcquisitionSource } from "@/lib/acquisition/referralCapture";

export const INTAKE_ANALYTICS_EVENTS = [
  "counsel_visit",
  "counsel_inquiry_opened",
  "counsel_inquiry_submitted",
  "counsel_submission_failed",

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
  "intent", "document_received", "inquiryReference",
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
  "acquisitionSource",
  "landingSource",
  "referrerHost",
  "utmSource",
  "utmMedium",
  "utmCampaign",
]);

export interface IntakeAnalyticsPayload {
  event: IntakeAnalyticsEvent;
  matterId?: string;
  metadata: Record<string, unknown>;
}

function capped(value: string | null, max = 120): string | undefined {
  const normalized = value?.trim().slice(0, max);
  return normalized || undefined;
}

function clientAcquisitionMetadata(): Record<string, string> {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  const landingSource = capped(params.get("source"));
  const referralSource = capped(params.get("referral_source"));
  const utmSource = capped(params.get("utm_source"));
  const utmMedium = capped(params.get("utm_medium"));
  const utmCampaign = capped(params.get("utm_campaign"));

  let referrerHost: string | undefined;
  try {
    referrerHost = document.referrer ? new URL(document.referrer).hostname.slice(0, 120) : undefined;
  } catch {
    referrerHost = undefined;
  }

  return Object.fromEntries(
    Object.entries({
      acquisitionSource: detectAcquisitionSource({
        referralSource,
        utmSource,
        referrer: referrerHost,
        landingSource,
      }),
      landingSource,
      referrerHost,
      utmSource,
      utmMedium,
      utmCampaign,
    }).filter(([, value]) => value !== undefined),
  ) as Record<string, string>;
}

export function buildIntakeAnalyticsPayload(
  event: IntakeAnalyticsEvent,
  metadata: Record<string, unknown> = {},
  matterId?: string,
): IntakeAnalyticsPayload {
  const safe: Record<string, unknown> = clientAcquisitionMetadata();
  for (const [key, value] of Object.entries(metadata)) {
    if (!SAFE_METADATA_KEYS.has(key)) continue;
    if (["string", "number", "boolean"].includes(typeof value) || value == null) {
      safe[key] = typeof value === "string" ? value.slice(0, 160) : value;
    }
  }
  return { event, matterId, metadata: safe };
}
