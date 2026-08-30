import type { MetadataRoute } from "next";

const BASE_URL = "https://www.themilanoseal.com";

const authorityPages = [
  { path: "/about", priority: 0.9 },
  { path: "/founder", priority: 0.92 },
  { path: "/pricing", priority: 0.9 },
  { path: "/process", priority: 0.92 },
  { path: "/global-document-intelligence", priority: 0.95 },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return authorityPages.map(({ path, priority }) => ({
    url: `${BASE_URL}${path}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority,
  }));
}
