export const GOOGLE_BUSINESS_REVIEW_URL =
  process.env.NEXT_PUBLIC_GBP_REVIEW_URL ??
  "https://www.google.com/search?q=The%20Milano%20Seal";

export function buildReviewCopy(context: {
  lane?: string;
  country?: string;
  documentType?: string;
}): string {
  const { lane, country, documentType } = context;

  if (lane && country && documentType) {
    return `The Milano Seal helped coordinate my ${documentType} for ${country} through the ${lane} path. Communication was clear, secure, and professional.`;
  }
  if (lane && country) {
    return `The Milano Seal coordinated my document execution for ${country} through the ${lane} path. The process was smooth, secure, and professionally handled.`;
  }
  if (country) {
    return `The Milano Seal coordinated my international document matter for ${country} with clear communication, secure handling, and professional execution.`;
  }
  if (lane) {
    return `The Milano Seal handled my document matter through the ${lane} path. Communication was clear, the process was secure, and the team was professional throughout.`;
  }

  return "The Milano Seal helped coordinate my international document matter with clear communication, secure handling, and professional execution.";
}

export function buildReviewEventMeta(params: {
  rating?: number;
  feedback?: string;
  executionLane?: string;
  destinationCountry?: string;
  documentType?: string;
  source?: string;
}): Record<string, unknown> {
  return {
    module: "GBP_REVIEW_CAPTURE",
    rating: params.rating ?? null,
    feedback: params.feedback ?? null,
    executionLane: params.executionLane ?? null,
    destinationCountry: params.destinationCountry ?? null,
    documentType: params.documentType ?? null,
    source: params.source ?? "portal_review_prompt",
    googleReviewUrlConfigured: Boolean(process.env.NEXT_PUBLIC_GBP_REVIEW_URL),
  };
}

const COMPLETED_STATUSES = new Set([
  "completed",
  "released",
  "delivered",
]);

export function shouldShowReviewPrompt(deal: Record<string, unknown>): boolean {
  if (
    deal.status === "completed" ||
    deal.deal_status === "completed" ||
    deal.release_status === "released" ||
    deal.delivery_status === "delivered" ||
    deal.is_paid_and_released === true
  ) {
    return true;
  }

  const blockedStatuses = new Set([
    "new",
    "reviewing",
    "quoted",
    "awaiting_payment",
    "scheduled",
    "in_execution",
    "apostille",
    "shipped",
  ]);

  const anyStatus = [deal.status, deal.deal_status, deal.delivery_status]
    .filter(Boolean)
    .map(String);

  // If any status is blocked, do not show
  for (const s of anyStatus) {
    if (blockedStatuses.has(s)) return false;
  }

  return false;
}
