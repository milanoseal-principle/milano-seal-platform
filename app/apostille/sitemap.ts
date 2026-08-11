import type { MetadataRoute } from "next";
import { COUNTRY_REGISTRY } from "@/lib/compliance/countries";
import { isPremiumCorridor } from "@/lib/seo-premium-corridors";

const BASE_URL = "https://www.themilanoseal.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return COUNTRY_REGISTRY.map((country) => ({
    url: `${BASE_URL}/apostille/${country.slug}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: isPremiumCorridor(country.slug) ? 0.95 : 0.82,
  }));
}
