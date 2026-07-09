export type ServicePageStatus = "draft" | "review_ready" | "published" | "needs_safety_review";

export type ServicePageRevenueRecord = {
  slug: string;
  title: string;
  targetClientType: string;
  revenueLane: string;
  recommendedCta: string;
  intakeSourceSlug: string;
  pageStatus: ServicePageStatus;
  nextContentAction: string;
  safetyStatus: string;
};
