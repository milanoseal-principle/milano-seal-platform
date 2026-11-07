import { CONCIERGE_SERVICE_INTENTS, type ConciergeServiceIntent } from "@/lib/acquisition/concierge-service-intents";

type SearchParams = Record<string, string | string[] | undefined>;
type Audience = "individual" | "professional";
type Urgency = "routine" | "urgent" | "time_sensitive";

const ATTRIBUTION_KEYS = [
  "source",
  "medium",
  "campaign",
  "content",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
] as const;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function normalizeConciergeOriginatingPage(value?: string) {
  if (!value?.trim()) return "/speak-with-nicholas";
  try {
    const url = new URL(value.trim(), "https://www.themilanoseal.com");
    return url.origin === "https://www.themilanoseal.com"
      ? url.pathname.slice(0, 500) || "/speak-with-nicholas"
      : "/speak-with-nicholas";
  } catch {
    return "/speak-with-nicholas";
  }
}

export function resolveConciergeContext(params: SearchParams) {
  const requestedService = first(params.service_intent) ?? first(params.intent);
  const initialServiceIntent = CONCIERGE_SERVICE_INTENTS.find((intent) => intent === requestedService) as ConciergeServiceIntent | undefined;
  const requestedAudience = first(params.audience);
  const initialAudience: Audience | undefined = requestedAudience === "professional" || requestedAudience === "individual"
    ? requestedAudience
    : undefined;
  const requestedUrgency = first(params.urgency);
  const initialUrgency: Urgency | undefined = requestedUrgency === "urgent" || requestedUrgency === "time_sensitive" || requestedUrgency === "routine"
    ? requestedUrgency
    : undefined;
  const initialDestination = first(params.destination)?.trim().slice(0, 100) || undefined;
  const attribution: Record<string, string> = {};
  for (const key of ATTRIBUTION_KEYS) {
    const value = first(params[key])?.trim().slice(0, 500);
    if (value) attribution[key] = value;
  }
  attribution.originating_page = normalizeConciergeOriginatingPage(first(params.originating_page));

  return { attribution, initialServiceIntent, initialDestination, initialAudience, initialUrgency };
}