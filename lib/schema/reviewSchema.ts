export function buildProfessionalServiceSchema({
  includeAggregateRating = false,
  ratingValue,
  reviewCount,
}: {
  includeAggregateRating?: boolean;
  ratingValue?: number;
  reviewCount?: number;
}): Record<string, unknown> {
  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "The Milano Seal",
    url: "https://www.themilanoseal.com",
    serviceType:
      "International notary, apostille, and document execution coordination",
    areaServed: "Global",
  };

  if (
    includeAggregateRating === true &&
    ratingValue !== undefined &&
    reviewCount !== undefined &&
    reviewCount > 0
  ) {
    base.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue,
      reviewCount,
    };
  }

  return base;
}
