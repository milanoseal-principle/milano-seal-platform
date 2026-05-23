import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/intake",
        "/map",
        "/pricing",
        "/about",
        "/founder",
        "/consular-authentication",
        "/jurisdictions/",
        "/apostille/",
        "/documents/",
        "/services/",
        "/international-affidavit",
        "/affidavit-name-discrepancy",
        "/power-of-attorney-international",
        "/alliance",
        "/alliance/foreign-attorneys",
        "/alliance/immigration-attorneys",
        "/alliance/real-estate-attorneys",
        "/alliance/international-partners",
        "/alliance/referral-partners",
      ],
      disallow: [
        "/dashboard/",
        "/portal/",
        "/admin/",
        "/operator/",
        "/sovereignos/",
        "/alliance/login",
        "/alliance/matters",
        "/alliance/tracking",
        "/api/",
        "/auth/",
        "/login",
      ],
    },
    sitemap: "https://themilanoseal.com/sitemap.xml",
  };
}
