import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/portal/",
          "/alliance/",
          "/va/",
          "/admin/",
          "/api/",
        ],
      },
    ],
    sitemap: "https://www.themilanoseal.com/sitemap.xml",
  };
}
