import fs from "node:fs";
const failures=[];
for(const f of ["lib/seo/phaseAuthority.ts","docs/seo/SEO_PHASE_LOCK.md","app/dashboard/seo-authority/page.tsx"]){if(!fs.existsSync(f)) failures.push(`missing ${f}`)}
const src=fs.readFileSync("lib/seo/phaseAuthority.ts","utf8");
const page=fs.readFileSync("app/dashboard/seo-authority/page.tsx","utf8");
const nav=fs.readFileSync("components/dashboard/milano-shell.tsx","utf8");
for(const text of ["/pricing","/secure-portal","/intake","/apostille/italy","/apostille/brazil","SEO_PHASE_2_TARGET = 60","SEO_PHASE_3_TARGET = 2400",'SEO_PHASE_3_STATUS = "staged_only"',"return false"]){if(!src.includes(text)) failures.push(`missing ${text}`)}
if(!page.includes("Programmatic Engine — Staged Only")) failures.push("page missing staged programmatic copy");
if(!nav.includes('/dashboard/seo-authority')) failures.push("nav missing seo authority");
if(failures.length){console.error(failures.join("\n"));process.exit(1)}
console.log("SEO phase authority validation passed.");
