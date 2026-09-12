import type { LaneType } from "./status";
import {
  DOCUMENT_FEES,
  LANGUAGE_PREP_FEES,
  MATTER_BASES,
  MOBILE_TRAVEL_FEES,
  NOTARY_SIGNER_FEES,
  SPECIAL_HANDLING_FEES,
  TIMING_FEES,
} from "../pricing/pricingCatalog";
import { composeCanonicalPrivateQuote } from "../pricing/pricingComposer";

// Command Center — INTERNAL pricing intelligence.
// Exact dollar amounts must never render on public pages.
// All monetary values derive from the canonical private pricing catalog.

export const INTERNAL_PRICING = {
  laneBase: {
    Signature: MATTER_BASES.signature.amount,
    Priority: MATTER_BASES.priority.amount,
    Executive: MATTER_BASES.executive.amount,
  } satisfies Record<LaneType, number>,
  matterBase: {
    Authentication: MATTER_BASES.authentication.amount,
    Signature: MATTER_BASES.signature.amount,
    Priority: MATTER_BASES.priority.amount,
    Executive: MATTER_BASES.executive.amount,
    InternationalPassportExecution: MATTER_BASES.international_passport_execution.amount,
  },
  components: {
    additionalDocument: DOCUMENT_FEES.additional_non_apostille_document,
    additionalSigner: NOTARY_SIGNER_FEES.additional_signer,
    notarizedSignature: NOTARY_SIGNER_FEES.additional_notarized_signature_tracking,
    floridaNotarialAct: NOTARY_SIGNER_FEES.florida_notarial_act,
    remoteWitness: NOTARY_SIGNER_FEES.remote_witness,
    inPersonWitness: NOTARY_SIGNER_FEES.in_person_witness,
    internationalSignerCoordination: NOTARY_SIGNER_FEES.international_signer_coordination,
    multiJurisdictionHandling: DOCUMENT_FEES.multi_jurisdiction_handling,
    firstApostille: 0,
    additionalApostille: DOCUMENT_FEES.additional_apostilled_document,
    executiveInPersonStateHandling:
      SPECIAL_HANDLING_FEES.executive_in_person_state_handling,
    fbiApostilleCoordination: DOCUMENT_FEES.fbi_federal_apostille_coordination,
    expeditedTimelineSurcharge: TIMING_FEES.expedited,
    urgentSameDaySurcharge: TIMING_FEES.rush_same_day,
    afterHoursEveningPremium: TIMING_FEES.after_hours_evening,
    weekendExecutionPremium: TIMING_FEES.weekend,
    holidayExecutionPremium: TIMING_FEES.holiday,
    mobileTravelLocalRadiusMiles: MOBILE_TRAVEL_FEES.local_radius_miles,
    mobileTravel11To25: MOBILE_TRAVEL_FEES.tier_11_25,
    mobileTravel26To50: MOBILE_TRAVEL_FEES.tier_26_50,
    translationCoordination: LANGUAGE_PREP_FEES.translation_coordination,
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
}

export function getLaneBasePrice(lane: LaneType): number {
  return INTERNAL_PRICING.laneBase[lane];
}

export function calculateInternalQuote(input: InternalQuoteInput) {
  const matterBase =
    input.lane === "Executive"
      ? "executive"
      : input.lane === "Priority"
        ? "priority"
        : "signature";

  const result = composeCanonicalPrivateQuote({
    matterBase,
    documentCount: 1 + Math.max(0, input.additionalDocuments ?? 0),
    apostilleCount: Math.max(0, input.apostilles ?? 0),
    signerCount: 1 + Math.max(0, input.additionalSigners ?? 0),
    additionalNotarizedSignatureTrackingCount: Math.max(
      0,
      input.notarizedSignatures ?? 0,
    ),
    internationalSignerCount: input.needsInternationalSignerCoordination ? 1 : 0,
    jurisdictionCount: input.multiJurisdiction ? 3 : 1,
    executiveInPersonStateHandling: input.executiveInPersonStateHandling,
    fbiFederalApostille: input.fbiApostille,
    timing: [
      ...(input.expeditedTimeline ? (["expedited"] as const) : []),
      ...(input.urgentSameDay ? (["rush_same_day"] as const) : []),
      ...(input.weekendExecution ? (["weekend"] as const) : []),
      ...(input.holidayExecution ? (["holiday"] as const) : []),
      ...(!input.expeditedTimeline &&
      !input.urgentSameDay &&
      !input.weekendExecution &&
      !input.holidayExecution
        ? (["standard"] as const)
        : []),
    ],
  });

  return {
    lineItems: result.lineItems.map((item) => ({
      code: item.code,
      label: item.label,
      amount: item.amount,
    })),
    total: result.total,
  };
}

export function getPublicQuoteFactors(): string[] {
  return [
    "document type",
    "origin jurisdiction",
    "signer location",
    "destination country",
    "execution method",
    "urgency",
    "apostille or authentication needs",
    "witness needs",
    "final packet and courier requirements",
  ];
}

export function getServiceComponents(): string[] {
  return [
    "secure records intake",
    "document route and readiness review",
    "RON or in-person execution coordination when required",
    "apostille or authentication coordination",
    "witness coordination when required",
    "controlled custody and international release planning",
    "Matter status visibility",
  ];
}

export function getExecutionPathCopy(): string[] {
  return [
    "Every quote is reviewed through Smart Intake before execution is scheduled.",
    "For split-payment Matters, the verified 50% Wise deposit unlocks scheduling and execution.",
    "The final 50% must be verified before international release or shipping.",
    "Receiving-authority expectations are reviewed as operational routing information, not legal advice or guaranteed acceptance.",
  ];
}
