import type { MetadataRoute } from "next";
import { PREMIUM_CORRIDORS } from "@/lib/seo-premium-corridors";

const BASE_URL = "https://www.themilanoseal.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: `${BASE_URL}/professional`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.98,
    },
    ...PREMIUM_CORRIDORS.map((corridor) => ({
      url: `${BASE_URL}/professional/${corridor.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: corridor.slug === "italy" ? 0.97 : 0.94,
    })),
  ];
}
