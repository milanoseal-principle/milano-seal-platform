import type { ConversionMatter, FollowUpCadence } from "./types";

export function getQuoteCadence(matter: Pick<ConversionMatter, "hoursSinceLastAction">): FollowUpCadence {
  if (matter.hoursSinceLastAction >= 168) return "7_days";
  if (matter.hoursSinceLastAction >= 72) return "72_hours";
  if (matter.hoursSinceLastAction >= 48) return "48_hours";
  return "24_hours";
}

export function isStaleQuote(matter: Pick<ConversionMatter, "hoursSinceLastAction" | "paymentConfirmed">) {
  return !matter.paymentConfirmed && matter.hoursSinceLastAction >= 168;
}
