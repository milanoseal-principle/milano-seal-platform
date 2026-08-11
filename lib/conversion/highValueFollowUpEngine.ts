import { internalSampleConversionMatters } from "./paymentRecoveryEngine";

export function getFounderHighValueFollowUps(threshold = 1000) {
  return internalSampleConversionMatters.filter((matter) => matter.quotedValue >= threshold && !matter.paymentConfirmed);
}
