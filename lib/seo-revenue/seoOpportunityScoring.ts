import type { ServicePageRevenueRecord } from "./types";

export function scoreSeoOpportunity(page: Pick<ServicePageRevenueRecord, "pageStatus" | "recommendedCta">) {
  let score = page.pageStatus === "review_ready" ? 70 : 50;
  if (page.recommendedCta.includes("Review") || page.recommendedCta.includes("Intake")) score += 10;
  return Math.min(score, 100);
}
