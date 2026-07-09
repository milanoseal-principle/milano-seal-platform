import type { ConversionMatter } from "./types";

export const internalSampleConversionMatters: ConversionMatter[] = [
  {
    id: "sample-conv-001",
    matter: "Internal sample: Italy POA packet",
    stage: "awaiting_payment",
    clientType: "international",
    quotedValue: 950,
    hoursSinceLastAction: 26,
    paymentConfirmed: false,
    nextAction: "Send 24-hour payment-before-scheduling reminder",
    sample: true,
  },
  {
    id: "sample-conv-002",
    matter: "Internal sample: attorney referral packet",
    stage: "quote_sent",
    clientType: "attorney",
    quotedValue: 1250,
    hoursSinceLastAction: 52,
    paymentConfirmed: false,
    nextAction: "Founder high-value follow-up",
    sample: true,
  },
];

export function isSchedulingUnlocked(matter: Pick<ConversionMatter, "paymentConfirmed">) {
  return matter.paymentConfirmed;
}

export function getPaymentRecoveryQueue(matters = internalSampleConversionMatters) {
  return matters.filter((matter) => !matter.paymentConfirmed && ["quote_sent", "awaiting_payment"].includes(matter.stage));
}
