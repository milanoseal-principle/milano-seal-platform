import fs from "node:fs";

const sitemapSource = fs.readFileSync("app/apostille/sitemap.ts", "utf8");
const forbiddenImports = [
  "COUNTRY_DOCUMENT_SEO_RECORDS",
  "buildCountryDocumentSitemap",
  "sitemapEligiblePages",
];
const present = forbiddenImports.filter((name) => sitemapSource.includes(name));

if (present.length) {
  console.error(`Review-required country-document candidates are wired into the sitemap: ${present.join(", ")}`);
  process.exit(1);
}

console.log("SEO sitemap validation passed: no review-required country-document candidates are wired into the sitemap.");
import fs from "node:fs"; const source = fs.readFileSync("lib/seo/sitemap/buildSeoSitemap.ts", "utf8"); if (!source.includes('record.indexStatus === "INDEXABLE"')) { console.error("SEO sitemap does not filter indexability"); process.exit(1); } console.log("SEO sitemap validation passed: governed INDEXABLE records only.");
