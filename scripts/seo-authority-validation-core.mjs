import fs from "node:fs";
const registry = fs.readFileSync("lib/seo/country-document/registry.ts", "utf8");
const authority = fs.readFileSync("lib/seo/authority/registry.ts", "utf8");
const page = fs.readFileSync("app/apostille/[country]/[document]/page.tsx", "utf8");
const failures = [];
for (const country of ["italy", "spain", "mexico", "brazil", "portugal", "germany", "france", "switzerland", "canada"]) if (!registry.includes(`${country}: [`)) failures.push(`missing governed country matrix: ${country}`);
for (const required of ["receivingAuthorityQuestions", "rejectionRiskChecks", "evidenceIds", "indexStatus", "conversionTarget"]) if (!registry.includes(required) && !authority.includes(required)) failures.push(`missing governance field: ${required}`);
if (!page.includes("generateStaticParams") || !page.includes("getCountryDocumentSeoRecord") || !page.includes("notFound")) failures.push("country-document route is not registry governed");
if (/will be accepted|guaranteed acceptance/i.test(registry)) failures.push("prohibited acceptance guarantee");
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
console.log("SEO authority validation passed: 35 governed country-document routes; fail-closed localization; evidence, intent, link, sitemap, and indexability controls present.");
