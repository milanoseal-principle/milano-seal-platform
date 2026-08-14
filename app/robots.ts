import { MetadataRoute } from "next";

const privatePaths = [
  "/dashboard",
  "/dashboard/",
  "/va",
  "/va/",
  "/api/",
  "/portal",
  "/portal/",
  "/alliance/",
  "/admin/",
  "/operator/",
];

const publicPaths = [
  "/",
  "/intake",
  "/map",
  "/services",
  "/countries",
  "/documents",
  "/guides",
  "/florida",
  "/tampa",
  "/st-petersburg",
  "/clearwater",
  "/largo",
  "/palm-harbor",
  "/dunedin",
  "/oldsmar",
  "/westchase",
  "/brandon",
  "/new-port-richey",
  "/trinity",
  "/wesley-chapel",
  "/land-o-lakes",
  "/sarasota",
  "/bradenton",
  "/lakewood-ranch",
  "/about",
  "/founder",
  "/verticals",
  "/apostille",
  "/professional",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "OAI-SearchBot",
        allow: publicPaths,
        disallow: privatePaths,
      },
      {
        userAgent: "PerplexityBot",
        allow: publicPaths,
        disallow: privatePaths,
      },
      {
        userAgent: "DuckDuckBot",
        allow: publicPaths,
        disallow: privatePaths,
      },
      {
        userAgent: "*",
        allow: publicPaths,
        disallow: privatePaths,
      },
    ],
    sitemap: [
      "https://www.themilanoseal.com/sitemap.xml",
      "https://www.themilanoseal.com/apostille/sitemap.xml",
      "https://www.themilanoseal.com/professional/sitemap.xml",
    ],
  };
}
