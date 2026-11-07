import {
  CONCIERGE_SERVICE_INTENTS,
  type ConciergeServiceIntent,
} from "@/lib/acquisition/concierge-service-intents";

// Centralized, governed commercial-CTA routing for public service surfaces.
// Every GET PRICING action converges on the P1 governed pricing flow
// (/pricing#get-pricing), every SPEAK WITH NICHOLAS on the governed concierge
// (/speak-with-nicholas), every BEGIN MATTER REVIEW on the canonical intake.
// Context (service intent, destination, origin, document type, audience,
// source) is preserved into the downstream flow as NON-AUTHORITATIVE
// preferences — it never establishes a confirmed route, tier, price, legal
// sufficiency, payment, or scheduling eligibility. No internal price and no
// discount code is ever encoded here.

export type CommercialServiceIntent = ConciergeServiceIntent;

// Map the P2 commercial segmentation (and common page vocabulary) onto the
// EXISTING canonical concierge service-intent enum rather than inventing new
// truth. Anything unknown resolves to "unsure" (review my document).
const INTENT_ALIASES: Record<string, ConciergeServiceIntent> = {
  ron: "ron",
  remote_online_notarization: "ron",
  remote_online_notary: "ron",
  online_notarization: "ron",
  domestic_notary: "domestic_execution",
  domestic_execution: "domestic_execution",
  mobile_notary: "domestic_execution",
  notary: "domestic_execution",
  apostille: "apostille",
  authentication: "authentication",
  international_authentication: "authentication",
  legalization: "authentication",
  consular_legalization: "authentication",
  international_execution: "international_execution",
  professional_counsel: "foreign_counsel",
  foreign_counsel: "foreign_counsel",
  counsel: "foreign_counsel",
  unsure: "unsure",
  "": "unsure",
};

export function normalizeServiceIntent(value?: string | null): ConciergeServiceIntent {
  if (!value) return "unsure";
  const key = value.trim().toLowerCase().replace(/-/g, "_");
  if ((CONCIERGE_SERVICE_INTENTS as readonly string[]).includes(key)) {
    return key as ConciergeServiceIntent;
  }
  return INTENT_ALIASES[key] ?? "unsure";
}

export interface CommercialContext {
  serviceIntent?: string;
  destination?: string;
  origin?: string;
  documentType?: string;
  audience?: "individual" | "professional";
  source?: string;
}

export type CommercialAction = "get_pricing" | "speak" | "intake" | "counsel";

function governedQuery(ctx: CommercialContext): string {
  const params = new URLSearchParams();
  params.set("service_intent", normalizeServiceIntent(ctx.serviceIntent));
  if (ctx.destination) params.set("destination", ctx.destination);
  if (ctx.audience) params.set("audience", ctx.audience);
  if (ctx.source) params.set("source", ctx.source);
  const s = params.toString();
  return s ? `?${s}` : "";
}

// Builds the canonical destination for a governed commercial action, carrying
// safe context forward. The returned href is always one of the existing
// governed surfaces — it can never create a Matter, payment, or schedule.
export function commercialHref(action: CommercialAction, ctx: CommercialContext = {}): string {
  switch (action) {
    case "get_pricing":
      return `/pricing${governedQuery(ctx)}#get-pricing`;
    case "speak":
      return `/speak-with-nicholas${governedQuery(ctx)}`;
    case "counsel":
      return `/counsel${governedQuery({ ...ctx, audience: "professional" })}`;
    case "intake":
    default: {
      const params = new URLSearchParams();
      if (ctx.source) params.set("source", ctx.source);
      if (ctx.destination) {
        params.set("destination", ctx.destination);
        params.set("country", ctx.destination);
      }
      if (ctx.origin) params.set("origin", ctx.origin);
      if (ctx.documentType) params.set("document_type", ctx.documentType);
      const intent = normalizeServiceIntent(ctx.serviceIntent);
      if (intent !== "unsure") params.set("service_intent", intent);
      const s = params.toString();
      return `/intake${s ? `?${s}` : ""}`;
    }
  }
}

export const COMMERCIAL_CTA_LABELS: Record<CommercialAction, string> = {
  get_pricing: "Get Pricing",
  speak: "Speak With Nicholas",
  intake: "Begin Matter Review",
  counsel: "For International Counsel",
};

// Shown with every governed CTA row so a visitor is never misled into thinking
// a click or a pricing request confirms a route, price, payment, or Matter.
export const COMMERCIAL_CTA_DISCLOSURE =
  "Requesting pricing or review does not create a Matter, appointment, or payment. The Milano Seal coordinates U.S. document execution and is not a law firm; your route and private quote are confirmed after review.";
