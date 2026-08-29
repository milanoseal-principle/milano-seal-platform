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
