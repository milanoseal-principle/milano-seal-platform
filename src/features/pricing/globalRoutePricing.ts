import type { AcceptanceRoute } from "@/lib/milano-seal/global-acceptance/global-acceptance-types";
import { MILANO_PRICING } from "@/src/features/pricing/pricingEngine";

export type AuthenticationPricingStatus =
  | "priced"
  | "pending_authority_confirmation"
  | "review_required"
  | "not_required";

export interface ApprovedAuthenticationFee {
  code: string;
  label: string;
  amount: number;
  evidenceSource: string;
}

export interface AuthenticationPricingProjection {
  route: AcceptanceRoute;
  label: string;
  status: AuthenticationPricingStatus;
  items: Array<{
    code: string;
    label: string;
    amount: number | null;
    evidenceSource: string | null;
  }>;
  clientNote: string;
}

const REVIEW_ROUTES = new Set<AcceptanceRoute>([
  "ron_plus_apostille_review",
  "certified_translation_review",
  "embassy_review_required",
  "restricted_or_high_risk_review",
  "unsupported_or_refer_out",
  "unknown_needs_review",
]);

const ROUTE_LABELS: Record<AcceptanceRoute, string> = {
  hague_apostille: "Hague Apostille",
  non_hague_consular_legalization: "Consular Legalization",
  federal_authentication: "Federal Authentication",
  state_apostille: "State Apostille",
  state_authentication: "State Authentication",
  ron_plus_apostille_review: "RON + Apostille Review",
  wet_ink_notary_plus_apostille: "Wet-Ink Notary + Apostille",
  certified_translation_review: "Certified Translation Review",
  embassy_review_required: "Embassy / Consular Review",
  restricted_or_high_risk_review: "Restricted Route Review",
  unsupported_or_refer_out: "Route Review Required",
  unknown_needs_review: "Authentication Review Required",
};

function approvedItems(fees: ApprovedAuthenticationFee[]) {
  return fees
    .filter((fee) => Number.isFinite(fee.amount) && fee.amount >= 0 && fee.evidenceSource.trim())
    .map((fee) => ({
      code: fee.code,
      label: fee.label,
      amount: Math.round(fee.amount * 100) / 100,
      evidenceSource: fee.evidenceSource,
    }));
}

/**
 * Pricing projection only. Route authority remains the existing global-acceptance engine.
 * Unknown government/consular/federal fees are never guessed.
 */
export function projectAuthenticationPricing(params: {
  route: AcceptanceRoute;
  apostilleRequired?: boolean;
  approvedFees?: ApprovedAuthenticationFee[];
}): AuthenticationPricingProjection {
  const { route } = params;
  const approved = approvedItems(params.approvedFees ?? []);

  if (REVIEW_ROUTES.has(route)) {
    return {
      route,
      label: ROUTE_LABELS[route],
      status: "review_required",
      items: approved,
      clientNote:
        "Authentication scope requires Milano review before any unresolved authority or government fee is added to the Matter.",
    };
  }

  if (route === "hague_apostille" || route === "state_apostille" || route === "wet_ink_notary_plus_apostille") {
    const items = approved.length
      ? approved
      : params.apostilleRequired !== false
        ? [
            {
              code: "apostille_coordination",
              label: "Apostille Coordination",
              amount: MILANO_PRICING.addOns.apostilleCoordination,
              evidenceSource: "canonical_milano_pricing",
            },
          ]
        : [];

    return {
      route,
      label: ROUTE_LABELS[route],
      status: items.length ? "priced" : "not_required",
      items,
      clientNote:
        "The authentication route is shown separately from the Milano execution level and international courier.",
    };
  }

  if (
    route === "non_hague_consular_legalization" ||
    route === "federal_authentication" ||
    route === "state_authentication"
  ) {
    return {
      route,
      label: ROUTE_LABELS[route],
      status: approved.length ? "priced" : "pending_authority_confirmation",
      items: approved.length
        ? approved
        : [
            {
              code: "authority_fee_pending",
              label:
                route === "non_hague_consular_legalization"
                  ? "Government / Consular Fees"
                  : "Government / Authentication Fees",
              amount: null,
              evidenceSource: null,
            },
          ],
      clientNote: approved.length
        ? "Only approved, evidence-backed authority fees are included in the Matter total."
        : "Authority fees remain pending until the applicable government, federal, embassy, or consular requirement is confirmed.",
    };
  }

  return {
    route,
    label: ROUTE_LABELS[route],
    status: "review_required",
    items: approved,
    clientNote: "Authentication pricing requires Milano review.",
  };
}
