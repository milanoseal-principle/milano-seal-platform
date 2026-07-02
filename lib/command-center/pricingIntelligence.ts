import type { LaneType } from "./status";

// Command Center — INTERNAL pricing intelligence.
// Exact dollar amounts in INTERNAL_PRICING must never render on public pages.

export const INTERNAL_PRICING = {
  laneBase: { Signature: 750, Priority: 975, Executive: 1850 } satisfies Record<LaneType, number>,
  components: {
    additionalDocument: 75,
    additionalSigner: 150,
    notarizedSignature: 25,
    internationalSignerCoordination: 200,
    multiJurisdictionHandling: 300,
    firstApostille: 250,
    additionalApostille: 150,
    executiveInPersonStateHandling: 500,
    fbiApostilleCoordination: 750,
    expeditedTimelineSurcharge: 200,
    urgentSameDaySurcharge: 400,
    weekendExecutionPremium: 250,
    holidayExecutionPremium: 350,
    standardDomesticShipping: 45,
    expeditedDomesticShipping: 85,
    internationalShipping: 150,
  },
} as const;

export interface InternalQuoteInput {
  lane: LaneType;
  additionalDocuments?: number;
  additionalSigners?: number;
  notarizedSignatures?: number;
  needsInternationalSignerCoordination?: boolean;
  multiJurisdiction?: boolean;
  apostilles?: number;
  executiveInPersonStateHandling?: boolean;
  fbiApostille?: boolean;
  expeditedTimeline?: boolean;
  urgentSameDay?: boolean;
  weekendExecution?: boolean;
  holidayExecution?: boolean;
  shipping?: "none" | "standardDomestic" | "expeditedDomestic" | "international";
}

export function getLaneBasePrice(lane: LaneType): number {
  return INTERNAL_PRICING.laneBase[lane];
}

export function calculateInternalQuote(input: InternalQuoteInput) {
  const c = INTERNAL_PRICING.components;
  const lineItems = [
    { code: "lane", label: `${input.lane} lane`, amount: getLaneBasePrice(input.lane) },
    { code: "additional_documents", label: "Additional documents", amount: (input.additionalDocuments ?? 0) * c.additionalDocument },
    { code: "additional_signers", label: "Additional signers", amount: (input.additionalSigners ?? 0) * c.additionalSigner },
    { code: "notarized_signatures", label: "Notarized signatures", amount: (input.notarizedSignatures ?? 0) * c.notarizedSignature },
    { code: "international_signer", label: "International signer coordination", amount: input.needsInternationalSignerCoordination ? c.internationalSignerCoordination : 0 },
    { code: "multi_jurisdiction", label: "Multi-jurisdiction handling", amount: input.multiJurisdiction ? c.multiJurisdictionHandling : 0 },
    { code: "apostille", label: "Apostille coordination", amount: calculateApostilleAmount(input.apostilles ?? 0) },
    { code: "executive_state", label: "Executive in-person state handling", amount: input.executiveInPersonStateHandling ? c.executiveInPersonStateHandling : 0 },
    { code: "fbi_apostille", label: "FBI apostille coordination", amount: input.fbiApostille ? c.fbiApostilleCoordination : 0 },
    { code: "expedited", label: "Expedited timeline", amount: input.expeditedTimeline ? c.expeditedTimelineSurcharge : 0 },
    { code: "urgent", label: "Urgent / same-day handling", amount: input.urgentSameDay ? c.urgentSameDaySurcharge : 0 },
    { code: "weekend", label: "Weekend execution", amount: input.weekendExecution ? c.weekendExecutionPremium : 0 },
    { code: "holiday", label: "Holiday execution", amount: input.holidayExecution ? c.holidayExecutionPremium : 0 },
    { code: "shipping", label: "Shipping path", amount: calculateShippingAmount(input.shipping ?? "none") },
  ].filter((item) => item.amount > 0);

  const total = lineItems.reduce((sum, item) => sum + item.amount, 0);
  return { lineItems, total };
}

function calculateApostilleAmount(apostilles: number): number {
  if (apostilles <= 0) return 0;
  return INTERNAL_PRICING.components.firstApostille + Math.max(0, apostilles - 1) * INTERNAL_PRICING.components.additionalApostille;
}

function calculateShippingAmount(shipping: NonNullable<InternalQuoteInput["shipping"]>): number {
  if (shipping === "standardDomestic") return INTERNAL_PRICING.components.standardDomesticShipping;
  if (shipping === "expeditedDomestic") return INTERNAL_PRICING.components.expeditedDomesticShipping;
  if (shipping === "international") return INTERNAL_PRICING.components.internationalShipping;
  return 0;
}

export function getPublicQuoteFactors(): string[] {
  return [
    "document type",
    "origin jurisdiction",
    "signer location",
    "destination country",
    "urgency",
    "apostille needs",
    "witness needs",
    "final packet requirements",
  ];
}

export function getServiceComponents(): string[] {
  return [
    "secure records intake",
    "document execution coordination",
    "remote online notarization review for eligible documents",
    "apostille coordination",
    "witness coordination",
    "international courier release planning",
  ];
}

export function getExecutionPathCopy(): string[] {
  return [
    "Every quote is reviewed through Smart Intake before execution is scheduled.",
    "Payment authorization controls scheduling readiness; final release remains controlled by the payment and records gates.",
    "Receiving-authority expectations are reviewed as operational routing information, not legal advice or guaranteed acceptance.",
  ];
}
